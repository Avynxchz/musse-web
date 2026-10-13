'use client'

import { useMemo } from 'react'

/* Deteksi prefers-reduced-motion (dievaluasi sekali saat mount). */
export function useReducedMotion() {
  return useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
}
