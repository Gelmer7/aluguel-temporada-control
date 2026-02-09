-- Script para atualizar as tabelas expenses e tithes para o novo padrão camelCase total
-- ==========================================
-- 1. ATUALIZAR TABELA EXPENSES
-- ==========================================

DO $$
BEGIN
    -- Renomear colunas de snake_case para camelCase
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

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'house_code') THEN
        ALTER TABLE expenses RENAME COLUMN house_code TO "houseCode";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'create_date') THEN
        ALTER TABLE expenses RENAME COLUMN create_date TO "createDate";
    END IF;
END $$;

-- Garantir que todas as colunas existem com o nome correto (camelCase com aspas)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "price" NUMERIC DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "observation" TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "purchaseDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "cubicMeters" NUMERIC DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "reserveFund" NUMERIC DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "association" NUMERIC DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "kws" NUMERIC DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "houseCode" TEXT DEFAULT 'CASA_47';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "createUser" TEXT DEFAULT 'gelmer7@gmail.com';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS "createDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- 2. ATUALIZAR TABELA TITHES
-- ==========================================

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

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'house_code') THEN
        ALTER TABLE tithes RENAME COLUMN house_code TO "houseCode";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'created_by') THEN
        ALTER TABLE tithes RENAME COLUMN created_by TO "createUser";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tithes' AND column_name = 'create_date') THEN
        ALTER TABLE tithes RENAME COLUMN create_date TO "createDate";
    END IF;
END $$;

ALTER TABLE tithes ADD COLUMN IF NOT EXISTS "houseCode" TEXT DEFAULT 'CASA_47';
ALTER TABLE tithes ADD COLUMN IF NOT EXISTS "createUser" TEXT DEFAULT 'gelmer7@gmail.com';
ALTER TABLE tithes ADD COLUMN IF NOT EXISTS "createDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- 3. ATUALIZAR TABELA AIRBNB_LOGS
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airbnb_logs' AND column_name = 'created_by') THEN
        ALTER TABLE airbnb_logs RENAME COLUMN created_by TO "createUser";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airbnb_logs' AND column_name = 'house_code') THEN
        ALTER TABLE airbnb_logs RENAME COLUMN house_code TO "houseCode";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airbnb_logs' AND column_name = 'unique_key') THEN
        ALTER TABLE airbnb_logs RENAME COLUMN unique_key TO "uniqueKey";
    END IF;
END $$;

ALTER TABLE airbnb_logs ADD COLUMN IF NOT EXISTS "houseCode" TEXT DEFAULT 'CASA_47';
ALTER TABLE airbnb_logs ADD COLUMN IF NOT EXISTS "createUser" TEXT DEFAULT 'gelmer7@gmail.com';

-- ==========================================
-- 4. ÍNDICES E PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_expenses_houseCode ON expenses("houseCode");
CREATE INDEX IF NOT EXISTS idx_tithes_houseCode ON tithes("houseCode");
CREATE INDEX IF NOT EXISTS idx_airbnb_logs_houseCode ON airbnb_logs("houseCode");
