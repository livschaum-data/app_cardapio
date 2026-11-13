# Configuracao do Supabase

Este app usa Supabase Auth para login e uma tabela unica para sincronizar os dados do cardapio por usuario.

## 1. Criar ou ajustar a tabela

No Supabase, abra:

`SQL Editor > New query`

Cole e execute:

```sql
create table if not exists public.cardapio_dados (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null default 'principal',
  alimentos jsonb not null default '[]'::jsonb,
  receitas jsonb not null default '[]'::jsonb,
  refeicoes jsonb not null default '[]'::jsonb,
  planejamentos jsonb not null default '[]'::jsonb,
  historico jsonb not null default '[]'::jsonb,
  tipos_refeicao jsonb not null default '[]'::jsonb,
  tipos_uso jsonb not null default '[]'::jsonb,
  categorias jsonb not null default '[]'::jsonb,
  categorias_refeicoes jsonb not null default '[]'::jsonb,
  categorias_alimentos jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  sync_meta jsonb not null default '{"deletados":{}}'::jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

-- Se a tabela ja existia antes da lista de alimentos:
alter table public.cardapio_dados
add column if not exists alimentos jsonb not null default '[]'::jsonb;

alter table public.cardapio_dados
add column if not exists categorias_alimentos jsonb not null default '[]'::jsonb;

alter table public.cardapio_dados
add column if not exists tipos_uso jsonb not null default '[]'::jsonb;

alter table public.cardapio_dados
add column if not exists categorias_refeicoes jsonb not null default '[]'::jsonb;

alter table public.cardapio_dados
add column if not exists refeicoes jsonb not null default '[]'::jsonb;

alter table public.cardapio_dados
add column if not exists sync_meta jsonb not null default '{"deletados":{}}'::jsonb;

alter table public.cardapio_dados enable row level security;

drop policy if exists "Permitir leitura publica do cardapio" on public.cardapio_dados;
drop policy if exists "Permitir escrita publica do cardapio" on public.cardapio_dados;
drop policy if exists "Permitir atualizacao publica do cardapio" on public.cardapio_dados;
drop policy if exists "Usuários leem o próprio cardápio" on public.cardapio_dados;
drop policy if exists "Usuários criam o próprio cardápio" on public.cardapio_dados;
drop policy if exists "Usuários atualizam o próprio cardápio" on public.cardapio_dados;

create policy "Usuários leem o próprio cardápio"
on public.cardapio_dados
for select
to authenticated
using (auth.uid() = user_id);

create policy "Usuários criam o próprio cardápio"
on public.cardapio_dados
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Usuários atualizam o próprio cardápio"
on public.cardapio_dados
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.cardapio_dados to authenticated;

-- Necessario para que uma alteracao feita em outro aparelho apareca sem recarregar a pagina.
do $$
begin
  alter publication supabase_realtime add table public.cardapio_dados;
exception
  when duplicate_object then null;
end $$;
```

Se voce criou a tabela antiga com `id text primary key`, o caminho mais simples e apagar essa tabela se ela ainda nao tem dados importantes:

```sql
drop table if exists public.cardapio_dados;
```

Depois execute novamente o SQL completo acima.

## 2. Ativar login por email

No Supabase, abra:

`Authentication > Providers > Email`

Deixe o provedor de email ativado. Para facilitar testes, voce pode desligar temporariamente a confirmacao de email em:

`Authentication > Sign In / Providers > Email > Confirm email`

Se a confirmacao ficar ligada, depois de criar conta no app voce precisa confirmar o email antes de entrar.

Em seguida, configure as URLs do app em:

`Authentication > URL Configuration`

Use:

- `Site URL`: `https://livschaum-data.github.io/app_cardapio/`
- `Redirect URLs`: adicione tambem `https://livschaum-data.github.io/app_cardapio/`

Durante testes locais, voce tambem pode adicionar:

- `http://127.0.0.1:8000/`
- `http://192.168.2.104:8000/`

## 3. Preencher a configuracao

Abra `js/supabase-config.js` e preencha:

```js
window.CARDAPIO_SUPABASE = {
    url: 'https://SEU_PROJETO.supabase.co',
    anonKey: 'SUA_CHAVE_ANON_PUBLICA',
    table: 'cardapio_dados',
    recordId: 'principal',
};
```

Voce encontra esses valores em:

`Project Settings > API`

Use a chave `anon`/`public`. Nunca coloque a `service_role` no navegador.

## 4. Como funciona no app

- O botao no topo abre o painel da nuvem.
- Voce pode criar conta ou entrar com email e senha.
- Ao entrar, o app baixa os dados da nuvem.
- Se a nuvem ainda estiver vazia, o app envia os dados locais.
- Ao salvar alimentos, receitas, refeicoes, planejamentos, historico, tipos, tipos de uso, categorias de receitas, categorias de refeicoes, categorias de alimentos ou tags, o app salva localmente, incorpora antes as mudancas mais recentes da nuvem e envia o resultado.
- Com a tabela adicionada a publicacao `supabase_realtime`, mudancas feitas em outro aparelho aparecem automaticamente nos aparelhos que estiverem abertos.
- Exclusoes e renomeacoes tambem geram metadados de sincronizacao em `sync_meta`, evitando que itens removidos em um dispositivo voltem ao mesclar com dados antigos de outro dispositivo.
- Os botoes `Sincronizar agora`, `Baixar da nuvem` e `Enviar para nuvem` permitem controle manual.

### Recuperacao de senha

- No painel da nuvem, o link `Esqueci minha senha` envia o email de recuperacao para o endereco digitado no campo de email.
- O link do email abre o proprio app e mostra a tela `Defina sua nova senha` (o app detecta `type=recovery` na URL). Sem esse tratamento, o Supabase autenticaria o usuario direto, porque o link ja contem uma sessao valida.
- Ao salvar, o app chama `updateUser` para trocar a senha e limpa o token da barra de enderecos.

Para o link funcionar, cadastre os enderecos do app em `Authentication > URL Configuration > Redirect URLs`, por exemplo:

- `http://127.0.0.1:8765/index.html` (teste local)
- `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/` (GitHub Pages)

O endereco enviado como `redirectTo` e o endereco atual do app, sem hash nem query. Se ele nao estiver na lista de Redirect URLs, o Supabase usa a `Site URL` do projeto. Quando o app e aberto direto do disco (`file://`), o `redirectTo` nao e enviado.

## 5. GitHub Pages

Depois de publicar no GitHub Pages, abra o app pelo endereco do GitHub e entre na nuvem pelo painel. Como a configuracao usa a chave `anon`, ela pode ficar no navegador desde que as politicas RLS acima estejam ativas.
