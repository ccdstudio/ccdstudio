import type { IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  CreditCardIcon,
  DashboardSquare01Icon,
  Image01Icon,
  ListViewIcon,
  NoteEditIcon,
  ScissorIcon,
  SparklesIcon,
  UserCircleIcon,
  UserMultiple02Icon,
  YoutubeIcon,
  Stethoscope02Icon,
  Fire02Icon,
  ChartColumnIcon,
  Mic01Icon,
} from "@hugeicons/core-free-icons"
import type { IconKey } from "@/lib/navigation"

// Ícones das seções: usados pelo menu (nav-main) e pelo PageHeader (marca d'água).
export const NAV_ICONS: Record<IconKey, IconSvgElement> = {
  dashboard: DashboardSquare01Icon,
  optimize: SparklesIcon,
  script: NoteEditIcon,
  thumbnail: Image01Icon,
  shorts: ScissorIcon,
  chapters: ListViewIcon,
  history: Clock01Icon,
  calendar: Calendar03Icon,
  profile: UserCircleIcon,
  channel: YoutubeIcon,
  diagnosis: Stethoscope02Icon,
  outliers: Fire02Icon,
  rhythm: ChartColumnIcon,
  voice: Mic01Icon,
  billing: CreditCardIcon,
  users: UserMultiple02Icon,
}
