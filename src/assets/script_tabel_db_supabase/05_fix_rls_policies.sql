-- =============================================================================
-- SCRIPT 05: Corrigir Políticas RLS para Visualização de Dados
-- Descrição: Substitui as políticas restritas por usuário (user_id) por
--            políticas baseadas em autenticação ou acesso à casa.
--            Isso resolve o problema de retornar 0 itens se o user_id não bater.
-- =============================================================================

-- 1. Tabela: expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;

-- Nova política: Permite visualização para qualquer usuário autenticado
-- (Ideal para dev/test. Para produção, usar filtro por house_permissions)
CREATE POLICY "Authenticated users can view expenses"
ON expenses FOR SELECT
USING (auth.role() = 'authenticated');

-- Manter as políticas de escrita restritas ao dono (opcional, pode relaxar também se quiser)
-- CREATE POLICY "Authenticated users can insert expenses" ...


-- 2. Tabela: airbnb_logs
DROP POLICY IF EXISTS "Users can view own airbnb_logs" ON airbnb_logs;

CREATE POLICY "Authenticated users can view airbnb_logs"
ON airbnb_logs FOR SELECT
USING (auth.role() = 'authenticated');


-- 3. Tabela: manual_rentals
DROP POLICY IF EXISTS "Users can view own manual_rentals" ON manual_rentals;

CREATE POLICY "Authenticated users can view manual_rentals"
ON manual_rentals FOR SELECT
USING (auth.role() = 'authenticated');


-- 4. Tabela: tithes
DROP POLICY IF EXISTS "Users can view own tithes" ON tithes;

CREATE POLICY "Authenticated users can view tithes"
ON tithes FOR SELECT
USING (auth.role() = 'authenticated');

-- =============================================================================
-- NOTA SOBRE CAMELCASE:
-- Se você executou o script 'update_tables_camel_case.sql', as colunas
-- mudaram de 'house_code' para 'houseCode'.
-- O código do frontend (SupabaseService) parece estar usando 'house_code' (snake_case).
-- Verifique se as colunas no banco estão como 'house_code' ou 'houseCode'.
-- Se estiverem como 'houseCode', você precisará atualizar o SupabaseService.ts
-- para usar .eq('houseCode', ...).
-- =============================================================================
