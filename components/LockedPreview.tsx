'use client'

import { useState, useEffect, useRef } from 'react'
import { previewQuestions, aiDemoConversation } from '@/lib/preview-questions'
import { createClient } from '@/lib/supabase'

// Typing effect untuk demo AI
function TypingText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    setShown(0)
    const t = setInterval(() => {
      setShown((s) => {
        if (s >= text.length) {
          clearInterval(t)
          return s
        }
        return s + 3
      })
    }, speed)
    return () => clearInterval(t)
  }, [text, speed])
  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length && <span className="animate-pulse">▊</span>}
    </span>
  )
}

// Pembahasan reveal langkah per langkah
function PembahasanSteps({ steps }: { steps: string[] }) {
  const [visible, setVisible] = useState(1)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          const t = setInterval(() => {
            setVisible((v) => {
              if (v >= steps.length) {
                clearInterval(t)
                return v
              }
              return v + 1
            })
          }, 600)
          obs.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [steps.length])

  return (
    <div ref={ref} className="mt-3 rounded-md bg-[#F7F7F9] p-4">
      <p className="text-sm font-bold text-[#004a2a]">💡 Pembahasan:</p>
      <ol className="mt-2 space-y-2 text-sm text-neutral-700">
        {steps.slice(0, visible).map((step, i) => (
          <li key={i} className="animate-[fadeIn_0.4s_ease-in]">
            <span className="font-bold text-[#004a2a]">{i + 1}.</span> {step}
          </li>
        ))}
      </ol>
      {visible < steps.length && (
        <p className="mt-2 text-xs text-neutral-400">menulis pembahasan...</p>
      )}
    </div>
  )
}

export default function LockedPreview() {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showPembahasan, setShowPembahasan] = useState<Record<number, boolean>>({})
  const [aiUsed, setAiUsed] = useState(false)
  const [showAiDemo, setShowAiDemo] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState(0)

  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const answer = (qid: number, key: string) => {
    if (answers[qid]) return // kunci setelah jawab
    setAnswers((p) => ({ ...p, [qid]: key }))
  }

  return (
    <section className="border-b border-[#111111] bg-[var(--musse-section)]">
      <div className="mx-auto max-w-4xl px-5 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-black uppercase tracking-widest text-[#10150b]">Coba dulu</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[var(--musse-text)] md:text-5xl">Coba dulu, <span className="text-[var(--musse-lime)]">gratis.</span></h2>
          <p className="mt-3 text-[var(--musse-muted)]">3 soal Matematika asli. Jawab, lihat benar/salahnya langsung — tanpa daftar.</p>
        </div>

        <div className="question-carousel mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:mt-10 md:block md:space-y-6 md:overflow-visible">
          {previewQuestions.map((q, idx) => {
            const userAns = answers[q.id]
            const isCorrect = userAns === q.kunci
            const showPem = showPembahasan[q.id]

            return (
              <div key={q.id} className={'min-w-full snap-center rounded-3xl border md:min-w-0 ' + (idx === activeQuestion ? '' : 'hidden md:block') + ' border-[#111111] bg-[var(--musse-card)] p-5 shadow-2xl shadow-black/10 md:p-6'}>
                <p className="text-xs font-bold text-neutral-400">SOAL {idx + 1} / 3</p>
                <p className="mt-2 font-medium text-neutral-900">{q.pertanyaan}</p>

                <div className="mt-4 space-y-2">
                  {q.opsi.map((o) => {
                    let cls = 'border-[#EAEAEA] hover:border-[#004a2a]'
                    if (userAns) {
                      if (o.key === q.kunci) cls = 'border-green-500 bg-green-50'
                      else if (o.key === userAns) cls = 'border-red-400 bg-red-50'
                      else cls = 'border-[#EAEAEA] opacity-50'
                    }
                    return (
                      <button
                        key={o.key}
                        onClick={() => answer(q.id, o.key)}
                        disabled={!!userAns}
                        className={'flex min-h-12 w-full items-center gap-3 rounded-md border p-3 text-left text-base transition ' + cls}
                      >
                        <span className="font-bold">{o.key}.</span> {o.text}
                        {userAns && o.key === q.kunci && <span className="text-emerald-400" aria-label="Benar">✓</span>}
                        {userAns && o.key === userAns && o.key !== q.kunci && <span className="text-red-400" aria-label="Salah">×</span>}
                      </button>
                    )
                  })}
                </div>

                {userAns && (
                  <div className="mt-4">
                    {isCorrect ? (
                      <p className="font-bold text-green-600">Benar!</p>
                    ) : (
                      <p className="font-bold text-red-500">
                        Kurang tepat. Kunci jawabannya {q.kunci}.
                      </p>
                    )}

                    {/* Pembahasan: soal 1 FULL, sisanya terkunci */}
                    {!q.pembahasanTerkunci ? (
                      <PembahasanSteps steps={q.pembahasan} />
                    ) : !showPem ? (
                      <button
                        onClick={() => setShowPembahasan((p) => ({ ...p, [q.id]: true }))}
                        className="mt-3 text-sm font-bold text-[#004a2a] underline"
                      >
                        Lihat pembahasan →
                      </button>
                    ) : (
                      <div className="relative mt-3 overflow-hidden card-framed rounded-2xl p-6 text-center">
                        <div className="pointer-events-none select-none blur-[5px] opacity-60" aria-hidden="true"><p className="text-left text-xs leading-6 text-[var(--musse-text)]">Langkah berikutnya: substitusi nilai ke persamaan utama. Dari sini kita bisa menemukan nilai variabel dan memastikan jawaban akhir.</p></div>
                        <div className="relative mt-3"><p className="text-sm font-bold text-[var(--musse-text)]">Pembahasan lengkap terkunci</p><button onClick={handleLogin} className="mt-3 rounded-full bg-[var(--musse-lime)] px-5 py-2.5 text-xs font-extrabold text-[#10150b] transition hover:-translate-y-0.5">Login dengan Google untuk buka semua</button></div>
                      </div>
                    )}
                  </div>
                )}
                {idx < previewQuestions.length - 1 && <button onClick={() => setActiveQuestion(idx + 1)} className="mt-5 min-h-12 w-full rounded-full bg-[#111111] px-4 text-sm font-extrabold text-white md:hidden">Lanjut ke soal {idx + 2}</button>}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-center text-sm font-bold text-[var(--musse-muted)] md:hidden">Soal {activeQuestion + 1}/3</p>

        {/* Demo AI Chat: 1x gratis */}
        <div className="mt-8 card-framed card-hover rounded-2xl p-6 transition-transform">
          <h3 className="font-bold text-[var(--musse-text)]">Coba AI Tutor — 1x gratis</h3>
          {!showAiDemo ? (
            <button
              onClick={() => {
                if (!aiUsed) {
                  setShowAiDemo(true)
                  setAiUsed(true)
                }
              }}
              disabled={aiUsed}
              className="mt-3 rounded-md bg-[#004a2a] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {aiUsed ? 'Kesempatan habis — login untuk lanjut' : 'Tanya AI tentang soal di atas'}
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              {aiDemoConversation.map((m, i) => (
                <div
                  key={i}
                  className={'rounded-md p-3 text-sm ' + (m.role === 'user' ? 'ml-8 bg-[#F7F7F9]' : 'mr-8 border border-[#EAEAEA]')}
                >
                  <p className="text-xs font-bold text-neutral-400">
                    {m.role === 'user' ? 'Kamu' : 'AI Tutor'}
                  </p>
                  <p className="mt-1 text-neutral-800">
                    {m.role === 'ai' ? <TypingText text={m.text} /> : m.text}
                  </p>
                </div>
              ))}
              <p className="text-center text-xs text-neutral-400">Contoh percakapan</p>
              {aiUsed && (
                <button
                  onClick={handleLogin}
                  className="w-full rounded-md bg-[#004a2a] px-4 py-3 text-sm font-bold text-white"
                >
                  Login dengan Google untuk tanya sepuasnya
                </button>
              )}
            </div>
          )}
        </div>
        <p className="mt-5 text-center text-xs text-[var(--musse-muted)]">Tanpa daftar, tanpa data tersimpan.</p>
      </div>
    </section>
  )
}
