'use client';

import { useState } from 'react';
import { MAPELS, KATEGORI, STATS, RIWAYAT, SOAL_LIST, AUTOPSI_TIRUAN, AI_TUTOR_TIRUAN } from './data';

type Screen = 'latihan' | 'progres' | 'ruangai' | 'akun' | 'soal' | 'hasil';
type Sheet = null | 'mode' | 'ai' | 'peta';

/* ---------- komponen kecil ---------- */
function Card({ children, dark, style }: { children: React.ReactNode; dark?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: '1.5px solid #111', borderRadius: 14, padding: 14, marginBottom: 10,
        boxShadow: '0 3px 0 #111', background: dark ? '#111' : '#fff',
        color: dark ? '#fff' : '#111', ...style,
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, ghost, dark, style }: { children: React.ReactNode; onClick?: () => void; ghost?: boolean; dark?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', padding: 12, borderRadius: 12, fontWeight: 800, fontSize: 14,
        border: '1.5px solid #111', cursor: 'pointer', marginTop: 8, boxShadow: '0 3px 0 #111',
        background: dark ? '#111' : ghost ? '#fff' : '#B6FF00',
        color: dark ? '#fff' : '#111', ...style,
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children, lime }: { children: React.ReactNode; lime?: boolean }) {
  return (
    <span style={{ background: lime ? '#B6FF00' : '#111', color: lime ? '#111' : '#fff', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}>
      {children}
    </span>
  );
}

function Sect({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#999', margin: '16px 0 8px' }}>
      {children}
    </div>
  );
}

function Pbar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 8, background: '#eee', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#B6FF00', borderRadius: 4 }} />
    </div>
  );
}

/* ---------- layar-layar ---------- */
function Latihan({ go, openSheet }: { go: (s: Screen) => void; openSheet: (s: Sheet) => void }) {
  const [showGuest, setShowGuest] = useState(true);
  const [kat, setKat] = useState('Pilihanmu');
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Zona Navigasi · Menu 1</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, color: '#666' }}>Halo,</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Agus 👋</div>
        </div>
        <span style={{ flex: 1 }} />
        <Badge>🔥 14</Badge>
        <Badge lime>🎯 H-42</Badge>
      </div>

      {showGuest && (
        <Card>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, fontSize: 12, color: '#666' }}>Progresmu tersimpan di HP ini. <b>Masuk Google</b> biar aman & dapat 25 kuota AI/hari.</div>
            <Btn style={{ width: 'auto', margin: 0, padding: '8px 14px', fontSize: 12 }}>Masuk</Btn>
            <button onClick={() => setShowGuest(false)} style={{ border: 'none', background: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
        </Card>
      )}

      <Card dark>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>▶️ Lanjutkan Terakhir</div>
        <div style={{ fontSize: 12, color: '#bbb' }}>Matematika · Paket 1 · Soal 12/25</div>
        <Pbar pct={48} />
      </Card>

      <Sect>Katalog Mapel</Sect>
      <input placeholder="🔍 Cari mapel..." style={{ width: '100%', border: '1.5px solid #111', borderRadius: 20, padding: '10px 16px', fontSize: 13, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 6 }}>
        {KATEGORI.map((k) => (
          <button key={k} onClick={() => setKat(k)} style={{ flex: 'none', border: '1.5px solid #111', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 700, background: kat === k ? '#111' : '#fff', color: kat === k ? '#fff' : '#111', cursor: 'pointer' }}>{k}</button>
        ))}
        <button style={{ flex: 'none', border: '1.5px solid #111', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 700, background: '#fff', cursor: 'pointer' }}>⚙️ Atur</button>
      </div>

      {MAPELS.filter((m) => kat === 'Pilihanmu' || m.kategori === kat).map((m) => (
        <Card key={m.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>{m.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{m.nama}</div>
              <div style={{ fontSize: 12, color: '#666' }}>Resmi Pusmendik</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2] as const).map((p) => {
              const d = p === 1 ? m.paket1 : m.paket2;
              return (
                <button key={p} onClick={() => openSheet('mode')} style={{ flex: 1, border: '1.5px solid #111', borderRadius: 10, padding: '10px 6px', fontSize: 12, fontWeight: 800, background: p === 1 && d.progress > 0 ? '#B6FF00' : '#fff', cursor: 'pointer', boxShadow: p === 1 && d.progress > 0 ? '0 2px 0 #111' : 'none' }}>
                  Paket {p}
                  <small style={{ display: 'block', fontWeight: 400, color: '#666', marginTop: 2 }}>{d.soal} soal · {d.durasi}{d.progress > 0 ? ` · ${d.progress}%` : ''}</small>
                </button>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Progres({ go }: { go: (s: Screen) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Zona Navigasi · Menu 2</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Progres</div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        {[{ n: String(STATS.soal), l: 'Soal' }, { n: `${STATS.akurasi}%`, l: 'Akurasi' }, { n: STATS.waktu, l: 'Belajar' }].map((s) => (
          <Card key={s.l} style={{ flex: 1, textAlign: 'center', padding: '10px 6px', marginBottom: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{s.n}</div>
            <div style={{ fontSize: 10, color: '#666' }}>{s.l}</div>
          </Card>
        ))}
      </div>
      <Sect>Performa per mapel → tap buat Ruang AI</Sect>
      <Card>
        <div onClick={() => go('ruangai')} style={{ cursor: 'pointer' }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>📐 Matematika <span style={{ float: 'right' }}>72%</span></div>
          <div style={{ fontSize: 12, color: '#666' }}>P1: 76% · P2: 68%</div>
          <div style={{ color: '#4F46E5', fontWeight: 700, marginTop: 4, fontSize: 12 }}>Buka Ruang AI & Analisis →</div>
        </div>
      </Card>
      <Card><div style={{ fontWeight: 800, fontSize: 14 }}>⚛️ Fisika <span style={{ float: 'right' }}>64%</span></div><div style={{ fontSize: 12, color: '#666' }}>P1: 64% · P2: —</div></Card>
      <Card><div style={{ fontWeight: 800, fontSize: 14 }}>🇬🇧 B. Inggris <span style={{ float: 'right' }}>82%</span></div><div style={{ fontSize: 12, color: '#666' }}>P1: 82% · P2: —</div></Card>
      <Sect>Riwayat tryout</Sect>
      {RIWAYAT.map((r) => (
        <div key={r.mapel} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
          <span>{r.mapel} {r.paket} — {r.kapan}</span><b>{r.skor}%</b>
        </div>
      ))}
      <Btn ghost style={{ color: '#e11d48', borderColor: '#e11d48' }}>🗑️ Reset Riwayat</Btn>
    </div>
  );
}

function RuangAI({ go }: { go: (s: Screen) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Zona Navigasi · Sub-layar Progres</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={() => go('progres')} style={{ border: '1.5px solid #111', background: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer' }}>‹</button>
        <div style={{ fontSize: 22, fontWeight: 800 }}>🧠 Ruang AI · MTK</div>
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <Card style={{ flex: 1, textAlign: 'center', padding: '10px 6px', marginBottom: 0 }}><div style={{ fontSize: 20, fontWeight: 800 }}>72%</div><div style={{ fontSize: 10, color: '#666' }}>Akurasi</div></Card>
        <Card style={{ flex: 1, textAlign: 'center', padding: '10px 6px', marginBottom: 0 }}><div style={{ fontSize: 20, fontWeight: 800 }}>2,1m</div><div style={{ fontSize: 10, color: '#666' }}>/soal</div></Card>
        <Card style={{ flex: 1, textAlign: 'center', padding: '10px 6px', marginBottom: 0 }}><div style={{ fontSize: 13, fontWeight: 800 }}>Cerita</div><div style={{ fontSize: 10, color: '#666' }}>Terlemah</div></Card>
      </div>
      <div style={{ background: '#111', color: '#fff', borderRadius: 12, padding: '10px 12px', fontSize: 13, marginBottom: 8, maxWidth: '85%' }}>
        Topik terlemahmu: soal cerita (58%). Mau bahas 5 soal terakhir yang salah, atau latih topik ini?
      </div>
      <div>
        <span style={{ border: '1.5px solid #111', borderRadius: 16, padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#fff', margin: '0 6px 6px 0', display: 'inline-block' }}>Bahas 5 soal yang salah</span>
        <span style={{ border: '1.5px solid #111', borderRadius: 16, padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#fff', margin: '0 6px 6px 0', display: 'inline-block' }}>Latih topik ini</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input placeholder="Tanya coach..." style={{ flex: 1, border: '1.5px solid #111', borderRadius: 20, padding: '10px 14px', fontSize: 13 }} />
        <button style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '50%', width: 42, height: 42, fontSize: 18, cursor: 'pointer' }}>➤</button>
      </div>
    </div>
  );
}

function Akun() {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Zona Navigasi · Menu 3</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Akun</div>
      <Card dark>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Agus</div>
        <div style={{ fontSize: 12, color: '#bbb' }}>agus@gmail.com</div>
        <div style={{ fontSize: 12, color: '#bbb', marginTop: 6 }}>Kuota AI hari ini: <b style={{ color: '#B6FF00' }}>18/25</b></div>
        <Btn>Masuk dengan Google</Btn>
      </Card>
      <Sect>Pengaturan Belajar</Sect>
      {[['📅 Tanggal Ujian TKA', 'H-42 ›'], ['🔔 Pengingat Harian', '19:00 ›'], ['🔠 Ukuran Teks', 'Normal ›']].map(([a, b]) => (
        <div key={a} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
          <span>{a}</span><span style={{ color: '#999' }}>{b}</span>
        </div>
      ))}
      <Sect>Bantuan</Sect>
      {[['❓ FAQ', '›'], ['🐞 Lapor Bug', '›']].map(([a, b]) => (
        <div key={a} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
          <span>{a}</span><span style={{ color: '#999' }}>{b}</span>
        </div>
      ))}
      <Btn ghost>Keluar</Btn>
    </div>
  );
}

function Soal({ go, openSheet }: { go: (s: Screen) => void; openSheet: (s: Sheet) => void }) {
  const [idx, setIdx] = useState(0);
  const [jawab, setJawab] = useState<number | null>(null);
  const [ragu, setRagu] = useState(false);
  const soal = SOAL_LIST[idx];
  const gantiSoal = (d: number) => {
    const n = Math.min(Math.max(0, idx + d), SOAL_LIST.length - 1);
    setIdx(n); setJawab(null); setRagu(false);
  };
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Zona Fokus · Full-screen (80%)</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={() => go('latihan')} style={{ border: '1.5px solid #111', background: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer' }}>✕</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#666', fontWeight: 700, marginBottom: 4 }}>Soal {soal.nomor}/{SOAL_LIST.length} (tiruan)</div>
          <Pbar pct={48} />
        </div>
        <Badge><span style={{ background: '#e11d48', color: '#fff', borderRadius: 20, padding: '6px 12px', fontVariantNumeric: 'tabular-nums' }}>⏱ 48:15</span></Badge>
        <button style={{ border: '1.5px solid #111', background: '#fff', borderRadius: 12, padding: '8px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Aa</button>
        <button onClick={() => openSheet('peta')} style={{ border: '1.5px solid #111', background: '#fff', borderRadius: 12, padding: '8px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>▦</button>
      </div>

      <div style={{ fontSize: 11, color: '#999', fontWeight: 700, marginBottom: 6 }}>TIPE: {soal.tipe}</div>
      {soal.stimulus && <div style={{ fontSize: 13, color: '#666', background: '#f4f4f4', borderRadius: 10, padding: 10, marginBottom: 10 }}>{soal.stimulus}</div>}
      <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 14 }}>
        <b>{soal.nomor}.</b> {soal.pertanyaan}
      </div>

      {soal.opsi.map((o, i) => (
        <div key={i} onClick={() => setJawab(i)} style={{ border: '1.5px solid', borderColor: jawab === i ? '#111' : '#ddd', borderRadius: 12, padding: '12px 14px', marginBottom: 8, fontSize: 14, display: 'flex', gap: 10, cursor: 'pointer', background: jawab === i ? '#f6ffdc' : '#fff', boxShadow: jawab === i ? '0 2px 0 #111' : 'none' }}>
          <span style={{ fontWeight: 800, border: '1.5px solid #111', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, background: jawab === i ? '#B6FF00' : '#fff' }}>{o.key}</span>
          {o.text}
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
        <button onClick={() => gantiSoal(-1)} style={{ flex: 1, border: '1.5px solid #111', background: '#fff', borderRadius: 12, padding: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>←</button>
        <button onClick={() => gantiSoal(1)} style={{ flex: 1, border: '1.5px solid #111', background: '#fff', borderRadius: 12, padding: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: idx === SOAL_LIST.length - 1 ? 0.4 : 1 }}>→</button>
        <button onClick={() => setRagu(!ragu)} style={{ flex: 1, border: '1.5px solid #111', background: ragu ? '#fef08a' : '#fff', borderRadius: 12, padding: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚑ Ragu</button>
        <button style={{ flex: 1, border: '1.5px solid #111', background: '#B6FF00', borderRadius: 12, padding: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cek Jawaban</button>
      </div>
      <Btn dark onClick={() => go('hasil')}>Selesai ✓</Btn>
      <button onClick={() => openSheet('ai')} style={{ position: 'absolute', right: 6, bottom: 150, background: '#111', color: '#fff', borderRadius: 30, padding: '12px 18px', fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.3)' }}>
        ✨ Tanya AI (4/5)
      </button>
    </div>
  );
}

function Hasil({ go }: { go: (s: Screen) => void }) {
  const [filt, setFilt] = useState('Salah');
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Zona Fokus · Full-screen (80%)</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={() => go('latihan')} style={{ border: '1.5px solid #111', background: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 16, cursor: 'pointer' }}>‹</button>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Hasil</div>
      </div>
      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ fontSize: 56, fontWeight: 800 }}>76%</div>
        <div style={{ color: '#666', fontSize: 13 }}>Matematika Paket 1 · 42 menit · 🔥 streak lanjut!</div>
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <Card style={{ flex: 1, textAlign: 'center', padding: '10px 6px', marginBottom: 0 }}><div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>19</div><div style={{ fontSize: 10, color: '#666' }}>Benar</div></Card>
        <Card style={{ flex: 1, textAlign: 'center', padding: '10px 6px', marginBottom: 0 }}><div style={{ fontSize: 20, fontWeight: 800, color: '#e11d48' }}>4</div><div style={{ fontSize: 10, color: '#666' }}>Salah</div></Card>
        <Card style={{ flex: 1, textAlign: 'center', padding: '10px 6px', marginBottom: 0 }}><div style={{ fontSize: 20, fontWeight: 800 }}>2</div><div style={{ fontSize: 10, color: '#666' }}>Kosong</div></Card>
      </div>
      <Card style={{ borderLeft: '4px solid #e11d48' }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{AUTOPSI_TIRUAN.judul}</div>
        <div style={{ fontSize: 12, color: '#666' }}><b>Temuan:</b> {AUTOPSI_TIRUAN.temuan}<br /><b>Strategi:</b> {AUTOPSI_TIRUAN.strategi}</div>
        <Btn>🎯 Latih Soal Topik Ini</Btn>
      </Card>
      <Sect>Review pembahasan</Sect>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {['Semua 25', 'Salah 4', 'Ragu 2', 'Benar 19'].map((f) => (
          <div key={f} onClick={() => setFilt(f.split(' ')[0])} style={{ flex: 1, textAlign: 'center', padding: '7px 4px', fontSize: 11, fontWeight: 700, borderRadius: 8, background: filt === f.split(' ')[0] ? '#111' : '#f0f0f0', color: filt === f.split(' ')[0] ? '#fff' : '#888', cursor: 'pointer' }}>{f}</div>
        ))}
      </div>
      <Card>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Soal 5 — kamu: C, kunci: B</div>
        <div style={{ fontSize: 12, color: '#666' }}>1. Turunkan f(x) → f′(x) = 4x − 5<br />2. Substitusi x = 2 → 3<br />3. Jawaban: A</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ border: '1.5px solid #111', borderRadius: 16, padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#fff', margin: '0 6px 6px 0', display: 'inline-block' }}>✨ Tanya AI bagian ini</span>
          <span style={{ border: '1.5px solid #111', borderRadius: 16, padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#fff', margin: '0 6px 6px 0', display: 'inline-block' }}>🔄 Soal serupa</span>
        </div>
      </Card>
      <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
        <Btn ghost style={{ margin: 0 }} onClick={() => go('latihan')}>← Beranda</Btn>
        <Btn style={{ margin: 0 }}>Coba Lagi</Btn>
      </div>
    </div>
  );
}

/* ---------- sheets ---------- */
function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }}>
      <div style={{ background: '#fff', width: '100%', borderRadius: '24px 24px 0 0', padding: '20px 16px 28px', maxHeight: '85%', overflowY: 'auto' }}>
        <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 14px' }} />
        {children}
      </div>
    </div>
  );
}

/* ---------- halaman utama ---------- */
export default function SketsaPage() {
  const [screen, setScreen] = useState<Screen>('latihan');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [mode, setMode] = useState<'latihan' | 'simulasi'>('latihan');

  const go = (s: Screen) => { setScreen(s); setSheet(null); };
  const isFocus = screen === 'soal' || screen === 'hasil';

  return (
    <main style={{ minHeight: '100dvh', background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 12px', fontFamily: 'inherit' }}>
      <h1 style={{ color: '#fff', fontSize: 18, marginBottom: 4 }}>Sketsa Struktur App — v0.1</h1>
      <p style={{ color: '#999', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>Sketsa visual saja (data dummy) — belum fungsional penuh</p>

      <div style={{ width: '100%', maxWidth: 390, height: 760, background: '#FAFAF7', borderRadius: 36, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '10px solid #000', boxShadow: '0 20px 60px rgba(0,0,0,.5)', position: 'relative', color: '#111' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column' }}>
          {screen === 'latihan' && <Latihan go={go} openSheet={setSheet} />}
          {screen === 'progres' && <Progres go={go} />}
          {screen === 'ruangai' && <RuangAI go={go} />}
          {screen === 'akun' && <Akun />}
          {screen === 'soal' && <Soal go={go} openSheet={setSheet} />}
          {screen === 'hasil' && <Hasil go={go} />}
        </div>

        {!isFocus && screen !== 'ruangai' && (
          <div style={{ display: 'flex', borderTop: '1px solid #eee', background: '#fff' }}>
            {([['latihan', '📝', 'Latihan'], ['progres', '📊', 'Progres'], ['akun', '👤', 'Akun']] as [Screen, string, string][]).map(([s, ico, label]) => (
              <button key={s} onClick={() => go(s)} style={{ flex: 1, padding: '10px 4px 14px', textAlign: 'center', fontSize: 10, color: screen === s ? '#111' : '#999', fontWeight: screen === s ? 700 : 400, cursor: 'pointer', border: 'none', background: 'none' }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 2 }}>{ico}</span>{label}
              </button>
            ))}
          </div>
        )}

        {/* Sheet: pilih mode */}
        <Sheet open={sheet === 'mode'} onClose={() => setSheet(null)}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Matematika · Paket 1</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>25 soal · 75 menit · Resmi Pusmendik</div>
          {([['latihan', '🌱 Mode Latihan', '(santai)', 'Cek jawaban langsung tiap soal + baca pembahasan saat itu juga.'], ['simulasi', '⚡ Mode Simulasi', '(hari-H)', 'Timer ketat, kunci jawaban & autopsi dibuka setelah selesai.']] as const).map(([m, t, sub, d]) => (
            <div key={m} onClick={() => setMode(m)} style={{ border: '2px solid #111', borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer', background: mode === m ? '#f6ffdc' : '#fff', boxShadow: mode === m ? '0 3px 0 #111' : 'none' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{t} <span style={{ fontWeight: 400, fontSize: 12, color: '#666' }}>{sub}</span></div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{d}</div>
            </div>
          ))}
          <Btn onClick={() => { setSheet(null); go('soal'); }}>Mulai Sekarang →</Btn>
          <Btn ghost onClick={() => setSheet(null)}>Batal</Btn>
        </Sheet>

        {/* Sheet: AI Tutor */}
        <Sheet open={sheet === 'ai'} onClose={() => setSheet(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ fontWeight: 800 }}>✨ AI Tutor</div>
            <span style={{ flex: 1 }} />
            <Badge lime>4/5 hari ini</Badge>
          </div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 10 }}>📍 Membahas Soal 12 · Matematika</div>
          {AI_TUTOR_TIRUAN.map((m, i) => (
            <div key={i} style={{ background: m.dari === 'ai' ? '#111' : '#B6FF00', color: m.dari === 'ai' ? '#fff' : '#111', borderRadius: 12, padding: '10px 12px', fontSize: 13, marginBottom: 8, maxWidth: '85%', marginLeft: m.dari === 'user' ? 'auto' : 0 }}>{m.teks}</div>
          ))}
          <div>
            {['Kenapa jawabannya itu?', 'Ada cara cepatnya?', 'Jelasin konsepnya'].map((q) => (
              <span key={q} style={{ border: '1.5px solid #111', borderRadius: 16, padding: '8px 12px', fontSize: 12, fontWeight: 700, background: '#fff', margin: '0 6px 6px 0', display: 'inline-block' }}>{q}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input placeholder="Tanya apa aja..." style={{ flex: 1, border: '1.5px solid #111', borderRadius: 20, padding: '10px 14px', fontSize: 13 }} />
            <button style={{ background: '#111', color: '#fff', border: 'none', borderRadius: '50%', width: 42, height: 42, fontSize: 18, cursor: 'pointer' }}>➤</button>
          </div>
          <Btn ghost onClick={() => setSheet(null)}>Tutup</Btn>
        </Sheet>

        {/* Sheet: Peta soal */}
        <Sheet open={sheet === 'peta'} onClose={() => setSheet(null)}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>🗺️ Peta Soal</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#666', marginBottom: 10 }}>
            <span>🟢 Dijawab</span><span>🟡 Ragu</span><span>⚪ Kosong</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 14 }}>
            {Array.from({ length: 25 }, (_, i) => {
              const n = i + 1;
              const answered = n <= 12;
              const ragu = n === 14 || n === 18;
              return (
                <div key={n} onClick={() => setSheet(null)} style={{ aspectRatio: '1', border: '1.5px solid #111', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, cursor: 'pointer', background: answered ? '#16a34a' : ragu ? '#eab308' : '#fff', color: answered ? '#fff' : '#111' }}>
                  {n}
                </div>
              );
            })}
          </div>
          <Btn onClick={() => { setSheet(null); go('hasil'); }}>Selesai & Kumpulkan ✓</Btn>
          <Btn ghost onClick={() => setSheet(null)}>Tutup</Btn>
        </Sheet>
      </div>

      <p style={{ color: '#666', fontSize: 11, marginTop: 12 }}>Route: /sketsa · Branch: desain-v0 · Sketsa — bukan implementasi final</p>
    </main>
  );
}
