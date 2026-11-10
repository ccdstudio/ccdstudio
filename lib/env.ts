import "server-only"
import { z } from "zod"

// Vazio no .env conta como ausente.
const optional = z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional())

// Variáveis do servidor — nunca importar em Client Components.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DEFAULT_PASSWORD: z.string().min(8, "DEFAULT_PASSWORD precisa de ao menos 8 caracteres"),
  SUPPORT_EMAIL: z.email(),
  SUPPORT_WHATSAPP: z.string().min(8),
  // Opcional: sem a chave, a integração com o YouTube aparece como "não configurada".
  YOUTUBE_API_KEY: optional,
  // Opcional: sem a chave, as ferramentas de IA aparecem como "não configuradas".
  OPENAI_API_KEY: optional,
  OPENAI_MODEL: z.preprocess((v) => (v === "" ? undefined : v), z.string().default("gpt-4.1-mini")),
})

export const env = schema.parse(process.env)
