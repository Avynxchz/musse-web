'use client'

import { useEffect, useRef, useState } from 'react'
import { Lottie, type LottieHandle } from 'lottie-react'

// Mapping visual key → file JSON di public/icons/
const ICON_FILES: Record<string, string> = {
  mapel: 'book',
  'benar-salah': 'check',
  pembahasan: 'question',
  'ai-chat': 'chat',
  'ai-room': 'avatars',
  pendamping: 'wand',
  progres: 'trending',
  autopsi: 'magnifier',
  misi: 'crosshair',
  tryout: 'clipboard',
  streak: 'bonfire',
  countdown: 'clock',
}

export default function AnimatedIcon({ type }: { type: string }) {
  const file = ICON_FILES[type]
  const [src, setSrc] = useState<string | null>(null)
  const lottieRef = useRef<LottieHandle>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!file) return
    setSrc(`/icons/${file}.json`)
  }, [file])

  // Mainkan animasi saat kartu masuk layar (penting buat HP — nggak ada hover)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            lottieRef.current?.stop()
            lottieRef.current?.play()
          }
        })
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [src])

  if (!file || !src) {
    return <div className="h-16 w-16 rounded-2xl bg-[#004a2a]/10" />
  }

  const replay = () => {
    lottieRef.current?.stop()
    lottieRef.current?.play()
  }

  return (
    <div
      ref={wrapRef}
      className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl bg-[#004a2a]/10 transition-transform group-hover:scale-110 active:scale-95"
      onMouseEnter={replay}
      onClick={replay}
    >
      <Lottie
        lottieRef={lottieRef}
        src={src}
        autoplay={false}
        loop={false}
        className="h-12 w-12"
      />
    </div>
  )
}
