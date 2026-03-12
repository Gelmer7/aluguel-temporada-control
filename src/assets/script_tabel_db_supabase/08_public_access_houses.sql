-- ==============================================================================
-- FASE 8: ACESSO PÚBLICO ÀS CASAS (HOME PAGE)
-- ==============================================================================
-- Este script permite que usuários não autenticados (anon) visualizem as casas
-- e suas fotos, necessário para o funcionamento do site público.

-- 1. POLÍTICA PARA VER CASAS (PUBLICO)
-- Permite que qualquer pessoa (anon) veja casas que estão com status 'active'
DROP POLICY IF EXISTS "houses_select_public" ON public.houses;
CREATE POLICY "houses_select_public" ON public.houses
  FOR SELECT TO anon USING (status = 'active');

-- 2. POLÍTICA PARA VER FOTOS (PUBLICO)
-- Permite que qualquer pessoa (anon) veja fotos de casas que estão 'active'
DROP POLICY IF EXISTS "photos_select_public" ON public.house_photos;
CREATE POLICY "photos_select_public" ON public.house_photos
  FOR SELECT TO anon USING (
    EXISTS (
      SELECT 1 FROM public.houses
      WHERE houses.code = house_photos.house_code
      AND houses.status = 'active'
    )
  );
