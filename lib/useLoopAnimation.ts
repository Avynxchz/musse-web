'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

/**
 * Hook animasi loop berbasis timeline.
 * - timeline: array [waktu_ms, step] — step berubah sesuai jadwal, lalu mengulang tiap loopMs.
 * - Jalan hanya saat elemen terlihat di layar (IntersectionObserver), berhenti saat keluar.
 * - prefers-reduced-motion: langsung lompat ke step terakhir (frame statis).
 * - Mengembalikan cycle (naik tiap loop) untuk me-remount elemen biar animasi CSS keulang.
 */
export function useLoopAnimation(timeline: [number, number][], loopMs: number) {
  const [step, setStep] = useState(0)
  const [cycle, setCycle] = useState(0)
  const [running, setRunning] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!running) {
      setStep(0)
      return
    }
    if (reduced) {
      setStep(timeline[timeline.length - 1][1]) // frame akhir statis
      return
    }
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      timers.push(setTimeout(() => { if (!cancelled) setCycle((c) => c + 1) }, 0))
      timeline.forEach(([t, s]) => timers.push(setTimeout(() => { if (!cancelled) setStep(s) }, t)))
      timers.push(setTimeout(() => { if (!cancelled) run() }, loopMs))
    }
    run()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [running, reduced, timeline, loopMs])

  return { step, cycle, wrapRef }
}
