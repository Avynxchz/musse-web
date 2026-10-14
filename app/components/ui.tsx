'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ================= Behavior log (shared) ================= */

export interface LogEntry {
  id: number;
  event: string;
  ts: string;
  payload: Record<string, unknown>;
}

let logId = 1;

/** Hook behavior log: console + counter + panel. prefix = label halaman utk console. */
export function useBehaviorLog(prefix: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogPanel, setShowLogPanel] = useState(false);

  const logEvent = useCallback(
    (event: string, payload: Record<string, unknown> = {}) => {
      const entry: LogEntry = {
        id: logId++,
        event,
        ts: new Date().toLocaleTimeString('id-ID'),
        payload,
      };
      setLogs((prev) => [entry, ...prev].slice(0, 100));
      console.log(`[${prefix}]`, event, payload);
    },
    [prefix]
  );

  return { logs, logEvent, showLogPanel, setShowLogPanel };
}

/** Panel viewer behavior log (overlay). */
export function LogPanel({
  logs,
  onClose,
  badge,
  title,
  zIndex = 'z-50',
  description,
}: {
  logs: LogEntry[];
  onClose: () => void;
  badge: string;
  title: string;
  zIndex?: string;
  description?: string;
}) {
  return (
    <div className={`absolute inset-0 ${zIndex} bg-[#111]/95 text-white flex flex-col p-4`}>
      <div className="flex items-center justify-between border-b border-white/20 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase bg-[#B6FF00] text-[#111] px-2 py-0.5 rounded">
            {badge}
          </span>
          <h3 className="text-sm font-extrabold mt-1">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-bold"
        >
          Tutup ✕
        </button>
      </div>
      {description && <p className="text-[11px] text-white/70 mt-2">{description}</p>}
      <div className="flex-1 overflow-y-auto mt-3 space-y-2 font-mono text-[11px]">
        {logs.length === 0 && <p className="text-white/50">Belum ada event. Klik-klik dulu…</p>}
        {logs.map((l) => (
          <div key={l.id} className="bg-white/5 border border-white/15 rounded-lg p-2.5">
            <div className="flex justify-between text-[#B6FF00] font-bold">
              <span>[{l.event}]</span>
              <span className="text-white/50">{l.ts}</span>
            </div>
            <div className="text-white/80 mt-1 break-all">{JSON.stringify(l.payload)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Toast (shared) ================= */

/** Hook toast: state + auto-dismiss 2.4 dtk. */
export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup: cegah setState setelah unmount (memory leak)
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  return { toast, showToastMsg };
}

/** Bubble toast. className utk posisi/variasi per halaman (mis. "bottom-20", "bottom-24 shadow-lg"). */
export function Toast({ message, className = '' }: { message: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white border-2 border-[#B6FF00] px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap ${className}`}
    >
      {message}
    </div>
  );
}

/* ================= Neo-Brutalism UI (shared) ================= */

/** Tombol Neo-Brutalism standar. */
export function NeoBtn({
  children,
  onClick,
  className = '',
  disabled,
  title,
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all font-extrabold disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export type NavKey = 'latihan' | 'ruang' | 'akun';

/** Bottom navigation 3 tab (mobile). */
export function BottomNav({ active }: { active: NavKey }) {
  const router = useRouter();
  const items = [
    { key: 'latihan', icon: '📝', label: 'Latihan', href: '/beranda' },
    { key: 'ruang', icon: '🧠', label: 'Ruang & Progres', href: '/ruang' },
    { key: 'akun', icon: '👤', label: 'Akun', href: '/akun' },
  ] as const;
  return (
    <nav className="bg-white border-t-2 border-[#111] px-6 py-2 flex items-center justify-around shrink-0 sticky bottom-0 z-20">
      {items.map((it) => {
        const on = active === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => {
              if (!on) router.push(it.href);
            }}
            className={`flex flex-col items-center gap-0.5 ${on ? 'text-[#111] font-extrabold' : 'text-neutral-500 font-bold'}`}
          >
            <span
              className={
                on
                  ? 'bg-[#B6FF00] border-2 border-[#111] px-3 py-0.5 rounded-full text-xs'
                  : 'px-3 py-0.5 text-xs'
              }
            >
              {it.icon}
            </span>
            <span className="text-[11px]">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Tombol counter 📡 pembuka panel behavior log (header). */
export function LogCounter({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] font-extrabold bg-[#B6FF00] border-2 border-[#111] rounded-full px-2.5 py-1"
      title="Behavior log"
    >
      📡 {count}
    </button>
  );
}
