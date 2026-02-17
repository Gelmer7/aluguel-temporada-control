-- =============================================================================
-- SCRIPT 02: Adicionar Coluna user_id nas Tabelas de Dados
-- Descrição: Adiciona a coluna user_id (FK para auth.users) nas tabelas
--            principais para permitir o funcionamento das políticas RLS.
-- Autor: Sistema Airbnb 2.0
-- Data: 2026-02-16
-- =============================================================================

-- 1. Tabela: airbnb_logs
ALTER TABLE airbnb_logs
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_airbnb_logs_user_id ON airbnb_logs(user_id);


-- 2. Tabela: manual_rentals
ALTER TABLE manual_rentals
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_manual_rentals_user_id ON manual_rentals(user_id);


-- 3. Tabela: expenses
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);


-- 4. Tabela: tithes
ALTER TABLE tithes
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_tithes_user_id ON tithes(user_id);

-- =============================================================================
-- FIM DO SCRIPT
-- Instruções:
-- 1. Execute este script PRIMEIRO para criar as colunas.
-- 2. DEPOIS execute o script '03_enable_rls_data_tables.sql' novamente.
-- =============================================================================
