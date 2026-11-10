"use server"

import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth/dal"
import type { FormState } from "@/lib/auth/schemas"
import { createAdminClient } from "@/lib/supabase/admin"
import { deleteIfOrphan, getCachedChannel, isExpired, MANUAL_REFRESH_MS, upsertChannel } from "@/lib/youtube/channel-cache"
import { fetchChannel, YoutubeError } from "@/lib/youtube/client"
import { parseChannelInput } from "@/lib/youtube/parse-channel-input"

// Canal do YouTube do próprio usuário. Identidade sempre pela sessão (requireUser).

function youtubeFailure(error: unknown, field?: string): FormState {
  if (error instanceof YoutubeError) {
    return field && error.code === "not_found" ? { fieldErrors: { [field]: [error.message] } } : { message: error.message }
  }
  console.error("[youtube] erro inesperado:", error)
  return { message: "Não foi possível consultar o canal. Tente novamente." }
}

export async function saveYoutubeChannel(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()

  const parsed = parseChannelInput(String(formData.get("channel") ?? ""))
  if (!parsed.ok) return { fieldErrors: { channel: [parsed.error] } }

  let channelId: string
  try {
    // Pelo ID dá para aproveitar o cache válido sem chamar a API.
    const cached = "id" in parsed.lookup ? await getCachedChannel(parsed.lookup.id) : null
    channelId = cached && !isExpired(cached) ? cached.id : (await upsertChannel(await fetchChannel(parsed.lookup))).id
  } catch (error) {
    return youtubeFailure(error, "channel")
  }

  const previous = user.youtube_channel_id
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ youtube_channel_id: channelId })
    .eq("id", user.id)
  if (error) return { message: "Não foi possível salvar o canal. Tente novamente." }

  if (previous && previous !== channelId) await deleteIfOrphan(previous)

  revalidatePath("/perfil")
  return { ok: true, message: previous ? "Canal atualizado." : "Canal adicionado." }
}

export async function removeYoutubeChannel(): Promise<FormState> {
  const user = await requireUser()
  if (!user.youtube_channel_id) return { ok: true, message: "Nenhum canal vinculado." }

  const { error } = await createAdminClient().from("profiles").update({ youtube_channel_id: null }).eq("id", user.id)
  if (error) return { message: "Não foi possível remover o canal. Tente novamente." }

  await deleteIfOrphan(user.youtube_channel_id)
  revalidatePath("/perfil")
  return { ok: true, message: "Canal removido." }
}

export async function refreshYoutubeChannel(): Promise<FormState> {
  const user = await requireUser()
  const id = user.youtube_channel_id
  if (!id) return { message: "Nenhum canal vinculado." }

  const cached = await getCachedChannel(id)
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < MANUAL_REFRESH_MS) {
    return { ok: true, message: "Os dados já foram atualizados há pouco." }
  }

  try {
    await upsertChannel(await fetchChannel({ id }))
  } catch (error) {
    return youtubeFailure(error)
  }

  revalidatePath("/perfil")
  return { ok: true, message: "Dados do canal atualizados." }
}
