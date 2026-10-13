'use client'

import { useEffect, useRef, useState } from 'react'
import { DESIGN_W } from './demo-content'

/* Skala panggung mengikuti lebar kolom (mobile). */
export function useStageScale() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setScale(Math.min(1, el.clientWidth / DESIGN_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { containerRef, scale }
}
