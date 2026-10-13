'use client'

import { useEffect, useRef } from 'react'

/*
 * Pause animasi CSS infinite (float, marquee, orbit, chat loop) saat pembungkusnya
 * keluar viewport ATAU tab browser disembunyikan — hemat CPU/GPU.
 * Bekerja dengan class .anim-pause-scope di globals.css: hook ini hanya mengubah
 * variabel --anim-play-state ('running'/'paused'), tanpa re-render React.
 */
export function usePauseWhenHidden<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let inView = true
    let tabVisible = !document.hidden
    const apply = () => {
      el.style.setProperty('--anim-play-state', inView && tabVisible ? 'running' : 'paused')
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        apply()
      },
      { threshold: 0 }
    )
    const onVisibility = () => {
      tabVisible = !document.hidden
      apply()
    }
    obs.observe(el)
    document.addEventListener('visibilitychange', onVisibility)
    apply()
    return () => {
      obs.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return ref
}
