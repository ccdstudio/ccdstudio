import { StudioLogo, StudioMark } from "./studio-logo"

/** Tempo (s) em que a cortina começa a subir — a hero entra a partir daqui. */
export const INTRO_DELAY = 1.55

/**
 * Abertura da landing (DESIGN - LP.md → Preloader): a logo se desenha em linha, o nome sobe,
 * o medidor enche e a cortina sobe revelando a hero. Tudo em CSS (globals.css → .lp-intro):
 * roda antes do JS e some sozinho; com "reduzir movimento" nem aparece.
 */
export function LpIntro() {
  return (
    <div
      aria-hidden
      className="lp-intro fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ccd-navy-darker text-white"
    >
      <div className="absolute inset-0 lp-glows" />
      <div className="absolute inset-0 lp-grid" />
      {/* a logo se desenha em linha e, no fim, ganha o preenchimento da marca */}
      <div className="relative w-40 md:w-52">
        <StudioLogo mode="draw" className="w-full text-white" />
        <div className="lp-intro-fill absolute inset-0 px-[4.15%] py-[7.3%]">
          <StudioMark className="size-full" />
        </div>
      </div>
      <p className="lp-intro-text relative mt-8 text-4xl font-bold md:text-5xl">
        CCD <span className="text-gradient-gold">Studio</span>
      </p>
      <div className="relative mt-6 h-px w-56 bg-white/10">
        <div className="lp-intro-meter h-full bg-linear-to-r from-ccd-teal via-ccd-teal-light to-ccd-gold" />
      </div>
      <p className="lp-intro-text relative mt-4 font-mono text-[10px] tracking-[0.35em] text-white/45 uppercase">
        AM Educação
      </p>
    </div>
  )
}
