import { z } from "zod"

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido"))

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha").max(72),
})

export const passwordSchema = z
  .string()
  .min(8, "A senha precisa de ao menos 8 caracteres")
  .max(72, "A senha pode ter no máximo 72 caracteres")
  .regex(/[A-Za-z]/, "Use ao menos uma letra")
  .regex(/\d/, "Use ao menos um número")

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "A nova senha precisa ser diferente da atual",
  })

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120, "Nome muito longo"),
})

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  email: emailSchema,
  role: z.enum(["user", "admin"]).default("user"),
})

export const userIdSchema = z.uuid()

/** Estado padrão retornado pelas Server Actions de formulário */
export type FormState = {
  ok?: boolean
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

/** Só aceita caminhos internos (evita open redirect). */
export function safeNext(value: unknown, fallback = "/painel") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback
  }
  return value
}
