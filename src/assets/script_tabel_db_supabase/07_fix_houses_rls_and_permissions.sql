-- ==============================================================================
-- FASE 7: CORREÇÃO DEFINITIVA E PROFISSIONAL DE RLS (V4)
-- ==============================================================================
-- Esta versão introduz a coluna 'created_by' diretamente na tabela houses.
-- Isso elimina recursão infinita e garante que o criador tenha acesso imediato.

-- 1. PREPARAR A TABELA HOUSES
ALTER TABLE public.houses
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 1.1 POPULAR CREATED_BY PARA CASAS EXISTENTES (Opcional, baseado em quem já é admin)
UPDATE public.houses h
SET created_by = (
  SELECT user_id
  FROM public.house_permissions
  WHERE house_code = h.code AND role = 'admin'
  LIMIT 1
)
WHERE created_by IS NULL;

-- 2. LIMPAR TUDO PARA RECOMEÇAR DO ZERO (Evita conflitos)
DO $$
BEGIN
    -- Remover políticas de houses
    DROP POLICY IF EXISTS "Usuários veem casas que têm permissão" ON public.houses;
    DROP POLICY IF EXISTS "Usuários autenticados podem criar casas" ON public.houses;
    DROP POLICY IF EXISTS "Usuários com permissão podem editar casas" ON public.houses;
    DROP POLICY IF EXISTS "Apenas admins podem deletar casas" ON public.houses;
    DROP POLICY IF EXISTS "Select houses" ON public.houses;
    DROP POLICY IF EXISTS "Insert houses" ON public.houses;
    DROP POLICY IF EXISTS "Update houses" ON public.houses;
    DROP POLICY IF EXISTS "Delete houses" ON public.houses;
    DROP POLICY IF EXISTS "houses_select" ON public.houses;
    DROP POLICY IF EXISTS "houses_insert" ON public.houses;
    DROP POLICY IF EXISTS "houses_update" ON public.houses;
    DROP POLICY IF EXISTS "houses_delete" ON public.houses;

    -- Remover políticas de house_permissions
    DROP POLICY IF EXISTS "Usuário vê suas próprias permissões" ON public.house_permissions;
    DROP POLICY IF EXISTS "Admins podem gerenciar permissões" ON public.house_permissions;
    DROP POLICY IF EXISTS "Select permissions" ON public.house_permissions;
    DROP POLICY IF EXISTS "Manage permissions" ON public.house_permissions;
    DROP POLICY IF EXISTS "permissions_select" ON public.house_permissions;
    DROP POLICY IF EXISTS "permissions_manage" ON public.house_permissions;

    -- Remover políticas de house_photos
    DROP POLICY IF EXISTS "Usuários veem fotos das casas que têm permissão" ON public.house_photos;
    DROP POLICY IF EXISTS "Apenas administradores podem inserir fotos" ON public.house_photos;
    DROP POLICY IF EXISTS "Apenas administradores podem atualizar fotos" ON public.house_photos;
    DROP POLICY IF EXISTS "Apenas administradores podem deletar fotos" ON public.house_photos;
    DROP POLICY IF EXISTS "photos_select" ON public.house_photos;
    DROP POLICY IF EXISTS "photos_manage" ON public.house_photos;
END $$;

-- 3. FUNÇÕES DE APOIO (SECURITY DEFINER)
-- Usamos SECURITY DEFINER para checar permissões extras sem causar recursão RLS.

CREATE OR REPLACE FUNCTION public.check_house_access(house_code_param TEXT, required_role TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Checa se o usuário é o criador (dono original)
  IF EXISTS (SELECT 1 FROM public.houses WHERE code = house_code_param AND created_by = auth.uid()) THEN
    RETURN TRUE;
  END IF;

  -- 2. Checa se o usuário tem permissão explícita na tabela house_permissions
  IF required_role IS NULL THEN
    RETURN EXISTS (SELECT 1 FROM public.house_permissions WHERE house_code = house_code_param AND user_id = auth.uid());
  ELSE
    RETURN EXISTS (SELECT 1 FROM public.house_permissions WHERE house_code = house_code_param AND user_id = auth.uid() AND role = required_role);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. NOVAS POLÍTICAS PARA HOUSE_PERMISSIONS
ALTER TABLE public.house_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select" ON public.house_permissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.check_house_access(house_code, 'admin'));

CREATE POLICY "permissions_manage" ON public.house_permissions
  FOR ALL TO authenticated USING (public.check_house_access(house_code, 'admin'));

-- 5. NOVAS POLÍTICAS PARA HOUSES (Simples e Diretas)
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Ver: Dono ou quem tem permissão
CREATE POLICY "houses_select" ON public.houses
  FOR SELECT TO authenticated USING (created_by = auth.uid() OR public.check_house_access(code));

-- Inserir: Qualquer autenticado (created_by será preenchido pelo DEFAULT)
CREATE POLICY "houses_insert" ON public.houses
  FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

-- Atualizar: Dono ou quem tem permissão de admin/editor
CREATE POLICY "houses_update" ON public.houses
  FOR UPDATE TO authenticated USING (created_by = auth.uid() OR public.check_house_access(code, 'admin') OR public.check_house_access(code, 'editor'));

-- Deletar: Apenas Dono ou Admin
CREATE POLICY "houses_delete" ON public.houses
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.check_house_access(code, 'admin'));

-- 5.1 NOVAS POLÍTICAS PARA HOUSE_PHOTOS
ALTER TABLE public.house_photos ENABLE ROW LEVEL SECURITY;

-- Ver: Dono ou quem tem permissão na casa
CREATE POLICY "photos_select" ON public.house_photos
  FOR SELECT TO authenticated USING (public.check_house_access(house_code));

-- Inserir/Atualizar/Deletar: Dono ou Admin/Editor da casa
CREATE POLICY "photos_manage" ON public.house_photos
  FOR ALL TO authenticated USING (public.check_house_access(house_code, 'admin') OR public.check_house_access(house_code, 'editor'));

-- 6. TRIGGER DE AUTOMAÇÃO (Opcional agora, mas bom manter para compatibilidade)
CREATE OR REPLACE FUNCTION public.handle_new_house_permission()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere o criador como admin na tabela de permissões para manter consistência
  -- Ignora se já existir (conflito raro mas possível)
  INSERT INTO public.house_permissions (house_code, user_id, role)
  VALUES (NEW.code, auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_house_created ON public.houses;
CREATE TRIGGER on_house_created
  AFTER INSERT ON public.houses
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_house_permission();
