-- =============================================================================
-- SCRIPT 03: Habilitar RLS nas Tabelas de Dados e Criar Políticas
-- Descrição: Configura Row Level Security (RLS) para garantir que usuários
--            só acessem dados que eles criaram (user_id).
-- Autor: Sistema Airbnb 2.0
-- Data: 2026-02-16
-- =============================================================================

-- 1. Tabela: airbnb_logs
ALTER TABLE airbnb_logs ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Usuário vê apenas seus próprios registros
CREATE POLICY "Users can view own airbnb_logs" 
ON airbnb_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Política de Inserção: Usuário pode inserir, e o user_id deve ser o dele
CREATE POLICY "Users can insert own airbnb_logs" 
ON airbnb_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política de Atualização: Usuário pode atualizar seus próprios registros
CREATE POLICY "Users can update own airbnb_logs" 
ON airbnb_logs FOR UPDATE 
USING (auth.uid() = user_id);

-- Política de Exclusão: Usuário pode deletar seus próprios registros
CREATE POLICY "Users can delete own airbnb_logs" 
ON airbnb_logs FOR DELETE 
USING (auth.uid() = user_id);


-- 2. Tabela: manual_rentals
ALTER TABLE manual_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own manual_rentals" 
ON manual_rentals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own manual_rentals" 
ON manual_rentals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own manual_rentals" 
ON manual_rentals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own manual_rentals" 
ON manual_rentals FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Tabela: expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" 
ON expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" 
ON expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" 
ON expenses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" 
ON expenses FOR DELETE 
USING (auth.uid() = user_id);


-- 4. Tabela: tithes
ALTER TABLE tithes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tithes" 
ON tithes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tithes" 
ON tithes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tithes" 
ON tithes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tithes" 
ON tithes FOR DELETE 
USING (auth.uid() = user_id);

-- =============================================================================
-- FIM DO SCRIPT
-- Instruções: Execute este script no SQL Editor do Supabase Dashboard.
-- =============================================================================
