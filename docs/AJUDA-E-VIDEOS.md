# Ajuda das páginas e vídeos

Toda página logada tem, no banner (o `PageHeader`), um botão quadrado com ícone de info, **"Como funciona esta página"**, à direita do título. Ele abre um
modal com:

- o vídeo curto da feature;
- "O que é", "Como usar" e "De onde vêm os dados", em linguagem simples.

O modal nunca abre sozinho.

O conteúdo fica num só arquivo: `lib/help/pages.tsx` (`PAGE_HELP`).

## Adicionar o vídeo de uma página

1. Grave o vídeo da feature. Curto, de 1 a 3 minutos, mostrando a tela.
2. Suba no YouTube com a visibilidade **Não listado**. Assim ele não aparece no canal nem na busca, mas toca para
   quem tem o link.
3. Copie o link e cole no campo `video` da página em `lib/help/pages.tsx`, por exemplo:

   ```ts
   roteiro: {
     title: "Roteiro",
     video: "https://youtu.be/XXXXXXXXXXX",
     ...
   },
   ```

   Os formatos aceitos são `youtube.com/watch?v=…`, `youtu.be/…` e `youtube.com/shorts/…`.
4. Sem vídeo, ou com um link inválido, o modal mostra "Vídeo em breve".

O vídeo toca pelo `youtube-nocookie.com`, que não grava cookies antes do play. O player só carrega quando o modal é
aberto.

## Páginas (chave → rota)

| Chave | Página |
|---|---|
| `painel` | `/painel` |
| `perfil` | `/perfil` |
| `usuarios` | `/admin/usuarios` |
| `planos` | `/conta/planos` |
| `meu-canal` | `/meu-canal` |
| `diagnostico` | `/analises/diagnostico` |
| `estouros` | `/analises/estouros` |
| `ritmo` | `/analises/ritmo` |
| `voz` | `/analises/voz` |
| `otimizacao` | `/criar/otimizacao` |
| `otimizacao-nova` | `/criar/otimizacao/nova` |
| `otimizacao-resultado` | `/criar/otimizacao/[id]` |
| `roteiro` | `/criar/roteiro` |
| `roteiro-novo` | `/criar/roteiro/novo` |
| `roteiro-resultado` | `/criar/roteiro/[id]` |
| `historico` | `/historico` |
| `historico-item` | `/historico/[id]` |

**Página nova:**
1. Crie a entrada em `PAGE_HELP`.
2. Passe `help: "<chave>"` no `HEADER` da página, que vai para o `PageHeader`.
