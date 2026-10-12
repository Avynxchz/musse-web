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

  useEffect(() => {
    if (!file) return
    setSrc(`/icons/${file}.json`)
  }, [file])

  if (!file || !src) {
    return <div className="h-16 w-16 rounded-2xl bg-[#004a2a]/10" />
  }

  return (
    <div
      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#004a2a]/10 transition-transform group-hover:scale-110"
      onMouseEnter={() => lottieRef.current?.play()}
      onMouseLeave={() => lottieRef.current?.pause()}
    >
      <Lottie
        lottieRef={lottieRef}
        src={src}
        autoplay
        loop={false}
        className="h-12 w-12"
      />
    </div>
  )
}
