# Serviço de IA (OpenAI)

Toda chamada de IA do CCD Studio passa por `lib/ai/`. Usa o **SDK oficial `openai`** (Responses API), não axios: o
SDK já cuida de retry, timeout, tipos e saída estruturada.

| Arquivo | Para quê |
|---|---|
| `lib/ai/client.ts` | Client OpenAI (singleton) e `isAiConfigured()` |
| `lib/ai/service.ts` | `aiText` e `aiJson`: chamadas **sem cobrança** e sem histórico |
| `lib/ai/run-feature.ts` | `runAiFeature`: ferramentas **cobradas** (saldo → `aiJson` → débito + histórico) |
| `lib/ai/errors.ts` | `AiError` com mensagens em pt-BR e `toAiError()` |
| `lib/ai/interpolate.ts` | `interpolatePrompt()` para os `{{PLACEHOLDERS}}` dos prompts |
| `lib/ai/prompts/*`, `lib/ai/schemas/*` | Prompts versionados e schemas Zod de cada ferramenta |
| `lib/ai/actions.ts` | `testAiConnection()`, o teste de conexão do Painel (só superadmin) |

## Qual usar

- **Ferramenta do usuário que custa créditos** (otimização, roteiro, thumbnail…): `runAiFeature`. Ele confere o saldo
  antes, chama a IA e só cobra se a saída for válida. Também grava em `ai_generations`.
- **Texto livre interno** (resumo, classificação, teste): `aiText`.
- **Objeto estruturado interno**: `aiJson`, com um schema Zod.

```ts
import { z } from "zod"
import { aiJson, aiText } from "@/lib/ai/service"

const { text, usage } = await aiText({
  label: "resumo-canal",
  system: "Resuma em 1 frase, em português.",
  input: descricaoDoCanal,
  maxOutputTokens: 400,
})

const { data } = await aiJson({
  label: "classificar-nicho",
  input: `Descrição: ${descricaoDoCanal}`,
  schema: z.object({ nicho: z.string(), confianca: z.number() }),
  validate: (d) => d.confianca >= 0 && d.confianca <= 1, // opcional; se falhar, tenta de novo
  maxOutputTokens: 600,
})
```

## Regras

- **Só no servidor.** Server Actions, Route Handlers e Server Components. Nunca em Client Components.
- **`maxOutputTokens` sempre definido.** Nos modelos de raciocínio (`gpt-5*`, `o*`), os tokens de raciocínio contam
  nesse limite. Para saídas longas, use milhares, não centenas.
- **Parâmetros por modelo:** o serviço decide sozinho. Modelos de raciocínio recebem `effort` (padrão `low`); os
  demais recebem `temperature` (padrão 0.7).
- **`store: false`** em todas as chamadas.
- **Logs sem conteúdo:** só `label`, modelo, tokens, tempo e status, no formato
  `[ai] label=… model=… in=… out=… ms=… status=…`.
- **Erros:** capture `AiError` e mostre `error.message`, que já vem em pt-BR. Os códigos são:
  - `not_configured`: chave ausente ou inválida, ou modelo inexistente;
  - `rate_limit`;
  - `unavailable`;
  - `invalid_output`;
  - `insufficient_credits`.
- **Prompts** ficam versionados em `lib/ai/prompts/` (ver `docs/PROMPTS.md`). Não monte prompt solto dentro de
  componentes.

## Variáveis (`.env`)

| Variável | Uso |
|---|---|
| `OPENAI_API_KEY` | Chave da OpenAI (só servidor). Sem ela, as ferramentas aparecem como "não configuradas" |
| `OPENAI_MODEL` | Modelo padrão. Se ficar vazio, usa `gpt-4.1-mini` |

O teste de conexão fica no **Painel** e aparece só para o superadmin. Ele mostra se a chave está configurada (nunca o
valor), o modelo, o tempo de resposta e os tokens.
