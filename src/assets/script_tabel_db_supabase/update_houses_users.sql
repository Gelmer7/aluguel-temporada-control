-- Script para adicionar colunas de controle por casa e usuário

-- 1. Atualizar tabela expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS house_code TEXT DEFAULT 'CASA_47',
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'admin';

-- 2. Atualizar tabela airbnb_logs
ALTER TABLE airbnb_logs 
ADD COLUMN IF NOT EXISTS house_code TEXT DEFAULT 'CASA_47',
ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'admin';

-- 3. (Opcional) Criar índices para melhorar a performance das buscas por casa
CREATE INDEX IF NOT EXISTS idx_expenses_house_code ON expenses(house_code);
CREATE INDEX IF NOT EXISTS idx_airbnb_logs_house_code ON airbnb_logs(house_code);

-- 4. (Opcional) Comentários para documentação
COMMENT ON COLUMN expenses.house_code IS 'Código identificador da casa (ex: CASA_47, CASA_08)';
COMMENT ON COLUMN expenses.created_by IS 'ID ou login do usuário que criou o registro';
COMMENT ON COLUMN airbnb_logs.house_code IS 'Código identificador da casa (ex: CASA_47, CASA_08)';
COMMENT ON COLUMN airbnb_logs.created_by IS 'ID ou login do usuário que criou o registro';
