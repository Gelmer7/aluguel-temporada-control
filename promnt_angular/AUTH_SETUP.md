# Guia de Configuração da Autenticação (Fase 1)

Este documento guia você na configuração inicial do Banco de Dados e do Provedor de Login (Google) no Supabase.

## 1. Banco de Dados (SQL)

O primeiro passo é criar as tabelas de usuários e permissões.

1.  Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2.  Vá para a seção **SQL Editor** (ícone de terminal na barra lateral esquerda).
3.  Clique em **New Query**.
4.  Copie e cole o conteúdo do arquivo que criei em:
    `src/assets/script_tabel_db_supabase/01_auth_schema_setup.sql`
5.  Clique em **Run**.

Isso criará as tabelas `profiles`, `houses` e `house_permissions` (junção de usuários e casas).

## 2. Configurar Login com Google

Para permitir que usuários entrem com suas contas Google:

1.  No painel do Supabase, vá para **Authentication** -> **Providers**.
2.  Procure por **Google** e clique para abrir.
3.  Você precisará do `Client ID` e `Client Secret` do Google Cloud Platform.
    *   *Se ainda não tiver:*
        1.  Acesse [Google Cloud Console](https://console.cloud.google.com/).
        2.  Crie um novo projeto.
        3.  Vá em **APIs & Services** -> **OAuth consent screen** (Configure como "External" e preencha os dados básicos).
        4.  Vá em **Credentials** -> **Create Credentials** -> **OAuth client ID**.
        5.  Tipo: **Web application**.
        6.  **Authorized redirect URIs**: Copie a URL de callback que o Supabase mostra na tela do passo 2 (algo como `https://seu-projeto.supabase.co/auth/v1/callback`).
4.  Cole o `Client ID` e `Client Secret` no Supabase e clique em **Save**.
5.  Ative a opção **Enable Google provider**.

## 3. URL de Redirecionamento (Importante)

Para que o login funcione no seu ambiente local (localhost):

1.  No Supabase, vá para **Authentication** -> **URL Configuration**.
2.  Em **Site URL**, coloque sua URL de produção (se tiver).
3.  Em **Redirect URLs**, adicione:
    *   `http://localhost:4200`
    *   `http://localhost:4200/auth/callback` (opcional, mas recomendado)

## Próximos Passos (Fase 2)

Após concluir a configuração acima, o banco estará pronto. Na próxima etapa, implementaremos no Angular:
1.  `AuthService`: Para conectar com esse backend.
2.  Tela de Login.
3.  Proteção das Rotas.
