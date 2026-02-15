-- Criar a tabela de lembretes
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID -- Opcional: vincular a um usuário se tiver autenticação
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que qualquer pessoa leia os lembretes (ajuste conforme necessário)
CREATE POLICY "Allow public read access" ON public.reminders
    FOR SELECT USING (true);

-- Criar política para permitir inserção pública (ou autenticada)
CREATE POLICY "Allow public insert access" ON public.reminders
    FOR INSERT WITH CHECK (true);

-- Criar política para permitir atualização
CREATE POLICY "Allow public update access" ON public.reminders
    FOR UPDATE USING (true);

-- Criar política para permitir exclusão
CREATE POLICY "Allow public delete access" ON public.reminders
    FOR DELETE USING (true);
