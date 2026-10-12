'use client'

function PhoneFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative w-[220px] shrink-0 rounded-[2rem] border-[7px] border-[#252b3b] bg-[#f8fafc] p-1 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${className}`}><div className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-[#252b3b]" /><div className="overflow-hidden rounded-[1.45rem]">{children}</div></div>
}

export function QuizPhoneMockup() {
  return <PhoneFrame className="-rotate-6 transition-transform duration-500 hover:-translate-y-2 hover:-rotate-3"><div className="min-h-[360px] bg-[#f8fafc] text-slate-900"><div className="flex justify-between px-4 pb-3 pt-6 text-[9px] font-bold"><span>09:41</span><span className="text-slate-400">musse</span></div><div className="border-b border-slate-200 px-4 pb-3"><div className="flex justify-between text-[10px] font-bold"><span>Matematika</span><span className="text-indigo-600">12 / 46</span></div><div className="mt-2 h-1 rounded bg-slate-200"><div className="h-1 w-1/4 rounded bg-indigo-600" /></div></div><div className="px-4 py-4"><p className="text-[9px] font-bold text-slate-400">SOAL 12</p><p className="mt-2 text-[11px] font-semibold leading-relaxed">Harga 3 buku dan 2 penggaris Rp18.000. Harga 2 buku dan 5 penggaris adalah...</p><div className="mt-4 flex flex-col gap-2">{['Rp19.000', 'Rp23.000', 'Rp25.000'].map((option, index) => <div key={option} className={`rounded-lg border px-3 py-2 text-[10px] ${index === 1 ? 'border-indigo-600 bg-indigo-50 font-bold' : 'border-slate-200'}`}><span className="mr-2 text-slate-400">{String.fromCharCode(65 + index)}</span>{option}{index === 1 && <span className="float-right text-indigo-600">✓</span>}</div>)}</div><div className="mt-4 rounded-xl bg-indigo-50 p-3"><p className="text-[9px] font-bold text-indigo-700">Pembahasan tersedia</p><p className="mt-1 text-[9px] leading-relaxed text-slate-500">Substitusi x = y + 1000 ke persamaan utama...</p></div></div><div className="mt-2 flex justify-around border-t border-slate-200 px-4 py-3 text-[10px] text-slate-400"><span>⌂</span><span className="font-bold text-indigo-600">▦</span><span>?</span><span>◯</span></div></div></PhoneFrame>
}

export function TutorPhoneMockup() {
  return <PhoneFrame className="-ml-12 translate-y-12 rotate-6 scale-[0.86] sm:-ml-16"><div className="min-h-[360px] bg-white text-[#111111]"><div className="flex items-center gap-2 px-4 pb-4 pt-7"><span className="flex size-7 items-center justify-center rounded-full bg-[var(--musse-lime)] text-xs font-black text-slate-900">AI</span><div><p className="text-[10px] font-bold">AI Tutor</p><p className="text-[8px] text-slate-400">Siap bantu kapan saja</p></div></div><div className="flex flex-col gap-3 px-4 pt-8 text-[10px]"><div className="self-end rounded-2xl rounded-br-sm bg-indigo-600 px-3 py-2">Kenapa jawaban B?</div><div className="rounded-2xl rounded-bl-sm bg-[#F1F1EC] px-3 py-2 leading-relaxed text-slate-200">Karena kita substitusi nilai x ke persamaan. Yuk, lihat langkahnya bersama.</div><div className="self-end rounded-2xl rounded-br-sm bg-indigo-600 px-3 py-2">Oh, sekarang paham!</div></div><div className="mx-4 mt-20 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[9px] text-slate-500">Tanya apa saja tentang soal...</div></div></PhoneFrame>
}

// Mockup mini untuk kartu fitur
export function FeatureVisual({ type }: { type: string }) {
  const base = 'flex h-32 items-center justify-center rounded-md bg-[#F7F7F9] overflow-hidden p-3'

  switch (type) {
    case 'mapel':
      return (
        <div className={base}>
          <div className="grid w-full grid-cols-3 gap-1.5">
            {['MTK', 'FIS', 'KIM', 'BIO', 'IND', 'ING'].map((m) => (
              <div key={m} className="rounded border border-[#EAEAEA] bg-white px-1 py-2 text-center text-[10px] font-bold">
                {m}
              </div>
            ))}
          </div>
        </div>
      )
    case 'benar-salah':
      return (
        <div className={base}>
          <div className="w-full space-y-1.5">
            <div className="rounded border border-green-500 bg-green-50 px-2 py-1.5 text-[11px] font-bold">B. Rp23.000 ✓</div>
            <div className="rounded border border-[#EAEAEA] bg-white px-2 py-1.5 text-[11px] text-neutral-400">A. Rp19.000</div>
          </div>
        </div>
      )
    case 'pembahasan':
      return (
        <div className={base}>
          <div className="w-full rounded border border-[#EAEAEA] bg-white p-2">
            <p className="text-[10px] font-bold text-[#004a2a]">💡 Langkah 1/5</p>
            <div className="mt-1 h-1.5 w-3/4 rounded bg-[#EAEAEA]" />
            <div className="mt-1 h-1.5 w-1/2 rounded bg-[#EAEAEA]" />
          </div>
        </div>
      )
    case 'ai-chat':
      return (
        <div className={base}>
          <div className="w-full space-y-1.5">
            <div className="ml-6 rounded-md bg-white border border-[#EAEAEA] p-1.5 text-[10px]">Kenapa B?</div>
            <div className="mr-6 rounded-md bg-[#004a2a] p-1.5 text-[10px] text-white">Karena substitusi x = y+1000... 💡</div>
          </div>
        </div>
      )
    case 'ai-room':
      return (
        <div className={base}>
          <div className="w-full rounded border border-[#EAEAEA] bg-white p-2 text-center">
            <p className="text-lg">⚛️</p>
            <p className="text-[10px] font-bold">Ruang Fisika</p>
            <p className="text-[9px] text-neutral-400">128 diskusi aktif</p>
          </div>
        </div>
      )
    case 'pendamping':
      return (
        <div className={base}>
          <div className="w-full rounded border border-[#EAEAEA] bg-white p-2">
            <p className="text-[10px] font-bold">🧠 Insight minggu ini</p>
            <p className="mt-1 text-[9px] text-neutral-500">&quot;Aljabarmu naik 23%. Fokus ke geometri ya!&quot;</p>
          </div>
        </div>
      )
    case 'progres':
      return (
        <div className={base}>
          <div className="flex w-full items-end justify-center gap-1.5">
            {[40, 65, 45, 80, 70, 95].map((h, i) => (
              <div key={i} className="w-5 rounded-t bg-[#004a2a]" style={{ height: `${h * 0.7}px`, opacity: 0.4 + (i / 10) }} />
            ))}
          </div>
        </div>
      )
    case 'autopsi':
      return (
        <div className={base}>
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[10px]"><span>Konsep</span><span className="font-bold text-red-500">62% salah</span></div>
            <div className="h-1.5 rounded bg-[#EAEAEA]"><div className="h-1.5 w-3/5 rounded bg-red-400" /></div>
            <div className="flex justify-between text-[10px]"><span>Hitung</span><span className="font-bold text-green-600">12% salah</span></div>
            <div className="h-1.5 rounded bg-[#EAEAEA]"><div className="h-1.5 w-1/6 rounded bg-green-500" /></div>
          </div>
        </div>
      )
    case 'misi':
      return (
        <div className={base}>
          <div className="w-full rounded border-2 border-[#004a2a] bg-white p-2">
            <p className="text-[10px] font-bold">Misi hari ini</p>
            <p className="text-[9px] text-neutral-500">Kerjakan 10 soal Aljabar</p>
            <div className="mt-1 h-1 rounded bg-[#EAEAEA]"><div className="h-1 w-2/3 rounded bg-[#004a2a]" /></div>
          </div>
        </div>
      )
    case 'tryout':
      return (
        <div className={base}>
          <div className="w-full rounded border border-[#EAEAEA] bg-white p-2 text-center">
            <p className="text-xl font-extrabold text-red-500">59:59</p>
            <p className="text-[10px] text-neutral-500">Simulasi TKA · 25 soal</p>
          </div>
        </div>
      )
    case 'streak':
      return (
        <div className={base}>
          <div className="flex gap-1">
            {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => (
              <div key={i} className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${i < 5 ? 'bg-orange-100 text-orange-600' : 'bg-[#EAEAEA] text-neutral-400'}`}>
                {i < 5 ? d : d}
              </div>
            ))}
          </div>
        </div>
      )
    case 'countdown':
      return (
        <div className={base}>
          <div className="flex gap-2">
            {[['14', 'hari'], ['08', 'jam'], ['32', 'mnt']].map(([v, l]) => (
              <div key={l} className="rounded border border-[#EAEAEA] bg-white px-2 py-1 text-center">
                <p className="text-sm font-extrabold">{v}</p>
                <p className="text-[9px] text-neutral-400">{l}</p>
              </div>
            ))}
          </div>
        </div>
      )
    default:
      return <div className={base} />
  }
}
