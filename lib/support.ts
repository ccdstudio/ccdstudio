// Contatos de suporte (WhatsApp é o canal principal).
export const FORGOT_PASSWORD_MESSAGE = "Esqueci minha senha...."

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
}

export function mailtoLink(email: string, subject: string, body?: string) {
  const params = new URLSearchParams({ subject, ...(body ? { body } : {}) })
  return `mailto:${email}?${params.toString().replace(/\+/g, "%20")}`
}

export function forgotPasswordMessage(email?: string) {
  return email ? `${FORGOT_PASSWORD_MESSAGE}\nMeu e-mail de acesso: ${email}` : FORGOT_PASSWORD_MESSAGE
}
