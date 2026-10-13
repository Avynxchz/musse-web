'use client'

import { useEffect, type RefObject } from 'react'

/*
 * Angka berhitung naik (count-up) dengan easing ease-out.
 * Update langsung via textContent (ref) — TIDAK pakai setState per frame,
 * jadi tidak memicu re-render React selama animasi 1,2 detik.
 * prefers-reduced-motion: langsung lompat ke angka final.
 */
export function useCountUp(
  numRef: RefObject<HTMLElement | null>,
  target: number,
  start: boolean,
  duration = 1200
) {
  useEffect(() => {
    const el = numRef.current
    if (!start || !el) return
    const fmt = (n: number) => Math.round(n).toLocaleString('id-ID')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = fmt(target)
      return
    }
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out
      el.textContent = fmt(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [numRef, target, start, duration])
}
