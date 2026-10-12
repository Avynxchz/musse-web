'use client'

// Mockup HP realistis: tampilan kuis asli
export function QuizPhoneMockup() {
  return (
    <div className="w-[280px] rounded-[2rem] border-[6px] border-neutral-900 bg-white shadow-xl">
      <div className="overflow-hidden rounded-[1.6rem]">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-white px-5 pt-3 text-[10px] font-bold">
          <span>09:41</span>
          <div className="h-4 w-16 rounded-full bg-neutral-900" />
          <span>🔋</span>
        </div>
        {/* App header */}
        <div className="border-b border-[#EAEAEA] px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-500">Matematika · Paket 1</span>
            <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-500">45:00</span>
          </div>
          <div className="mt-2 h-1 rounded bg-[#EAEAEA]">
            <div className="h-1 w-1/4 rounded bg-[#004a2a]" />
          </div>
        </div>
        {/* Soal */}
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold text-neutral-400">SOAL 12 / 46</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-800">
            Harga 3 buku dan 2 penggaris Rp18.000. Jika buku Rp1.000 lebih mahal dari penggaris,
            harga 2 buku dan 5 penggaris adalah....
          </p>
          <div className="mt-3 space-y-1.5">
            {['A. Rp19.000', 'B. Rp23.000', 'C. Rp25.000'].map((o, i) => (
              <div
                key={o}
                className={`rounded-md border px-2.5 py-2 text-[11px] ${
                  i === 1
                    ? 'border-green-500 bg-green-50 font-bold'
                    : 'border-[#EAEAEA] text-neutral-600'
                }`}
              >
                {o} {i === 1 && '✅'}
              </div>
            ))}
          </div>
          {/* Pembahasan teaser */}
          <div className="mt-3 rounded-md bg-[#F7F7F9] p-2.5">
            <p className="text-[10px] font-bold text-[#004a2a]">💡 Pembahasan</p>
            <p className="mt-1 text-[10px] leading-relaxed text-neutral-600">
              Misal buku = x, penggaris = y. Substitusi x = y + 1000 ke 3x + 2y = 18000...
            </p>
          </div>
        </div>
        {/* Bottom nav */}
        <div className="flex justify-around border-t border-[#EAEAEA] px-4 py-2.5">
          {['🏠', '📝', '🤖', '👤'].map((icon, i) => (
            <span key={i} className={`text-base ${i === 1 ? 'opacity-100' : 'opacity-40'}`}>
              {icon}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
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
            <div className="rounded border border-green-500 bg-green-50 px-2 py-1.5 text-[11px] font-bold">B. Rp23.000 ✅</div>
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
            <p className="mt-1 text-[9px] text-neutral-500">"Aljabarmu naik 23%. Fokus ke geometri ya!"</p>
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
            <p className="text-[10px] font-bold">🎯 Misi hari ini</p>
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
                {i < 5 ? '🔥' : d}
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
