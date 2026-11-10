import { z } from "zod"

/**
 * Interpreta o que o usuário digita como canal do YouTube.
 * Aceita @handle, handle, youtube.com/@handle[/...] e youtube.com/channel/UC…
 * URLs antigas (/c/, /user/) exigiriam search.list (100 unidades), então pedimos o @handle.
 */
export type ChannelLookup = { handle: string } | { id: string }

export type ParseResult = { ok: true; lookup: ChannelLookup } | { ok: false; error: string }

const handleSchema = z.string().regex(/^[A-Za-z0-9._-]{3,30}$/)
const idSchema = z.string().regex(/^UC[A-Za-z0-9_-]{22}$/)

const INVALID = "Informe o @handle (ex.: @seucanal) ou o link do canal."
const LEGACY = "Esse formato de link é antigo. Use o @handle do canal (aparece abaixo do nome, no YouTube)."
const VIDEO = "Isso é um link de vídeo. Informe o link ou o @handle do canal."

function fromHandle(raw: string): ParseResult {
  let handle = raw.replace(/^@/, "")
  try {
    handle = decodeURIComponent(handle)
  } catch {
    return { ok: false, error: INVALID }
  }
  return handleSchema.safeParse(handle).success
    ? { ok: true, lookup: { handle: `@${handle}` } }
    : { ok: false, error: INVALID }
}

export function parseChannelInput(input: string): ParseResult {
  const value = input.trim()
  if (!value) return { ok: false, error: INVALID }

  if (idSchema.safeParse(value).success) return { ok: true, lookup: { id: value } }

  const looksLikeUrl = /youtube\.com|youtu\.be|^https?:\/\//i.test(value)
  if (!looksLikeUrl) return fromHandle(value)

  let url: URL
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  } catch {
    return { ok: false, error: INVALID }
  }

  const host = url.hostname.replace(/^(www|m)\./, "")
  if (host === "youtu.be") return { ok: false, error: VIDEO }
  if (host !== "youtube.com") return { ok: false, error: INVALID }

  const [first, second] = url.pathname.split("/").filter(Boolean)
  if (!first) return { ok: false, error: INVALID }
  if (first.startsWith("@")) return fromHandle(first)
  if (first === "channel" && second && idSchema.safeParse(second).success) return { ok: true, lookup: { id: second } }
  if (first === "c" || first === "user") return { ok: false, error: LEGACY }
  if (first === "watch" || first === "shorts" || first === "live") return { ok: false, error: VIDEO }
  return { ok: false, error: INVALID }
}
