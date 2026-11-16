import type { ReactNode } from 'react'

export function MapBadge({ color, children, title }: { color: string; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="grid h-6 w-6 place-items-center rounded-full text-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] ring-2 ring-white"
      style={{ background: color }}
    >
      {children}
    </span>
  )
}
