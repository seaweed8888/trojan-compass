export function RestroomIcon({ men = false, women = false, className }: { men?: boolean; women?: boolean; className?: string }) {
  return (
    <svg viewBox={men && women ? '0 0 24 24' : '0 0 12 24'} fill="currentColor" className={className} aria-hidden="true">
      {men && <g data-restroom="men"><circle cx="6" cy="4" r="2" /><path d="M3 7h6v8H8v7H6.5v-7h-1v7H4v-7H3z" /></g>}
      {women && <g data-restroom="women" transform={men ? 'translate(12 0)' : undefined}><circle cx="6" cy="4" r="2" /><path d="M4 7h4l3 9H8v6H6.5v-6h-1v6H4v-6H1z" /></g>}
    </svg>
  )
}
