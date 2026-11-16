import { Header } from './Header'

export function AppShellFallback() {
  return (
    <div className="flex h-full flex-col">
      <Header />
      <main id="main" className="min-h-0 flex-1"><MapLoading /></main>
    </div>
  )
}

export function MapLoading() {
  return (
    <div className="grid h-full w-full place-items-center bg-white">
      <div className="flex items-center gap-3 text-[14px] font-medium text-neutral-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-cardinal" />
        Loading 3D campus…
      </div>
    </div>
  )
}
