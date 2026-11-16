/** Three architectural floor plates, drawn with the toolbar's 24px/1.8px icon grid. */
export function FloorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 8 9-5 9 5-9 5-9-5Z" />
      <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      <path
        d="m12 6 3.6 2-3.6 2-3.6-2L12 6Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
