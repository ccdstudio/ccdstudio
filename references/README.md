# Referências externas

Material de terceiros mantido no repositório para consulta e reaproveitamento nas features do CCD Studio.
**Não é código do app**: nada aqui é importado pelo Next.js nem executado em produção.

## youtube-agent-skill

| | |
|---|---|
| Origem | https://github.com/Jakeschincariol/youtube-agent-skill |
| Commit | `a2feb2104981a375ffd4f87ee04f4f5344ac43c6` (2026-09-16) |
| Licença | MIT, © 2026 Jake Schincariol (ver `youtube-agent-skill/LICENSE`, manter o aviso ao reutilizar) |
| Conteúdo | 11 skills (prompts em Markdown, em inglês) + 6 ferramentas Python sem dependências + `templates/voice.md` |

### Mapa para as features do CCD Studio

| Feature (sidebar) | Skill de referência | O que aproveitar |
|---|---|---|
| Roteiro | `skills/yt-script` | Estrutura do roteiro (hook 0–15s, virada, beats com `[NA TELA]`, payoff, um CTA), 21 fórmulas de hook (`hooks.json`) e o score de hook (`hookscore.py`) |
| Otimização de vídeo | `skills/yt-package` + `skills/yt-seo` | Título + thumbnail como um par; regras de 60/40 caracteres, thumbnail ≤ 3 palavras sem repetir o título (`title.py`); descrição com as 2 primeiras linhas como snippet, tags só para desambiguação, "teste das 3 buscas" |
| Thumbnail | `skills/yt-package` | Briefing da thumbnail: expressão, enquadramento, 3 palavras, contraste no tamanho do feed |
| Shorts | `skills/yt-shorts` | Critérios de corte (20–55s, pensamento completo, virada, termina numa frase), nova primeira linha, texto na tela e ponto de loop |
| Capítulos | `skills/yt-chapters` | Regras do YouTube (00:00, ≥ 3, ≥ 10s cada) e detecção de fronteiras por pausa + mudança de vocabulário (`chapters.py`) |
| Calendário editorial | `skills/yt-plan` | Semana com 1 vídeo âncora + 1 "barato" + 3 Shorts, dimensionada pelas horas disponíveis |
| (futuras) | `yt-retention`, `yt-viral`, `yt-comment`, `yt-edit`, `yt-audit` | Leitura de retenção, ranking de outliers por canal, triagem de comentários, lista de cortes por transcrição, auditoria do canal |
| Preferências | `templates/voice.md` | Perfil de voz do criador (público, como fala, palavras proibidas, o que não afirma) para injetar nos prompts |

### Princípios do pack que valem para o CCD Studio

- **Nunca inventar número, resultado ou fonte**: se faltar o dado, pedir ou escrever sem ele.
- **Gerar várias opções e ranquear** (5 hooks, 10 títulos) em vez de entregar uma só.
- **Nada é publicado automaticamente**: o usuário revisa e publica.

### Ao reaproveitar

- Os prompts estão em inglês e falam de `~/.claude/...` e comandos `/yt-*`: traduzir e adaptar para o fluxo
  do app (server action → OpenAI → validação Zod), conforme `docs/SISTEMA-NOVO.md`.
- As ferramentas Python são heurísticas simples; para usar no app, portar a lógica para TypeScript em `lib/`.
