# Google Cloud — passo a passo da chave da YouTube API

> Guia para quem **nunca usou o Google Cloud**. No fim você terá uma **chave de API** do YouTube criada no
> e-mail da empresa (**suporte.ccdstudio@gmail.com**), pronta para colar no `.env` do CCD Studio.
> Tempo estimado: 15 a 20 minutos. Não precisa de cartão de crédito.
> Plano técnico que usa esta chave: [`YOUTUBE-DADOS-PUBLICOS.md`](./YOUTUBE-DADOS-PUBLICOS.md).
>
> **Login com Google:** as credenciais OAuth do "Entrar com o Google" estão em outro guia,
> [`GOOGLE-LOGIN-PASSO-A-PASSO.md`](./GOOGLE-LOGIN-PASSO-A-PASSO.md), que usa este mesmo projeto (passos 1 e 2 daqui).

Os nomes dos menus podem mudar um pouco, porque o Google atualiza o visual de tempos em tempos. Quando não achar um
botão, use a **barra de pesquisa no topo do console** (passo 11, "Não encontro o menu").

---

## 0. Antes de começar: o que é cada coisa

| Termo | O que é, em uma frase |
|---|---|
| **Google Cloud Console** | O painel onde a empresa configura os serviços do Google que o app usa: console.cloud.google.com |
| **Projeto** | Uma "pasta" que agrupa tudo do CCD Studio no Google: APIs ativadas, chaves e cotas |
| **API** | O serviço que o app consulta. Aqui: **YouTube Data API v3**, que devolve dados públicos de canais e vídeos |
| **Chave de API** | Uma senha longa (começa com `AIza…`) que identifica o **app**, não o usuário. É secreta |
| **Cota** | Quantas consultas o projeto pode fazer por dia: **10.000 unidades/dia**, de graça |

**Por que usar o e-mail da empresa:** o projeto, as chaves e a futura verificação do Google ficam no nome da empresa.
Se a pessoa que configurou sair, nada se perde. Trocar o dono de um projeto depois é trabalhoso.

**Login com Google:** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` no `.env` já são do projeto **ccd-studio**
(ver [`GOOGLE-LOGIN-PASSO-A-PASSO.md`](./GOOGLE-LOGIN-PASSO-A-PASSO.md)). A chave do YouTube é outra credencial e
**não depende delas**.

---

## 1. Entrar no console com o e-mail certo

O erro mais comum é criar tudo na conta Google errada. Faça assim:

1. Abra uma **janela anônima** do navegador (Chrome: `Ctrl + Shift + N`) ou um **perfil separado** do Chrome só para a empresa.
   Assim não se mistura com o seu Gmail pessoal nem com o e-mail do projeto antigo.
2. Acesse **https://console.cloud.google.com**.
3. Entre com **suporte.ccdstudio@gmail.com** e a senha dele.
4. No primeiro acesso aparece uma tela de boas-vindas:
   - **País:** Brasil;
   - marque que aceita os **Termos de Serviço** e clique em **Concordar e continuar**;
   - se aparecer uma oferta de "avaliação gratuita" ou "teste gratuito" pedindo cartão, **ignore e feche**. A YouTube Data
     API não precisa de faturamento.
5. **Confira a conta:** no canto superior direito tem a foto ou a inicial da conta. Clique e veja se aparece
   **suporte.ccdstudio@gmail.com**. Se aparecer outro e-mail, clique em **Sair** e entre de novo com o certo.

---

## 2. Criar o projeto "CCD Studio"

1. No topo da tela, ao lado do logo "Google Cloud", há um **seletor de projeto**. Pode estar escrito "Selecionar um
   projeto" ou o nome de um projeto. **Clique nele.**
2. Na janela que abrir, clique em **Novo projeto**, no canto superior direito da janela.
3. Preencha:
   - **Nome do projeto:** `CCD Studio`;
   - **ID do projeto:** o Google sugere um, como `ccd-studio-123456`. Você pode clicar em **Editar** e usar
     `ccd-studio-prod`, se estiver livre. **Anote o ID**, porque ele não muda nunca mais;
   - **Organização / Local:** deixe **"Sem organização"**. É o normal para contas Gmail.
4. Clique em **Criar** e espere uns 30 segundos. Aparece uma notificação (o sininho no topo) dizendo que o projeto foi criado.
5. **Selecione o projeto:** clique de novo no seletor do topo e escolha **CCD Studio**. Confirme que o nome **CCD Studio**
   aparece no topo. **Todos os próximos passos precisam ser feitos com ele selecionado.**

---

## 3. Ativar a YouTube Data API v3

1. Abra o **menu ☰**, os três tracinhos no canto superior esquerdo.
2. Vá em **APIs e serviços → Biblioteca**.
3. Na busca da biblioteca, digite **YouTube Data API v3** e clique no resultado com esse nome exato.
   - Não confunda com "YouTube Analytics API" ou "YouTube Reporting API". Essas são da fase com permissão do usuário.
4. Clique no botão azul **Ativar**.
5. Você será levado para a página da API, com gráficos vazios. **Está certo.** A ativação pode levar **alguns minutos**
   para valer de fato.

---

## 4. Criar a chave de API

1. No menu ☰, vá em **APIs e serviços → Credenciais**.
2. No topo da página, clique em **+ Criar credenciais** e escolha **Chave de API**.
3. Se aparecer um campo de **nome**, use `ccdstudio-servidor`.
4. O Google mostra a chave, um texto parecido com `AIzaSyA…` com uns 39 caracteres. Clique no ícone de **copiar**.
   - Guarde por enquanto num lugar seguro, como o gerenciador de senhas da empresa. **Não mande por WhatsApp, e-mail ou chat**.
   - Se fechar sem copiar, não tem problema: ela fica listada em **Credenciais → Chaves de API** e dá para ver de novo
     em **Mostrar chave**.

---

## 5. Restringir a chave (importante)

Uma chave sem restrição funciona para **qualquer** API do Google. Se vazar, alguém pode gastar a cota em seu nome.
Restringir reduz o estrago.

1. Em **Credenciais → Chaves de API**, clique no **nome** da chave (`ccdstudio-servidor`) ou no ícone de lápis/editar.
2. **Restrições de API:**
   - marque **Restringir chave**;
   - no seletor, marque **somente YouTube Data API v3**.
   - Se ela não aparecer na lista, volte ao passo 3: a API não foi ativada.
3. **Restrições de aplicativo:** deixe **Nenhuma** por enquanto.
   - Por quê: quem chama a API é o **servidor** do CCD Studio, não o navegador. As opções "Sites/referenciadores HTTP",
     "Android" e "iOS" não servem para esse caso.
   - **Depois do deploy:** volte aqui e escolha **Endereços IP**, informando o IP fixo do servidor, se a hospedagem tiver um.
4. Clique em **Salvar**. A restrição pode levar **até 5 minutos** para valer.

---

## 6. Colocar a chave no CCD Studio

1. Abra o arquivo **`.env`** na raiz do projeto `ccdstudio`, o mesmo onde já estão as variáveis do Supabase.
2. Adicione esta linha, colando a sua chave depois do `=`, sem espaços e sem aspas:

   ```env
   YOUTUBE_API_KEY=AIzaSy...sua-chave-aqui
   ```

3. Salve o arquivo. Se o `npm run dev` estiver rodando, pare (`Ctrl + C`) e rode de novo para ele ler a variável.

**Regras de segurança:**
- **Nunca** use o prefixo `NEXT_PUBLIC_` nessa variável. Com ele, a chave iria para o navegador de qualquer visitante.
- **Nunca** faça commit do `.env`. O projeto já ignora esse arquivo no git.
- O `.env.example`, que vai para o git, terá só o **nome** `YOUTUBE_API_KEY=`, sem valor.

---

## 7. Testar se a chave funciona

1. Copie o endereço abaixo, troque `SUA_CHAVE` pela sua chave e cole na barra de endereços do navegador:

   ```text
   https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=@GoogleDevelopers&key=SUA_CHAVE
   ```

2. **Resposta boa:** um texto em JSON começando com `{ "kind": "youtube#channelListResponse"`, com `"items": [ ... ]`
   contendo `"title": "Google for Developers"` e um bloco `"statistics"` (inscritos, views, vídeos).
   - Teste com o seu canal: troque `@GoogleDevelopers` pelo @handle do canal da AM Educação.
3. **Resposta com erro:** começa com `{ "error": { "code": 400 ou 403 ...`. O campo `"reason"` diz o motivo. Veja o passo 11.

Esse teste gasta **1 unidade** de cota. Depois de testar, **feche a aba e limpe o histórico** dessa URL, porque ela contém a chave.

---

## 8. Ver e entender a cota

1. Menu ☰ → **APIs e serviços → APIs e serviços ativados** → clique em **YouTube Data API v3**.
2. Abra a aba **Cotas e limites do sistema** (ou "Cotas").
3. O que você vai ver:
   - **Queries per day:** **10.000**. É o total diário do projeto inteiro, somando todos os usuários do CCD Studio.
   - O uso aparece em gráficos com algumas horas de atraso.
4. **Quando reinicia:** à **meia-noite do horário do Pacífico (EUA)**, que é **04:00 em Brasília** (de março a novembro) ou
   **05:00** (de novembro a março).
5. **Pedir mais cota (só no futuro):** quando o uso real se aproximar do limite, existe o formulário "YouTube API Services
   – Audit and Quota Extension". O Google pede uma descrição do app, a política de privacidade e uma revisão de conformidade.
   **Não é necessário agora**, porque o CCD Studio guarda os dados no banco justamente para economizar cota.

---

## 9. Segurança e administração do projeto

### 9.1 Adicionar um segundo administrador (recomendado)

Se alguém perder o acesso ao e-mail de suporte, o projeto não fica órfão.

1. Menu ☰ → **IAM e administrador → IAM**.
2. Clique em **Conceder acesso** (ou "+ Adicionar").
3. Em **Novos principais**, digite o e-mail da segunda pessoa de confiança da empresa.
4. Em **Papel**, escolha **Básico → Proprietário**.
5. **Salvar.** A pessoa recebe um e-mail e passa a ver o projeto.

### 9.2 Proteger o e-mail suporte.ccdstudio@gmail.com

- Ative a **verificação em duas etapas** em https://myaccount.google.com/security.
- Cadastre um **telefone e um e-mail de recuperação** da empresa.

### 9.3 Se a chave vazar (ou por precaução, de tempos em tempos)

1. **Credenciais → Chaves de API** → abra a chave → **Girar chave** (ou crie uma nova chave com as mesmas restrições).
2. Atualize o `YOUTUBE_API_KEY` no `.env` e na hospedagem.
3. Volte em Credenciais e **exclua a chave antiga**.

---

## 10. E a credencial antiga do outro e-mail?

- **Já resolvido:** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` no `.env` foram trocadas pelas do projeto
  **ccd-studio** (login com Google), e `NEXT_PUBLIC_GOOGLE_CLIENT_ID` saiu.
- Esta chave de API **não depende delas**.
- **Na fase 2** (conectar o canal com permissão do usuário, para analytics e para alterar vídeos), vamos criar **neste
  mesmo projeto CCD Studio**:
  1. a **Tela de consentimento OAuth**, com nome, logo, domínio, política de privacidade e termos;
  2. um **ID do cliente OAuth** do tipo "Aplicativo da Web", com a URL de retorno do app;
  3. a **verificação do app** pelo Google, porque os escopos do YouTube são sensíveis. Leva de dias a semanas.

  O item 2 (cliente OAuth) já é criado antes, para o login com Google: ver
  [`GOOGLE-LOGIN-PASSO-A-PASSO.md`](./GOOGLE-LOGIN-PASSO-A-PASSO.md). A fase 2 reaproveita esse mesmo cliente.

---

## 11. Problemas comuns

| O que aparece | Causa provável | O que fazer |
|---|---|---|
| `"reason": "accessNotConfigured"` (403) | A YouTube Data API v3 não está ativada **neste** projeto, ou acabou de ser ativada | Refaça o passo 3 com o projeto **CCD Studio** selecionado e espere uns 5 minutos |
| `"reason": "API_KEY_SERVICE_BLOCKED"` (403) | A restrição da chave não inclui a YouTube Data API v3 | Passo 5: marque a YouTube Data API v3 em "Restrições de API" e salve |
| `"reason": "keyInvalid"` ou `"API key not valid"` (400) | Chave copiada errada (faltando caractere, com espaço) ou excluída | Copie de novo em Credenciais → Mostrar chave |
| `"reason": "quotaExceeded"` (403) | A cota do dia acabou | Espere o reinício (passo 8). Não crie outros projetos para "driblar" a cota: é contra as regras |
| `"items": []` (lista vazia) | O @handle não existe ou foi digitado errado | Confira o @ no YouTube: abra o canal e veja o endereço `youtube.com/@...` |
| Não vejo o projeto CCD Studio | Você está em outra conta Google | Passo 1, item 5: confira a conta no canto superior direito |
| Criei tudo no e-mail errado | Aconteceu no passo 1 | Repita do passo 1 no e-mail certo e exclua a chave criada na conta errada (Credenciais → excluir) |
| Não encontro o menu | O Google mudou o visual | Use a **barra de pesquisa no topo do console** e digite "Biblioteca", "Credenciais", "IAM" ou "YouTube Data API v3" |

---

## 12. Checklist final

Quando terminar, me avise confirmando cada item:

- [ ] Entrei no console com **suporte.ccdstudio@gmail.com** e conferi a conta no canto superior direito
- [ ] Criei o projeto **CCD Studio** e anotei o **ID do projeto**: `______________`
- [ ] Ativei a **YouTube Data API v3** nesse projeto
- [ ] Criei a chave **ccdstudio-servidor** e **restringi** à YouTube Data API v3
- [ ] Colei `YOUTUBE_API_KEY=...` no `.env`, **sem** `NEXT_PUBLIC_`
- [ ] O teste do passo 7 trouxe `"items"` com os dados do canal
- [ ] Adicionei um **segundo administrador** (passo 9.1) e ativei a **verificação em duas etapas** no e-mail

**Não me envie a chave pela conversa.** Basta colar no `.env`. Eu leio a variável direto do arquivo quando
formos implementar.
