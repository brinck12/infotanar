import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Egy elem aktuális szélessége pixelben (ResizeObserver). Az SVG-diagramok ebből rajzolnak a
 * tényleges méretben, így a betűk nem nyúlnak-zsugorodnak a konténerrel együtt.
 * Az első mérésig a `fallback` érvényes.
 */
export function useElementWidth<T extends HTMLElement>(fallback: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(1, Math.round(entry.contentRect.width)))
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
