'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
export const LogPanel = memo(function LogPanel({
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
});

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
export const Toast = memo(function Toast({ message, className = '' }: { message: string | null; className?: string }) {
  if (!message) return null;
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white border-2 border-[#B6FF00] px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap ${className}`}
    >
      {message}
    </div>
  );
});

/* ================= Neo-Brutalism UI (shared) ================= */

/** Tombol Neo-Brutalism standar. */
export const NeoBtn = memo(function NeoBtn({
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
});

import katex from "katex";

/** Normalisasi LaTeX dari data: backslash ganda jadi tunggal, "frac {a} {b}" jadi "\frac{a}{b}" */
function normalizeLatex(src: string): string {
  return src
    .replace(/\\/g, "\\") // \\cup → \cup (data double-escaped)
    .replace(/\\?(d|t)?frac\s*\{/g, "\\frac{") // frac/dfrac/tfrac (dgn/tanpa backslash & spasi) → \frac{
    .replace(/\}\s*\{/g, "}{"); // } { → }{
}

/** Satu potong rumus KaTeX; fallback ke teks biasa kalau gagal parse (tidak crash) */
function KatexChunk({ code, displayMode }: { code: string; displayMode: boolean }) {
  try {
    const html = katex.renderToString(normalizeLatex(code), {
      throwOnError: true,
      displayMode,
      strict: false,
      trust: false,
    });
    return (
      <span
        className={displayMode ? "katex-block my-1 block overflow-x-auto" : "katex-inline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return <span className="italic bg-[#F0FFB8] px-1 rounded font-serif">{code}</span>;
  }
}

/** Render teks campuran: $$...$$ (display), $...$ (inline), sisanya teks biasa */
export const Latex = memo(function Latex({ text }: { text: string }) {
  if (!text) return <></>;
  if (!text.includes("$")) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const displayMode = match[1] !== undefined;
    parts.push(
      <KatexChunk key={key++} code={displayMode ? match[1] : match[2]} displayMode={displayMode} />
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
});

/** Daftar perintah LaTeX matematika umum untuk deteksi otomatis.
 *  \left \right \begin \end sengaja TIDAK masuk (berpasangan, rentang tak tentu). */
const BARE_LATEX_CMDS =
  'frac|dfrac|tfrac|cfrac|sqrt|sum|prod|int|oint|lim|log|ln|exp|sin|cos|tan|arcsin|arccos|arctan|min|max|det' +
  '|times|cdot|div|pm|mp|leq|geq|neq|equiv|approx|cong|sim|propto|in|notin|ni|subset|supset|subseteq|supseteq|infty|partial' +
  '|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|sigma|tau|upsilon|phi|varphi|chi|psi|omega' +
  '|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|ell' +
  '|vec|bar|hat|tilde|dot|ddot|overline|underline|overbrace|underbrace' +
  '|binom|text|mathbf|mathit|mathrm|mathcal|mathbb|boldsymbol' +
  '|to|rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|Leftrightarrow|mapsto' +
  '|forall|exists|therefore|because|angle|ldots|cdots|vdots|ddots';

/** Baca blok {....} / [....] balanced dari posisi i. Return index setelah blok, atau -1 bila tak balanced. */
function readBalanced(s: string, i: number): number {
  const open = s[i];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === open) depth++;
    else if (s[j] === close) {
      depth--;
      if (depth === 0) return j + 1;
    }
  }
  return -1;
}

/** Bungkus perintah LaTeX telanjang dalam satu segmen teks (tanpa $) menjadi $...$. */
function wrapBareCommands(seg: string): string {
  // \b tidak bisa dipakai (mis. \sum_ : "_" adalah word char) → lookahead eksplisit
  const cmdRe = new RegExp('\\\\(?:' + BARE_LATEX_CMDS + ')(?=[\\s{\\[^_]|$)', 'g');
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = cmdRe.exec(seg)) !== null) {
    let i = m.index + m[0].length;
    // Konsumsi argumen yang menempel: {..} / [..] / ^x / _x / ^{..} / _{..}
    // (spasi hanya ikut bila diikuti argumen valid — jangan telan spasi pemisah kata)
    for (;;) {
      let j = i;
      while (j < seg.length && seg[j] === ' ') j++;
      if (j >= seg.length) break;
      const ch = seg[j];
      if (ch === '{' || ch === '[') {
        const ni = readBalanced(seg, j);
        if (ni < 0) break;
        i = ni;
      } else if (ch === '^' || ch === '_') {
        const k = j + 1;
        if (seg[k] === '{' || seg[k] === '[') {
          const ni = readBalanced(seg, k);
          if (ni < 0) break;
          i = ni;
        } else if (k < seg.length && /[0-9a-zA-Z]/.test(seg[k])) {
          i = k + 1;
        } else break;
      } else break;
    }
    out += seg.slice(last, m.index) + '$' + seg.slice(m.index, i) + '$';
    last = i;
    cmdRe.lastIndex = i;
  }
  return out + seg.slice(last);
}

/** AI sering menulis \frac{..} tanpa $...$ — deteksi & bungkus otomatis.
 *  Segmen $...$ / $$...$$ yang sudah ada tidak disentuh. */
export function autoWrapBareLatex(text: string): string {
  if (!text) return text;
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return parts.map((seg, idx) => (idx % 2 === 1 ? seg : wrapBareCommands(seg))).join('');
}

/** Teks pilar pembahasan yang rapi:
 *  - "•" → bullet list (per item / per baris)
 *  - "1." / "2." di awal baris → numbered list
 *  - "- " di awal baris → bullet list
 *  - baris baru → paragraf terpisah
 *  Setiap item di-render via <Latex> agar rumus ke-render KaTeX.
 */
export const PilarText = memo(function PilarText({ text, className = "text-sm font-medium leading-relaxed" }: { text: string; className?: string }) {
  const t = (text ?? '').trim();
  if (!t) return <></>;

  const numberedRe = /^\d+[.)]\s+/;
  const dashRe = /^[-*–—]\s+/;

  type Chunk = { list: 'ul' | 'ol' | null; text: string };
  const chunks: Chunk[] = [];
  for (const line of t.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (line.includes('•')) {
      for (const s of line.split('•').map((s) => s.trim()).filter(Boolean)) {
        chunks.push({ list: 'ul', text: s });
      }
    } else if (numberedRe.test(line)) {
      chunks.push({ list: 'ol', text: line.replace(numberedRe, '') });
    } else if (dashRe.test(line)) {
      chunks.push({ list: 'ul', text: line.replace(dashRe, '') });
    } else {
      chunks.push({ list: null, text: line });
    }
  }

  // Gabungkan chunk list sejenis yang berurutan
  const groups: { list: 'ul' | 'ol' | null; items: string[] }[] = [];
  for (const c of chunks) {
    const last = groups[groups.length - 1];
    if (c.list && last && last.list === c.list) last.items.push(c.text);
    else groups.push({ list: c.list, items: [c.text] });
  }

  // Satu paragraf polos → render sederhana
  if (groups.length === 1 && groups[0].list === null) {
    return <p className={className}><Latex text={groups[0].items[0]} /></p>;
  }

  return (
    <div className="space-y-1.5">
      {groups.map((g, i) =>
        g.list === null ? (
          <p key={i} className={className}><Latex text={g.items[0]} /></p>
        ) : g.list === 'ol' ? (
          <ol key={i} className={`${className} list-decimal pl-5 space-y-1`}>
            {g.items.map((item, j) => (
              <li key={j}><Latex text={item} /></li>
            ))}
          </ol>
        ) : (
          <ul key={i} className={`${className} space-y-1`}>
            {g.items.map((item, j) => (
              <li key={j} className="relative pl-4">
                <span className="absolute left-0.5 top-0 font-extrabold text-[#4F46E5]">•</span>
                <Latex text={item} />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
});

/** Render teks dengan LaTeX menjadi HTML string (untuk dangerouslySetInnerHTML) */
export function renderLatexToHtml(text: string): string {
  if (!text) return text;
  const src = autoWrapBareLatex(text);
  if (!src.includes("$")) return src;
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let out = "";
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  while ((match = regex.exec(src)) !== null) {
    if (match.index > lastIndex) out += esc(src.slice(lastIndex, match.index));
    const displayMode = match[1] !== undefined;
    const code = displayMode ? match[1] : match[2];
    try {
      const html = katex.renderToString(normalizeLatex(code), {
        throwOnError: true, displayMode, strict: false, trust: false,
      });
      out += displayMode
        ? `<span class="katex-block my-1 block overflow-x-auto">${html}</span>`
        : `<span class="katex-inline">${html}</span>`;
    } catch {
      out += `<span class="italic bg-[#F0FFB8] px-1 rounded font-serif">${esc(code)}</span>`;
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < src.length) out += esc(src.slice(lastIndex));
  return out;
}

export type NavKey = 'latihan' | 'ruang' | 'akun';

/** Bottom navigation 3 tab (mobile). */
export const BottomNav = memo(function BottomNav({ active }: { active: NavKey }) {
  const router = useRouter();
  const items = [
    { key: 'latihan', icon: '📝', label: 'Latihan', href: '/beranda' },
    { key: 'ruang', icon: '🧠', label: 'Ruang & Progres', href: '/ruang' },
    { key: 'akun', icon: '👤', label: 'Akun', href: '/akun' },
  ] as const;
  return (
    <nav className="bg-white border-t-2 border-[#111] px-6 py-2 flex items-center justify-around shrink-0 fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20">
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
});

/** Tombol counter 📡 pembuka panel behavior log (header). */
export const LogCounter = memo(function LogCounter({ count, onClick }: { count: number; onClick: () => void }) {
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
});

/* ================= Chat input (shared) ================= */

/**
 * Input chat terisolasi: ketikan user HANYA me-render komponen ini,
 * bukan seluruh halaman (hemat re-render di HP spek rendah).
 * Perilaku identik: submit kosong = no-op, setelah kirim input dikosongkan.
 */
export const ChatInput = memo(function ChatInput({
  placeholder,
  onSend,
}: {
  placeholder: string;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSend(value);
        setValue('');
      }}
      className="p-3 bg-white border-t-2 border-[#111] flex gap-2 shrink-0"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        type="text"
        placeholder={placeholder}
        className="flex-1 border-2 border-[#111] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none min-w-0"
      />
      <NeoBtn type="submit" className="bg-[#B6FF00] px-4 py-2 rounded-xl text-xs">
        Kirim
      </NeoBtn>
    </form>
  );
});
