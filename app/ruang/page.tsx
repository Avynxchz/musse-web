'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BottomNav,
  ChatInput,
  LogCounter,
  LogPanel,
  NeoBtn,
  Toast,
  useBehaviorLog,
  useToast,
} from '../components/ui';

/* ================= Data dummy coach per mapel ================= */

const COACH_DATA: Record<string, { kuat: string; kuatPct: string; lemah: string; lemahPct: string; pesan: string }> = {
  matematika: {
    kuat: 'SPLDV & Matriks',
    kuatPct: '88%',
    lemah: 'Fungsi Kuadrat',
    lemahPct: '52%',
    pesan:
      'Halo Agus! Dari 2 paket terakhir, aljabar linearmu udah mantap. Tapi di Fungsi Kuadrat kamu sering lupa syarat titik puncak. Mau latihan sekarang?',
  },
  fisika: {
    kuat: 'Kinematika',
    kuatPct: '81%',
    lemah: 'Dinamika Rotasi',
    lemahPct: '47%',
    pesan:
      'Halo Agus! Gerak lurusmu rapi banget. Tapi soal torsi & momen inersia masih sering kepleset. Kita bedah bareng?',
  },
  tkj: {
    kuat: 'Subnetting Dasar',
    kuatPct: '90%',
    lemah: 'VLAN & Routing',
    lemahPct: '55%',
    pesan:
      'Halo Agus! Perhitungan subnet udah kenceng. Tapi konfigurasi VLAN antar-switch masih goyang. Mau simulasi lagi?',
  },
  inggris: {
    kuat: 'Reading Comprehension',
    kuatPct: '85%',
    lemah: 'Structure & Written Expression',
    lemahPct: '58%',
    pesan:
      'Halo Agus! Reading-mu stabil. Tapi soal structure (tenses & clause) masih jadi kebocoran. Latihan fokus 10 soal?',
  },
};

const MAPEL_OPTIONS = [
  { value: 'matematika', label: 'Matematika (Wajib)' },
  { value: 'fisika', label: 'Fisika (Saintek)' },
  { value: 'tkj', label: 'SMK - Teknik Jaringan (TKJ)' },
  { value: 'inggris', label: 'Bahasa Inggris' },
];

/* ================= Jawaban dummy Coach per mapel (bukan LLM) ================= */

const COACH_REPLIES: Record<string, string[]> = {
  matematika: [
    'Oke, kita bedah <b>Fungsi Kuadrat</b>! Ingat 3 hal: (1) titik puncak di x = −b/2a, (2) kalau a &gt; 0 grafik buka ke atas (titik minimum), a &lt; 0 buka ke bawah (maksimum), (3) diskriminan D = b²−4ac nentuin berapa kali grafik motong sumbu-x. Mau coba 1 soal cepat?',
    'Jebakan paling sering di fungsi kuadrat: <b>lupa tanda minus</b> di rumus x = −b/2a. Trik: tulis dulu a, b, c di kertas sebelum hitung — 5 detik yang nyelametin 1 soal. Bagian mana yang masih bikin ragu?',
    'Latihan singkat: f(x) = x² − 4x + 3. Titik puncaknya di mana? (Petunjuk: a=1, b=−4, c=3 → x = −(−4)/2 = 2, lalu y = f(2) = −1. Jadi <b>(2, −1)</b>.) Coba kerjain yang mirip: g(x) = x² + 6x + 5!',
  ],
  fisika: [
    'Dinamika rotasi itu cuma <b>"versi muter" dari gerak lurus</b>: gaya → torsi (τ = r × F), massa → momen inersia (I), F = ma → τ = Iα. Kalau hafal pasangannya, soalnya jadi gampang ditebak polanya.',
    'Yang paling sering keluar: torsi <b>maksimum saat gaya tegak lurus lengan</b> (sin 90° = 1), dan momen inersia silinder pejal (½MR²) vs bola pejal (⅖MR²). Hafalin 4 rumus I benda umum — itu udah nutup 80% soal.',
    'Coba ini: kunci pas panjang 0,3 m diputar dengan gaya 50 N tegak lurus. Torsi = 0,3 × 50 = <b>15 N·m</b>. Gampang kan? Sekarang bayangin gayanya miring 30° — tinggal kali sin 30° = 0,5 → 7,5 N·m.',
  ],
  tkj: [
    'VLAN itu cara <b>mecah satu switch jadi beberapa "switch virtual"</b> biar broadcast domain kepisah tanpa beli perangkat baru. Ingat: port access = 1 VLAN (ke PC), port trunk = banyak VLAN (antar switch), ditandai protokol 802.1Q.',
    'Urutan config VLAN di switch: (1) buat VLAN (vlan 10, name LAB), (2) assign port (switchport mode access + switchport access vlan 10), (3) trunk antar switch (switchport mode trunk). <b>Ketinggalan 1 langkah = antar-VLAN nggak nyambung.</b>',
    'Routing antar-VLAN butuh <b>router-on-a-stick</b>: 1 kabel trunk dari switch ke router, terus di router bikin sub-interface per VLAN (encapsulation dot1Q). Atau pakai switch layer 3 + perintah "ip routing". Ini favorit soal UKK!',
  ],
  inggris: [
    'Structure itu soal <b>grammar murni</b>: subject-verb agreement, tenses, clause, paralelisme. Trik: baca kalimat, cari verb-nya dulu — kalau verb-nya aneh (double verb / nggak ada verb), di situlah errornya.',
    'Pola paling sering: <b>reduced clause</b> (mis. "The man standing there..." = who is standing) dan <b>parallel structure</b> ("likes reading, swimming, and jogging" — semua gerund). Ketemu "and/or/but", cek kiri-kanan harus sejajar.',
    'Coba: "Neither the teacher nor the students ___ present." Jawabannya <b>"were"</b> — aturan neither/nor: verb ikut subject TERDEKAT (students → were). Ini jebakan klasik, sekarang kamu udah tahu!',
  ],
};

/* ================= Halaman ================= */

export default function RuangPage() {
  const router = useRouter();

  const [mapelCoach, setMapelCoach] = useState('matematika');
  const { toast, showToastMsg } = useToast();
  const { logs, logEvent, showLogPanel, setShowLogPanel } = useBehaviorLog('ruang');

  /* ===== Chat Coach per mapel ===== */
  const [showCoach, setShowCoach] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ from: 'user' | 'ai'; html: string }[]>([]);
  const [coachQuota, setCoachQuota] = useState(24);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const greetedMapelRef = useRef<string>('');
  // Guard anti double-submit chat (<500ms, pesan sama)
  const lastCoachMsgRef = useRef<{ msg: string; ts: number }>({ msg: '', ts: 0 });

  const coach = COACH_DATA[mapelCoach] ?? COACH_DATA.matematika;
  const mapelLabel = MAPEL_OPTIONS.find((o) => o.value === mapelCoach)?.label ?? 'Matematika';

  const gantiMapel = (v: string) => {
    setMapelCoach(v);
    logEvent('switch_ai_room', { mapel: v });
  };

  const openCoach = () => {
    setShowCoach(true);
    logEvent('coach_chat_open', { mapel: mapelCoach });
    if (greetedMapelRef.current !== mapelCoach) {
      greetedMapelRef.current = mapelCoach;
      const label = MAPEL_OPTIONS.find((o) => o.value === mapelCoach)?.label ?? mapelCoach;
      const pesan = (COACH_DATA[mapelCoach] ?? COACH_DATA.matematika).pesan;
      setChatMsgs((prev) => [...prev, { from: 'ai', html: `<b>Coach ${label}</b><br/>${pesan}` }]);
    }
  };

  const sendCoachMsg = (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    // Guard: cegah pesan duplikat dari double-click (<500ms, pesan sama)
    // eslint-disable-next-line react-hooks/purity -- Date.now() di event handler (bukan render), aman
    const now = Date.now();
    if (lastCoachMsgRef.current.msg === msg && now - lastCoachMsgRef.current.ts < 500) return;
    lastCoachMsgRef.current = { msg, ts: now };
    if (coachQuota <= 0) {
      showToastMsg('⚠️ Kuota tanya habis hari ini');
      return;
    }
    const userCount = chatMsgs.filter((m) => m.from === 'user').length;
    const replies = COACH_REPLIES[mapelCoach] ?? COACH_REPLIES.matematika;
    const reply = replies[userCount % replies.length];
    const nextQuota = Math.max(0, coachQuota - 1);
    setChatMsgs((prev) => [...prev, { from: 'user', html: msg }, { from: 'ai', html: reply }]);
    setCoachQuota(nextQuota);
    logEvent('coach_chat_ask', { mapel: mapelCoach, prompt: msg.slice(0, 60), quota_remaining: nextQuota });
  };

  useEffect(() => {
    const el = chatBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMsgs, showCoach]);

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-dvh bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        {/* ===== Header ===== */}
        <header className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-extrabold">Ruang AI & Progres Belajar</h2>
            <p className="text-[11px] text-neutral-500">Analisis kumulatif & konsultasi AI Coach per mapel</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LogCounter count={logs.length} onClick={() => setShowLogPanel((v) => !v)} />
            <span className="border-2 border-[#111] shadow-[0_4px_0_#111] bg-[#B6FF00] px-2.5 py-1 rounded-full text-[11px] font-extrabold">
              Akurasi 74%
            </span>
          </div>
        </header>

        {/* ===== Konten scroll ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
          {/* 3 kartu statistik */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-white">
              <p className="font-mono text-lg text-[#111] font-extrabold">142</p>
              <p className="text-[10px] font-bold text-neutral-500 uppercase mt-1">Soal Selesai</p>
            </div>
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-[#B6FF00]">
              <p className="font-mono text-lg text-[#111] font-extrabold">74%</p>
              <p className="text-[10px] font-extrabold text-[#111] uppercase mt-1">Akurasi</p>
            </div>
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-white">
              <p className="font-mono text-lg text-[#4F46E5] font-extrabold">6.4j</p>
              <p className="text-[10px] font-bold text-neutral-500 uppercase mt-1">Jam Fokus</p>
            </div>
          </div>

          {/* Kartu Ruang AI Coach */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                🧠 Ruang AI Coach Mapel
              </span>
              <select
                value={mapelCoach}
                onChange={(e) => gantiMapel(e.target.value)}
                className="border-2 border-[#111] rounded-lg px-2 py-1 text-xs font-extrabold bg-[#FAFAF7]"
              >
                {MAPEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-50 border border-[#111] rounded-xl p-2.5">
                <span className="text-[10px] font-extrabold text-green-800 uppercase">💪 Topik Terkuat</span>
                <p className="font-extrabold mt-0.5">
                  {coach.kuat} ({coach.kuatPct})
                </p>
              </div>
              <div className="bg-red-50 border border-[#111] rounded-xl p-2.5">
                <span className="text-[10px] font-extrabold text-red-800 uppercase">⚠️ Perlu Dikejar</span>
                <p className="font-extrabold mt-0.5">
                  {coach.lemah} ({coach.lemahPct})
                </p>
              </div>
            </div>

            <div className="bg-[#FAFAF7] border-2 border-[#111] rounded-xl p-3 space-y-2">
              <div className="text-xs bg-white border border-[#111] rounded-xl p-2.5">
                <span className="font-extrabold text-[#4F46E5]">Coach:</span> {coach.pesan}
              </div>
              <div className="flex gap-2">
                <NeoBtn
                  onClick={() => {
                    logEvent('coach_latih_topik_lemah', { mapel: mapelCoach, topik: coach.lemah });
                    router.push('/beranda');
                  }}
                  className="flex-1 bg-[#B6FF00] py-2 rounded-xl text-xs"
                >
                  🎯 Latih Topik Lemah
                </NeoBtn>
                <NeoBtn onClick={openCoach} className="flex-1 bg-white py-2 rounded-xl text-xs">
                  💬 Diskusi sama Coach
                </NeoBtn>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-neutral-400">
            Data dummy — statistik nyata menyusul setelah konek backend.
          </p>
        </div>

        {/* ===== Bottom nav ===== */}
        <BottomNav active="ruang" />

        {/* ===== COACH CHAT SHEET ===== */}
        {showCoach && (
          <div
            className="absolute inset-0 z-40 bg-black/50 flex flex-col justify-end"
            onClick={() => setShowCoach(false)}
          >
            <div
              className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl h-[82%] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-[#B6FF00] border border-[#111] flex items-center justify-center text-xs font-extrabold shrink-0">
                    ✨
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold truncate">Coach {mapelLabel}</h3>
                    <p className="text-[10px] text-green-700 font-bold truncate">
                      ✓ Siap diskusi materi {coach.lemah}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    {coachQuota}/25 Tanya
                  </span>
                  <NeoBtn onClick={() => setShowCoach(false)} className="w-7 h-7 rounded-lg bg-white text-xs">
                    ✕
                  </NeoBtn>
                </div>
              </div>

              <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {chatMsgs.map((m, i) =>
                  m.from === 'user' ? (
                    <div key={i} className="flex justify-end">
                      <div className="bg-[#111] text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%] font-semibold">
                        {m.html}
                      </div>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="bg-[#F0FFB8] border-2 border-[#111] shadow-[0_3px_0_#111] rounded-2xl rounded-bl-sm p-3 max-w-[92%]"
                    >
                      <p className="font-medium" dangerouslySetInnerHTML={{ __html: m.html }} />
                    </div>
                  ),
                )}
              </div>

              <div className="px-3 py-2 bg-white border-t border-neutral-200 flex gap-1.5 overflow-x-auto shrink-0">
                {['Jelasin topik lemahku', 'Kasih latihan singkat', 'Tips ujian mapel ini'].map((qp) => (
                  <button
                    key={qp}
                    type="button"
                    onClick={() => sendCoachMsg(qp)}
                    className="shrink-0 bg-[#FAFAF7] border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full text-[11px] font-bold"
                  >
                    {qp}
                  </button>
                ))}
              </div>

              <ChatInput
                placeholder={`Tanya materi ${mapelLabel}...`}
                onSend={sendCoachMsg}
              />
            </div>
          </div>
        )}

        {/* ===== Toast ===== */}
        <Toast message={toast} className="bottom-20" />

        {/* ===== Panel behavior log ===== */}
        {showLogPanel && (
          <LogPanel
            logs={logs}
            onClose={() => setShowLogPanel(false)}
            badge="Telemetry"
            title="Behavior Log"
          />
        )}
      </div>
    </div>
  );
}
