import { Html } from '@react-three/drei'
import { createContext, useContext, type ComponentProps, type RefObject } from 'react'

/** DOM layer above the canvas that hosts every in-scene HTML label. */
export const LabelLayerContext = createContext<RefObject<HTMLDivElement | null> | null>(null)

/**
 * drei <Html> with a stable portal target. Without one, drei retargets each label once
 * pointer events connect, which unmounts and recreates every label root on load.
 */
export function MapHtml(props: ComponentProps<typeof Html>) {
  const layer = useContext(LabelLayerContext)
  // drei types the portal as a non-null ref; the layer div is mounted before any label renders.
  return <Html portal={(layer ?? undefined) as RefObject<HTMLElement> | undefined} {...props} style={{ pointerEvents: 'auto', ...props.style }} />
}
