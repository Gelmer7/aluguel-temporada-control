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
CREATE POLICY "Acesso total manual_rentals" ON manual_rentals
FOR ALL USING (true) WITH CHECK (true);

-- View para unificar ganhos do Airbnb e Aluguéis Manuais
-- Ajustado para usar 'house_code' (snake_case) conforme estrutura atual do banco
-- Remover a view antiga primeiro
DROP VIEW IF EXISTS v_unified_earnings;

-- Recriar a View com tratamento para strings vazias no JSON
CREATE OR REPLACE VIEW v_unified_earnings AS
SELECT
    id,
    data::DATE as data,
    tipo,
    (NULLIF(raw_data->>'Data de início', ''))::DATE as data_inicio,
    (NULLIF(raw_data->>'Data de término', ''))::DATE as data_termino,
    noites,
    hospede,
    anuncio,
    valor,
    (NULLIF(raw_data->>'Pago', ''))::NUMERIC as pago,
    taxa_limpeza,
    'Airbnb' as fonte,
    house_code
FROM airbnb_logs
UNION ALL
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
    house_code
FROM manual_rentals;
