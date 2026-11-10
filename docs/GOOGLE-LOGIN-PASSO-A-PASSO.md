# Passo a passo: credenciais do "Entrar com o Google" (OAuth) no Google Cloud

> **Para quem nunca fez isso.** No fim você terá um **ID do cliente** e uma **chave secreta do cliente** OAuth,
> criados no projeto **CCD Studio** do e-mail **suporte.ccdstudio@gmail.com**, prontos para o login com Google do
> CCD Studio (via Supabase Auth).
> Tempo estimado: 20 a 30 minutos. Não precisa de cartão de crédito.
>
> **Pré-requisito:** passos 1 e 2 de [`GOOGLE-CLOUD-PASSO-A-PASSO.md`](./GOOGLE-CLOUD-PASSO-A-PASSO.md) feitos
> (projeto **CCD Studio** criado e selecionado no topo do console). Faça este guia **antes** dos passos do YouTube
> (passo 3 em diante do outro guia); um não depende do outro, mas ambos usam o mesmo projeto.

Os nomes dos menus podem mudar um pouco. Se não achar um botão, use a **barra de pesquisa no topo do console** e
digite o nome da tela (ex.: "Google Auth Platform", "Clientes", "Branding").

---

## 0. Antes de começar: o que é cada coisa

| Termo | O que é, em uma frase |
|---|---|
| **OAuth** | O jeito padrão de um site pedir ao Google "quem é esta pessoa?" sem nunca ver a senha dela |
| **Google Auth Platform** | A área do console onde se configura o login com Google (antes se chamava "Tela de consentimento OAuth") |
| **Branding (marca)** | Nome, logo e links que aparecem na janela "Fazer login com o Google" |
| **Público (Audience)** | Quem pode usar o login: em **teste** (só e-mails liberados) ou **em produção** (qualquer conta Google) |
| **Escopos (Data Access)** | O que o app pede ao Google. Para login: só **e-mail, perfil e openid** (básicos, sem revisão do Google) |
| **Cliente OAuth** | O "cadastro" do CCD Studio no Google: gera o **ID do cliente** (público) e a **chave secreta** (secreta) |
| **URI de redirecionamento** | O endereço para onde o Google devolve o usuário depois do login. No nosso caso, o do **Supabase** |

**Como o login vai funcionar no CCD Studio:**

```text
Usuário clica "Entrar com o Google" no /login
  → Google mostra a janela de login/consentimento
  → Google devolve para o Supabase:  https://aspwludxwxrlbehhjdxp.supabase.co/auth/v1/callback
  → Supabase cria a sessão e devolve para o app:  http://localhost:3000/auth/callback  (depois, o domínio real)
  → App confere o perfil (ativo? papel?) e abre o painel
```

> **Regra do sistema que continua valendo:** o cadastro público está **desativado** (só admins criam contas). Então o
> login com Google vai funcionar **para quem já tem conta** no CCD Studio com o **mesmo e-mail** da conta Google.
> Um e-mail desconhecido verá "conta não encontrada, fale com o suporte". Isso é proposital.

---

## 1. Conferir a conta e o projeto

1. Abra uma **janela anônima** (Ctrl + Shift + N no Chrome) e entre em **console.cloud.google.com** com
   **suporte.ccdstudio@gmail.com**.
2. Confira no **canto superior direito** a foto/inicial da conta certa.
3. Confira no **seletor de projeto** (topo, ao lado do logo) que está escrito **CCD Studio**. Se não estiver, clique e
   selecione.

> Se você fizer os passos abaixo no projeto do outro e-mail, as credenciais vão nascer no lugar errado. Sempre confira 2 e 3.

---

## 2. Abrir o Google Auth Platform

1. Menu **☰** (canto superior esquerdo) → **APIs e serviços** → **Tela de permissão OAuth**
   (ou pesquise **"Google Auth Platform"** na barra do topo).
2. Como o projeto é novo, aparece a mensagem "O Google Auth Platform ainda não foi configurado". Clique em
   **Primeiros passos** (Get started).

---

## 3. Configuração inicial (assistente de 4 etapas)

**Etapa 1 — Informações do app**
- **Nome do app:** `CCD Studio` (é o que o usuário verá: "Fazer login no CCD Studio").
- **E-mail para suporte do usuário:** escolha `suporte.ccdstudio@gmail.com` na lista.
- **Próxima.**

**Etapa 2 — Público**
- Escolha **Externo** (qualquer conta Google pode logar; "Interno" só existe para empresas com Google Workspace).
- **Próxima.**

**Etapa 3 — Dados de contato**
- **Endereços de e-mail:** `suporte.ccdstudio@gmail.com` (o Google avisa aqui sobre mudanças no projeto).
- **Próxima.**

**Etapa 4 — Concluir**
- Marque **"Concordo com a Política de dados do usuário dos serviços de API do Google"**.
- **Continuar** → **Criar**.

Pronto: o menu lateral agora mostra **Visão geral, Branding, Público, Clientes, Acesso a dados, Verificação** e
**Configurações**.

---

## 4. Branding (o que aparece na janela de login)

Menu lateral → **Branding**.

1. **Nome do app** e **e-mail de suporte**: já vêm da etapa anterior.
2. **Logo do app:** **deixe em branco por enquanto.** Enviar logo obriga o app a passar por **verificação de marca**
   do Google (dias). Dá para colocar depois, quando o site estiver no ar.
3. **Domínio do app** (pode deixar em branco agora, preencher quando tiver o domínio do CCD Studio):
   - Página inicial do aplicativo: `https://<domínio do CCD Studio>`
   - Link da Política de Privacidade: `https://<domínio>/privacidade`
   - Link dos Termos de Serviço: `https://<domínio>/termos`
4. **Domínios autorizados** → **Adicionar domínio**:
   - `aspwludxwxrlbehhjdxp.supabase.co` (o endereço do nosso Supabase, para onde o Google devolve o usuário);
   - depois, quando existir, o domínio do CCD Studio (ex.: `ccdstudio.com.br`).
5. **Dados de contato do desenvolvedor:** `suporte.ccdstudio@gmail.com`.
6. **Salvar.**

> A janela de login vai mostrar "para continuar no **aspwludxwxrlbehhjdxp.supabase.co**". É normal. Para mostrar o
> domínio do CCD Studio no lugar, no futuro dá para usar um domínio personalizado no Supabase (plano pago).

---

## 5. Acesso a dados (escopos)

Menu lateral → **Acesso a dados** → **Adicionar ou remover escopos**.

1. Marque somente estes três (ficam no topo da lista):
   - `.../auth/userinfo.email` — ver o endereço de e-mail;
   - `.../auth/userinfo.profile` — ver nome e foto;
   - `openid` — identificar o usuário.
2. **Atualizar** → **Salvar**.

> **Não adicione** nenhum escopo do YouTube agora. Escopos do YouTube são **sensíveis** e exigem verificação do Google
> (semanas). Eles ficam para a fase 2 (conectar o canal com permissão), e serão pedidos em um botão separado, não no login.

---

## 6. Criar o cliente OAuth (gera o ID e a chave secreta)

Menu lateral → **Clientes** → **+ Criar cliente**.

1. **Tipo de aplicativo:** **Aplicativo da Web**.
2. **Nome:** `CCD Studio — Supabase Auth` (só para você identificar; o usuário não vê).
3. **Origens JavaScript autorizadas** → **+ Adicionar URI**:
   - `http://localhost:3000`
   - (depois do deploy) `https://<domínio do CCD Studio>`
4. **URIs de redirecionamento autorizados** → **+ Adicionar URI** — **copie exatamente**, sem barra no final:

   ```text
   https://aspwludxwxrlbehhjdxp.supabase.co/auth/v1/callback
   ```

   > É o endereço do **Supabase**, não o do app. É o erro nº 1 (`redirect_uri_mismatch`, ver passo 11).
5. **Criar.**
6. Abre uma janela "Cliente OAuth criado" com:
   - **ID do cliente:** termina em `.apps.googleusercontent.com`;
   - **Chave secreta do cliente:** começa com `GOCSPX-`.
7. Clique em **Fazer download do JSON** e guarde o arquivo num lugar seguro (fora da pasta do projeto, ex.: o
   gerenciador de senhas da empresa).

> ⚠️ **A chave secreta só aparece inteira agora.** Depois o Google mostra só os últimos caracteres. Se perder, não tem
> como ver de novo: é preciso criar uma chave secreta nova no mesmo cliente (passo 9.3).

As mudanças podem levar de **5 minutos a algumas horas** para valer no Google.

---

## 7. Público: modo teste × produção

Menu lateral → **Público**.

- O app nasce em **Teste**: só os e-mails listados em **Usuários de teste** conseguem logar (até 100).
  1. Em **Usuários de teste** → **+ Add users**;
  2. adicione o seu e-mail (`devprates@gmail.com`) e os de quem for testar → **Salvar**.
- **Quando for liberar para todos os clientes:** clique em **Publicar app** → **Confirmar**. Com os escopos básicos do
  passo 5 e **sem logo**, o Google **não exige verificação**: o app fica "Em produção" na hora.
  - Se um dia adicionar logo ou escopos sensíveis, aí sim entra a verificação (aba **Verificação**).

> Recomendo deixar **em Teste** até o login estar implementado e testado, e publicar no dia de abrir para os usuários.

---

## 8. Colocar as credenciais no CCD Studio

**Não mande o ID nem a chave secreta pelo chat.** Cole no `.env` (que nunca vai para o Git):

1. Abra o arquivo `.env` na raiz do projeto.
2. Preencha (substituindo os valores antigos do outro e-mail, se existirem):

   ```bash
   # Login com Google (projeto ccd-studio, suporte.ccdstudio@gmail.com)
   GOOGLE_CLIENT_ID=cole-aqui-o-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-cole-aqui-a-chave-secreta
   ```

3. **Não** coloque `NEXT_PUBLIC_` nessas variáveis. Quem conversa com o Google é o Supabase, não o navegador.
4. Rode `npm run db:apply`: ele ativa o provedor **Google** no Supabase Auth com essas credenciais e libera o retorno
   em `http://localhost:3000/auth/callback`. Rode de novo sempre que trocar a chave secreta.
5. O arquivo `client_secret.json` baixado no passo 6 está no `.gitignore`, mas o ideal é guardá-lo **fora** da pasta
   do projeto.

**Implementado no app:**
- botão **"Entrar com o Google"** no `/login` (`app/(auth)/login/`), com a action `signInWithGoogle` (PKCE);
- rota de retorno `app/auth/callback/route.ts`: troca o código pela sessão, confere se a conta está ativa e abre o painel;
- o cadastro continua fechado: o Supabase **vincula** a conta Google ao usuário que já existe com o mesmo e-mail;
  e-mail sem conta volta com "Não existe conta no CCD Studio com este e-mail do Google".
- **Depois do deploy:** adicionar o domínio real nas origens e no `uri_allow_list` (em `scripts/db-apply.mts`).

> Se preferir fazer no painel do Supabase você mesmo: **Authentication → Sign In / Providers → Google** → ativar,
> colar **Client ID** e **Client Secret** → **Save**. O "Callback URL" mostrado ali deve ser igual ao do passo 6.4.

---

## 9. Segurança

### 9.1 Quem tem acesso ao projeto
Se ainda não fez, adicione um segundo administrador (passo 9.1 do
[outro guia](./GOOGLE-CLOUD-PASSO-A-PASSO.md#91-adicionar-um-segundo-administrador-recomendado)).

### 9.2 A chave secreta
- Fica **só** no `.env` e no Supabase. Nunca em código, print, e-mail ou chat.
- O **ID do cliente** não é segredo (aparece na URL de login), mas também não precisa ser espalhado.

### 9.3 Se a chave secreta vazar (ou se você perdeu)
1. **Clientes** → clique em **CCD Studio — Supabase Auth**.
2. Em **Chaves secretas do cliente** → **+ Adicionar chave secreta** → copie a nova.
3. Troque no `.env` e me avise (atualizo o Supabase).
4. Volte ao cliente e **desative/exclua a chave antiga**.

---

## 10. E depois, na fase do YouTube com permissão (fase 2)?

O **mesmo cliente OAuth** serve. O que muda na fase 2:
- adicionar escopos do YouTube (ex.: `youtube.readonly`, `yt-analytics.readonly`) em **Acesso a dados**;
- enviar o app para **Verificação** do Google (exige domínio próprio, política de privacidade, vídeo de demonstração);
- o pedido dessas permissões acontece num botão "Conectar canal" no Perfil, **separado do login**.

Nada disso é necessário agora.

---

## 11. Problemas comuns

| O que aparece | Causa provável | Como resolver |
|---|---|---|
| **Erro 400: redirect_uri_mismatch** | A URI do passo 6.4 está diferente (barra no final, `http` em vez de `https`, ref errado) | Copie de novo exatamente `https://aspwludxwxrlbehhjdxp.supabase.co/auth/v1/callback`; espere 5 min |
| **Erro 403: access_denied** / "O app está sendo testado" | App em **Teste** e o e-mail não está em **Usuários de teste** | Adicione o e-mail no passo 7 ou publique o app |
| **Erro 401: invalid_client** | ID ou chave secreta colados errado (espaço sobrando, chave de outro cliente) | Confira no `.env`; se perdeu a chave, crie outra (9.3) |
| "Este app não foi verificado" | Logo enviado ou escopo sensível adicionado | Remova o logo/escopos extras, ou faça a verificação |
| O login abre, mas volta com "conta não encontrada" | O e-mail Google não tem conta no CCD Studio | Comportamento esperado: um admin cria a conta com o mesmo e-mail |
| Não encontro "Google Auth Platform" | Visual do console mudou | Pesquise "OAuth" ou "Clientes" na barra do topo |
| As credenciais foram criadas no projeto errado | Projeto do outro e-mail estava selecionado | Exclua o cliente lá e refaça o passo 6 com **CCD Studio** selecionado |

---

## 12. Checklist final (me devolva assim)

- [ ] Conferi que estava em **suporte.ccdstudio@gmail.com** e no projeto **CCD Studio**
- [ ] Google Auth Platform configurado (nome **CCD Studio**, público **Externo**)
- [ ] Domínio autorizado `aspwludxwxrlbehhjdxp.supabase.co` adicionado (sem logo)
- [ ] Escopos: só `email`, `profile` e `openid`
- [ ] Cliente **Aplicativo da Web** criado, com origem `http://localhost:3000` e redirecionamento do Supabase
- [ ] JSON do cliente baixado e guardado fora do projeto
- [ ] Meu e-mail adicionado em **Usuários de teste**
- [ ] `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` colados no `.env` e `npm run db:apply` executado

Depois disso, é só pedir: **"implemente o login com Google"**.
