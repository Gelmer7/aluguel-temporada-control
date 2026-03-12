-- ==============================================================================
-- FASE 6: ATUALIZAÇÃO DA TABELA HOUSES PARA CRUD COMPLETO
-- ==============================================================================
-- Este script adiciona colunas JSONB para maior flexibilidade em 5 casas
-- e cria a tabela de fotos relacionada.

-- 1. ATUALIZAR TABELA HOUSES
ALTER TABLE public.houses
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS pricing JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS check_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. CRIAR TABELA DE FOTOS
CREATE TABLE IF NOT EXISTS public.house_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  house_code TEXT REFERENCES public.houses(code) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  is_cover BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. HABILITAR RLS EM FOTOS
ALTER TABLE public.house_photos ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES PARA FOTOS
-- Usuários autenticados podem ver fotos das casas às quais têm acesso
CREATE POLICY "Usuários veem fotos das casas que têm permissão" ON public.house_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.house_permissions
      WHERE house_code = house_photos.house_code
      AND user_id = auth.uid()
    )
  );

-- Apenas admins podem modificar fotos (ou conforme sua lógica de permissões)
CREATE POLICY "Apenas administradores podem inserir fotos" ON public.house_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.house_permissions
      WHERE house_code = house_photos.house_code
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Apenas administradores podem atualizar fotos" ON public.house_photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.house_permissions
      WHERE house_code = house_photos.house_code
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Apenas administradores podem deletar fotos" ON public.house_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.house_permissions
      WHERE house_code = house_photos.house_code
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- 5. TRIGGER PARA UPDATED_AT EM HOUSES
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_houses_updated_at
    BEFORE UPDATE ON public.houses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
