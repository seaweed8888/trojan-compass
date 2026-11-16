import { Suspense } from 'react'
import { AppShellFallback } from '../components/layout/AppShellFallback'
import Wayfinder from '../features/map/components/Wayfinder'

// Server Component: the static shell renders at build time, and the interactive
// wayfinder (which reads deep-link query params) hydrates inside the Suspense boundary.
export default function Page() {
  return (
    <Suspense fallback={<AppShellFallback />}>
      <Wayfinder />
    </Suspense>
  )
}
