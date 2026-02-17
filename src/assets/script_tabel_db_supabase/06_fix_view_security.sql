-- =============================================================================
-- SCRIPT 06: Corrigir View Security Definer
-- Descrição: Recria a view v_unified_earnings com security_invoker=on
--            Isso garante que a view respeite as políticas RLS do usuário.
-- =============================================================================

DROP VIEW IF EXISTS v_unified_earnings;

CREATE OR REPLACE VIEW v_unified_earnings WITH (security_invoker=on) AS
-- 1. Parte do Anfitrião
SELECT
    l.id,
    l.data::DATE as data,
    CASE
        WHEN l.tipo LIKE 'Payout/%' THEN REPLACE(l.tipo, 'Payout/', '')
        ELSE l.tipo
    END as tipo,
    (NULLIF(l.raw_data->>'Data de início', ''))::DATE as data_inicio,
    (NULLIF(l.raw_data->>'Data de término', ''))::DATE as data_termino,
    l.noites,
    l.hospede,
    l.anuncio,
    l.valor as valor,
    COALESCE(l.pago, 0) as pago,
    l.taxa_limpeza,
    'Airbnb' as fonte,
    l.house_code,
    l.codigo_confirmacao
FROM airbnb_logs l
WHERE l.tipo NOT IN ('Recebimento do coanfitrião', 'Payout')

UNION ALL

-- 2. Parte do Co-anfitrião
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
    COALESCE(l.pago, ABS(l.valor)) as pago,
    0 as taxa_limpeza,
    'Airbnb' as fonte,
    l.house_code,
    l.codigo_confirmacao
FROM airbnb_logs l
WHERE l.tipo = 'Recebimento do coanfitrião'

UNION ALL

-- 3. Aluguéis Manuais
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
