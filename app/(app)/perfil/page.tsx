import type { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { DataList } from "@/components/shared/data-list"
import { SectionCard } from "@/components/shared/section-card"
import { RoleBadge, StatusBadge } from "@/components/shared/status-badge"
import { requireUser } from "@/lib/auth/dal"
import { ChangePasswordDialog, EditAccountDialog } from "./profile-forms"
import { YoutubeChannelCard, YoutubeChannelCardSkeleton } from "./youtube-channel-card"

export const metadata: Metadata = { title: "Meu perfil · CCD Studio" }

const HEADER = { eyebrow: "Conta", title: "Meu perfil", icon: "profile" as const }

// Página só de leitura: cada seção tem um botão que abre a edição em modal.
async function Profile() {
  const user = await requireUser()

  return (
    <>
      <PageHeader {...HEADER} description={user.email} actions={<RoleBadge role={user.role} />} />

      <div className="flex flex-col gap-6">
        <SectionCard
          title="Dados pessoais"
          description="Tipo de conta e status são definidos pelo administrador."
          actions={<EditAccountDialog name={user.name} email={user.email} />}
        >
          <DataList
            items={[
              { label: "Nome", value: user.name },
              { label: "E-mail", value: user.email },
              { label: "Tipo de conta", value: <RoleBadge role={user.role} /> },
              { label: "Status", value: <StatusBadge status={user.is_active ? "active" : "inactive"} /> },
            ]}
          />
        </SectionCard>

        <Suspense fallback={<YoutubeChannelCardSkeleton />}>
          <YoutubeChannelCard channelId={user.youtube_channel_id} />
        </Suspense>

        <SectionCard
          title="Senha"
          description="Para alterar, confirme a sua senha atual."
          actions={<ChangePasswordDialog mustChange={user.must_change_password} />}
          className={user.must_change_password ? "border-amber-300 dark:border-amber-500/40" : undefined}
        >
          <DataList
            items={[
              {
                label: "Senha de acesso",
                value: user.must_change_password ? (
                  <span className="flex flex-col items-start gap-1.5">
                    <StatusBadge status="temporaryPassword" />
                    <span className="text-muted-foreground">Por segurança, defina uma senha pessoal.</span>
                  </span>
                ) : (
                  "Senha pessoal definida"
                ),
                wide: true,
              },
            ]}
          />
        </SectionCard>
      </div>
    </>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageHeader {...HEADER} description="Carregando…" />}>
      <Profile />
    </Suspense>
  )
}
