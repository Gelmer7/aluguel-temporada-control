-- Tabela para registros de aluguéis manuais (fora do Airbnb)
CREATE TABLE IF NOT EXISTS manual_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_pagamento DATE NOT NULL,
    tipo TEXT DEFAULT 'Aluguel temporada',
    data_reserva DATE NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    noites INTEGER NOT NULL CHECK (noites > 0),
    hospede TEXT NOT NULL,
    anuncio TEXT DEFAULT 'Casa 47' NOT NULL,
    informacoes TEXT,
    moeda TEXT DEFAULT 'BRL',
    valor_pago NUMERIC NOT NULL CHECK (valor_pago > 0),
    taxa_limpeza NUMERIC NOT NULL CHECK (taxa_limpeza >= 0),
    house_code TEXT DEFAULT 'CASA_47',
    create_user TEXT DEFAULT 'gelmer7@gmail.com',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE manual_rentals ENABLE ROW LEVEL SECURITY;

-- Política de acesso total
DROP POLICY IF EXISTS "Acesso total manual_rentals" ON manual_rentals;
CREATE POLICY "Acesso total manual_rentals" ON manual_rentals
FOR ALL USING (true) WITH CHECK (true);

-- View para unificar ganhos do Airbnb e Aluguéis Manuais
-- Esta view simplifica o fluxo do Airbnb transformando as múltiplas linhas (Reserva, Payout, Recebimento)
-- em duas entradas claras e positivas: uma para o Anfitrião e outra para o Co-anfitrião.
DROP VIEW IF EXISTS v_unified_earnings;

CREATE OR REPLACE VIEW v_unified_earnings AS
WITH cohost_sums AS (
    -- Agrupa os valores pagos aos co-anfitriões por código de confirmação
    -- Os valores no CSV do Airbnb para co-anfitrião são negativos, por isso somamos
    SELECT 
        codigo_confirmacao,
        SUM(valor) as total_cohost_negativo,
        house_code
    FROM airbnb_logs
    WHERE tipo = 'Recebimento do coanfitrião'
    GROUP BY codigo_confirmacao, house_code
)
-- 1. Parte do Anfitrião (Derivada da linha de 'Reserva')
-- O valor recebido pelo anfitrião é o total da reserva menos o que foi para o co-anfitrião
SELECT
    l.id,
    l.data::DATE as data,
    'Pagamento Anfitrião' as tipo,
    (NULLIF(l.raw_data->>'Data de início', ''))::DATE as data_inicio,
    (NULLIF(l.raw_data->>'Data de término', ''))::DATE as data_termino,
    l.noites,
    l.hospede,
    l.anuncio,
    (l.valor + COALESCE(c.total_cohost_negativo, 0)) as valor,
    (l.valor + COALESCE(c.total_cohost_negativo, 0)) as pago,
    l.taxa_limpeza,
    'Airbnb' as fonte,
    l.house_code,
    l.codigo_confirmacao
FROM airbnb_logs l
LEFT JOIN cohost_sums c ON l.codigo_confirmacao = c.codigo_confirmacao AND l.house_code = c.house_code
WHERE l.tipo = 'Reserva'

UNION ALL

-- 2. Parte do Co-anfitrião (Derivada da linha de 'Recebimento do coanfitrião')
-- Transformamos o valor negativo em positivo para visualização simples
SELECT
    l.id,
    l.data::DATE as data,
    'Pagamento Co-anfitrião' as tipo,
    (NULLIF(l.raw_data->>'Data de início', ''))::DATE as data_inicio,
    (NULLIF(l.raw_data->>'Data de término', ''))::DATE as data_termino,
    l.noites,
    l.hospede,
    l.anuncio,
    ABS(l.valor) as valor,
    ABS(l.valor) as pago,
    0 as taxa_limpeza,
    'Airbnb' as fonte,
    l.house_code,
    l.codigo_confirmacao
FROM airbnb_logs l
WHERE l.tipo = 'Recebimento do coanfitrião'

UNION ALL

-- 3. Aluguéis Manuais (Permanecem inalterados)
SELECT
    id,
    data_pagamento as data,
    tipo,
    data_inicio,
    data_termino,
    noites,
    hospede,
    anuncio,
    valor_pago as valor,
    valor_pago as pago,
    taxa_limpeza,
    'Manual' as fonte,
    house_code,
    NULL as codigo_confirmacao
FROM manual_rentals;
