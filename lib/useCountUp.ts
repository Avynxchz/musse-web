'use client'

import { useEffect, useState } from 'react'

/*
 * Angka berhitung naik (count-up) dengan easing ease-out.
 * prefers-reduced-motion: langsung lompat ke angka final.
 */
export function useCountUp(target: number, start: boolean, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out
      setCount(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration])
  return count
}
