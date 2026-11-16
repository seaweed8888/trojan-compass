import Image from 'next/image'

export function Header({ campusHref = 'http://localhost:3001/' }: { campusHref?: string }) {
  return (
    <header className="compass-header relative z-40 shrink-0 bg-cardinal text-white">
      <a href={campusHref} className="flex h-16 w-fit items-center gap-4 px-4 md:px-6" aria-label="Trojan Compass campus map">
        <Image src="/images/usc-monogram.png" alt="USC" width={64} height={26} priority className="h-auto w-16 brightness-0 invert" />
        <span aria-hidden="true" className="h-7 w-px bg-white/30" />
        <span className="text-lg font-semibold tracking-tight">Trojan <span className="text-gold">Compass</span></span>
      </a>
    </header>
  )
}
