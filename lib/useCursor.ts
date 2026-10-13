'use client'

import { useEffect, useState, type RefObject } from 'react'
import { DESIGN_W, STAGE_H } from './demo-content'

/* Posisi elemen relatif ke ancestor (koordinat lokal, tidak terpengaruh scale). */
function posInAncestor(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0
  let y = 0
  let cur: HTMLElement | null = el
  while (cur && cur !== ancestor) {
    x += cur.offsetLeft
    y += cur.offsetTop
    cur = cur.offsetParent as HTMLElement | null
  }
  return { x, y }
}

export type CursorState = {
  x: number
  y: number
  opacity: number
  press: boolean
  ready: boolean
  snap: boolean
}

/*
 * State machine kursor demo: meluncur ke tengah opsi B (0,9 dtk) → menekan → fade out.
 * Posisi target diukur dari DOM (bukan ditebak), snap tanpa transisi saat reposisi.
 */
export function useCursor(
  innerRef: RefObject<HTMLDivElement | null>,
  optBRef: RefObject<HTMLDivElement | null>,
  step: number
): CursorState {
  const [cursor, setCursor] = useState<CursorState>({
    x: 0,
    y: 0,
    opacity: 0,
    press: false,
    ready: false,
    snap: true,
  })

  useEffect(() => {
    if (step === 2 && innerRef.current && optBRef.current) {
      const p = posInAncestor(optBRef.current, innerRef.current)
      const tx = p.x + optBRef.current.offsetWidth / 2
      const ty = p.y + optBRef.current.offsetHeight / 2
      /* Fase 1: snap ke posisi awal tanpa transisi (tak terlihat) */
      setCursor({ x: DESIGN_W + 30, y: STAGE_H - 80, opacity: 0, press: false, ready: true, snap: true })
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() =>
          setCursor({ x: tx, y: ty, opacity: 1, press: false, ready: true, snap: false })
        )
      })
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }
    if (step === 3) setCursor((c) => (c.press ? c : { ...c, press: true }))
    if (step >= 4 || step < 2) {
      setCursor((c) => (c.opacity === 0 && !c.press ? c : { ...c, opacity: 0, press: false }))
    }
  }, [step, innerRef, optBRef])

  return cursor
}
