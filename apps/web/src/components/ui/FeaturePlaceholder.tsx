export function FeaturePlaceholder({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="placeholder"><h2>{title}</h2><p>{children}</p></section>;
}
