-- Script para atualizar as tabelas expenses e tithes para o novo padrão camelCase e alinhar com o JSON antigo

-- ==========================================
-- 1. ATUALIZAR TABELA EXPENSES
-- ==========================================

-- Renomear colunas existentes de snake_case para camelCase (se existirem)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'purchase_date') THEN
        ALTER TABLE expenses RENAME COLUMN purchase_date TO "purchaseDate";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'cubic_meters') THEN
        ALTER TABLE expenses RENAME COLUMN cubic_meters TO "cubicMeters";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'reserve_fund') THEN
        ALTER TABLE expenses RENAME COLUMN reserve_fund TO "reserveFund";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'created_by') THEN
        ALTER TABLE expenses RENAME COLUMN created_by TO "createUser";
    END IF;
END $$;

-- Adicionar novas colunas se não existirem
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS association NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS kws NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS house_code TEXT DEFAULT 'CASA_47',
ADD COLUMN IF NOT EXISTS "createUser" TEXT DEFAULT 'gelmer7@gmail.com',
ADD COLUMN IF NOT EXISTS "createDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Garantir que as colunas obrigatórias estão no formato correto
-- Nota: Usamos aspas duplas para preservar o camelCase no PostgreSQL
ALTER TABLE expenses ALTER COLUMN price SET DEFAULT 0;
ALTER TABLE expenses ALTER COLUMN description SET NOT NULL;

-- ==========================================
-- 2. ATUALIZAR TABELA TITHES
-- ==========================================

-- Renomear colunas existentes de snake_case para camelCase (se existirem)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'month_year') THEN
        ALTER TABLE tithes RENAME COLUMN month_year TO "monthYear";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'airbnb_gross') THEN
        ALTER TABLE tithes RENAME COLUMN airbnb_gross TO "airbnbGross";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'tithe_value') THEN
        ALTER TABLE tithes RENAME COLUMN tithe_value TO "titheValue";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'offer_value') THEN
        ALTER TABLE tithes RENAME COLUMN offer_value TO "offerValue";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'total_paid') THEN
        ALTER TABLE tithes RENAME COLUMN total_paid TO "totalPaid";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'created_by') THEN
        ALTER TABLE tithes RENAME COLUMN created_by TO "createUser";
    END IF;
END $$;

-- Adicionar novas colunas se não existirem
ALTER TABLE tithes 
ADD COLUMN IF NOT EXISTS house_code TEXT DEFAULT 'CASA_47',
ADD COLUMN IF NOT EXISTS "createUser" TEXT DEFAULT 'gelmer7@gmail.com',
ADD COLUMN IF NOT EXISTS "createDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- 3. ATUALIZAR TABELA AIRBNB_LOGS
-- ==========================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airbnb_logs' AND column_name = 'created_by') THEN
        ALTER TABLE airbnb_logs RENAME COLUMN created_by TO "createUser";
    END IF;
END $$;

ALTER TABLE airbnb_logs 
ADD COLUMN IF NOT EXISTS house_code TEXT DEFAULT 'CASA_47',
ADD COLUMN IF NOT EXISTS "createUser" TEXT DEFAULT 'gelmer7@gmail.com';

-- ==========================================
-- 4. ÍNDICES E PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_expenses_house_code ON expenses(house_code);
CREATE INDEX IF NOT EXISTS idx_tithes_house_code ON tithes(house_code);
CREATE INDEX IF NOT EXISTS idx_airbnb_logs_house_code ON airbnb_logs(house_code);
