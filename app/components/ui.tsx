'use client';

import { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

/* ================= Behavior log (shared) ================= */

export interface LogEntry {
  id: number;
  event: string;
  ts: string;
  payload: Record<string, unknown>;
}

let logId = 1;

/** External log store: logEvent TIDAK memicu re-render komponen pemanggil.
 * Hanya komponen yang subscribe (badge count / panel) yang re-render.
 * Ini mencegah seluruh halaman quiz re-render setiap ada event log. */
export interface LogStore {
  logEvent: (event: string, payload?: Record<string, unknown>) => void;
  useLogCount: () => number;
  useLogs: () => LogEntry[];
}

export function createLogStore(prefix: string, max = 200): LogStore {
  let logs: LogEntry[] = [];
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const logEvent = (event: string, payload: Record<string, unknown> = {}) => {
    const entry: LogEntry = {
      id: logId++,
      event,
      ts: new Date().toLocaleTimeString('id-ID'),
      payload,
    };
    logs = [entry, ...logs].slice(0, max);
    console.log(`[${prefix}]`, event, payload);
    emit();
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };

  // Snapshot harus immutable agar useSyncExternalStore tidak loop
  const getCount = () => logs.length;
  const getLogs = () => logs;

  const useLogCount = () => useSyncExternalStore(subscribe, getCount, getCount);
  const useLogs = () => useSyncExternalStore(subscribe, getLogs, getLogs);

  return { logEvent, useLogCount, useLogs };
}

/** Hook behavior log: console + counter + panel. prefix = label halaman utk console.
 * logEvent tidak me-re-render pemanggil; badge pakai useLogCount(), panel pakai useLogs(). */
export function useBehaviorLog(prefix: string) {
  const storeRef = useRef<LogStore | null>(null);
  if (!storeRef.current) storeRef.current = createLogStore(prefix);
  const [showLogPanel, setShowLogPanel] = useState(false);

  return {
    logEvent: storeRef.current.logEvent,
    useLogCount: storeRef.current.useLogCount,
    useLogs: storeRef.current.useLogs,
    // Kompat: logs kosong saat panel tutup (hindari re-render); panel baca via useLogs()
    logs: [] as LogEntry[],
    showLogPanel,
    setShowLogPanel,
  };
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
      className={`border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-[transform,box-shadow,background-color,color,border-color] duration-75 font-extrabold disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
});

import katex from "katex";

/** Normalisasi LaTeX dari data: backslash ganda jadi tunggal, "frac {a} {b}" jadi "\frac{a}{b}" */
/** Escape karakter HTML (& < >) untuk output string aman. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizeLatex(src: string): string {
  return src
    .replace(//g, "\f") // form feed (korupsi \f dari \frac) → \f
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

/** Render teks polos dengan markdown bold: **teks** (atau ***teks***) → <strong>.
 *  Hanya dipakai di segmen non-math, jadi rumus KaTeX tidak tersentuh. */
function renderInlineBold(plain: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*{2,3}([^*]+?)\*{2,3}/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plain)) !== null) {
    if (m.index > last) parts.push(<span key={`${keyBase}-t${k++}`}>{plain.slice(last, m.index)}</span>);
    parts.push(<strong key={`${keyBase}-b${k++}`} className="font-extrabold">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < plain.length) parts.push(<span key={`${keyBase}-t${k++}`}>{plain.slice(last)}</span>);
  if (parts.length === 0) return [plain];
  return parts;
}

/** Render teks campuran: $$...$$ (display), $...$ (inline), sisanya teks biasa */
export const Latex = memo(function Latex({ text }: { text: string }) {
  if (!text) return <></>;
  // Auto-wrap bare LaTeX DULU (termasuk fix form feed), baru cek $
  const wrapped = autoWrapBareLatex(text);
  if (!wrapped.includes("$")) return <>{renderInlineBold(wrapped, "nb")}</>;

  const parts: React.ReactNode[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(wrapped)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderInlineBold(wrapped.slice(lastIndex, match.index), `p${key++}`));
    }
    const displayMode = match[1] !== undefined;
    parts.push(
      <KatexChunk key={key++} code={displayMode ? match[1] : match[2]} displayMode={displayMode} />
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < wrapped.length) {
    parts.push(...renderInlineBold(wrapped.slice(lastIndex), `p${key++}`));
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
  // Konversi \(...\) menjadi $...$ dulu (format AI yang umum)
  let t = text.replace(/\\\(([\s\S]+?)\\\)/g, '$$$1$$');
  t = t.replace(/\x0c/g, "\\f"); // form feed (korupsi \f dari \frac) → \f, SEBELUM deteksi LaTeX
  const parts = t.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);
  return parts.map((seg, idx) => (idx % 2 === 1 ? seg : wrapBareCommands(seg))).join('');
}

/** Format notasi list ala Python: ['A:Benar', 'B:Salah'] → "A: Benar, B: Salah".
 *  Juga handle kutip ganda: ["A:Benar", "B:Salah"]. Kurung siku tanpa kutip
 *  (mis. [lihat gambar]) tidak disentuh. */
export function formatListNotation(text: string): string {
  if (!text || !text.includes('[')) return text;
  return text.replace(/\[((?:\s*['"][^'"]*['"]\s*,?)+)\]/g, (m, inner: string) => {
    const items: string[] = [];
    const re = /['"]([^'"]*)['"]/g;
    let im: RegExpExecArray | null;
    while ((im = re.exec(inner)) !== null) {
      const item = im[1].trim();
      if (!item) continue;
      const colon = item.indexOf(':');
      if (colon > 0) items.push(`${item.slice(0, colon).trim()}: ${item.slice(colon + 1).trim()}`);
      else items.push(item);
    }
    if (items.length === 0) return m;
    return items.join(', ');
  });
}

/** Sembunyikan segmen math $...$ / $$...$$ agar regex pemisah tidak memotong rumus. */
function maskMath(s: string): { text: string; segs: string[] } {
  const segs: string[] = [];
  const text = s.replace(/\$\$[\s\S]+?\$\$|\$[^$]+?\$/g, (m) => {
    segs.push(m);
    return '\u0000' + (segs.length - 1) + '\u0000';
  });
  return { text, segs };
}
function unmaskMath(s: string, segs: string[]): string {
  return s.replace(/\u0000(\d+)\u0000/g, (_: string, n: string) => segs[Number(n)] ?? '');
}

/** Pecah paragraf menjadi kalimat-kalimat (satu kalimat = satu paragraf baru).
 *  Split pada ". " (titik + spasi) dengan guard:
 *  - angka desimal "200.000" / "3.14" tidak dipecah (titik tanpa spasi sesudahnya)
 *  - singkatan umum "dkk.", "dll.", "dst.", "s.d." tidak dipecah
 *  Segmen math $...$ di-mask dulu agar titik di rumus aman. */
function splitSentences(text: string): string[] {
  if (!text) return [];
  const { text: masked, segs } = maskMath(text);
  const abbrevRe = /^(dkk|dll|dst|dsb|sd|s\.d\.?|an|a\.n\.?|no|tgl|thn|bln)$/i;
  const re = /\.\s+/g;
  const parts: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(masked)) !== null) {
    const before = masked.slice(0, m.index);
    const wordBefore = before.match(/([A-Za-z.]+)$/)?.[1] ?? '';
    if (abbrevRe.test(wordBefore.replace(/\.$/, ''))) continue;
    parts.push(masked.slice(last, m.index + 1));
    last = m.index + m[0].length;
  }
  parts.push(masked.slice(last));
  return parts.map((p) => unmaskMath(p, segs).trim()).filter(Boolean);
}

/** Pecah daftar sub-bullet bertanda "-" (di luar rumus) menjadi array; [] bila tak ada. */
function splitDashList(rest: string, segs: string[]): string[] {
  const parts = rest
    .split(/-\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return [];
  return parts.map((p) => unmaskMath(p, segs));
}

/** Deteksi sub-bullet di dalam satu item bullet.
 *  - "Header:- Sub1- Sub2" → { header: "Header:", subs: [...] }
 *  - "Teks (A) ... (B) ..." (label berurutan, bukan notasi P(A)) → { header, subs }
 *  Return null bila tidak ada pola sub-bullet. */
function splitNestedSubs(item: string): { header: string; subs: string[] } | null {
  const { text: masked, segs } = maskMath(item);

  // 1) Header diakhiri ":-" (titik dua menempel dash)
  const m = masked.match(/^([\s\S]*?):\s*-\s*([\s\S]+)$/);
  if (m) {
    const header = m[1].trim();
    const subs = splitDashList(m[2], segs);
    if (header && subs.length >= 2) return { header: unmaskMath(header, segs) + ':', subs };
  }

  // 2) Label (A)/(B)/... berurutan dalam satu item
  const labels = masked.match(/(?:^|\s)\(([A-E])\)/g);
  if (labels && labels.length >= 2) {
    const parts = masked
      .split(/(?=(?:^|\s)\((?:[A-E])\))/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 3) {
      const header = unmaskMath(parts[0], segs);
      const subs = parts.slice(1).map((p) => unmaskMath(p, segs));
      return { header, subs };
    }
  }
  return null;
}

/** Teks pilar pembahasan yang rapi:
 *  - "•" → bullet list (per item / per baris)
 *  - "1." / "2." di awal baris → numbered list
 *  - "- " di awal baris → bullet list
 *  - baris baru → paragraf terpisah
 *  - tiap kalimat (diakhiri titik) dalam paragraf → paragraf baru sendiri
 *  - sub-bullet "Header:- Sub1- Sub2" / label (A)/(B) → nested list
 *  Setiap item di-render via <Latex> agar rumus ke-render KaTeX.
 */
export const PilarText = memo(function PilarText({ text, className = "text-sm font-medium leading-relaxed" }: { text: string; className?: string }) {
  const t = formatListNotation((text ?? '').trim());
  if (!t) return <></>;

  const numberedRe = /^\d+[.)]\s+/;
  const dashRe = /^[-*–—]\s+/;

  type SubItem = { text: string; subs?: string[] };
  type Chunk = { list: 'ul' | 'ol' | null } & SubItem;
  const chunks: Chunk[] = [];
  // Paragraf polos → pecah per kalimat agar tiap kalimat jadi paragraf baru
  const pushParagraph = (paraText: string) => {
    for (const s of splitSentences(paraText)) chunks.push({ list: null, text: s });
  };
  for (const line of t.split('\n').map((l) => l.trim()).filter(Boolean)) {
    if (line.includes('•')) {
      const parts = line.split('•').map((s) => s.trim()).filter(Boolean);
      const startsWithBullet = line.trimStart().startsWith('•');
      parts.forEach((s, idx) => {
        // Teks sebelum • pertama = paragraf pembuka, bukan bullet
        if (idx === 0 && !startsWithBullet) {
          pushParagraph(s);
        } else {
          const nested = splitNestedSubs(s);
          chunks.push(nested ? { list: 'ul', text: nested.header, subs: nested.subs } : { list: 'ul', text: s });
        }
      });
    } else if (numberedRe.test(line)) {
      chunks.push({ list: 'ol', text: line.replace(numberedRe, '') });
    } else if (dashRe.test(line)) {
      const body = line.replace(dashRe, '');
      const nested = splitNestedSubs(body);
      chunks.push(nested ? { list: 'ul', text: nested.header, subs: nested.subs } : { list: 'ul', text: body });
    } else {
      pushParagraph(line);
    }
  }

  // Gabungkan chunk list sejenis yang berurutan
  const groups: { list: 'ul' | 'ol' | null; items: SubItem[] }[] = [];
  for (const c of chunks) {
    const last = groups[groups.length - 1];
    if (c.list && last && last.list === c.list) last.items.push({ text: c.text, subs: c.subs });
    else groups.push({ list: c.list, items: [{ text: c.text, subs: c.subs }] });
  }

  // Satu paragraf polos → render sederhana
  if (groups.length === 1 && groups[0].list === null) {
    return <p className={className}><Latex text={groups[0].items[0].text} /></p>;
  }

  return (
    <div className="space-y-1.5">
      {groups.map((g, i) =>
        g.list === null ? (
          <p key={i} className={className}><Latex text={g.items[0].text} /></p>
        ) : g.list === 'ol' ? (
          <ol key={i} className={`${className} list-decimal pl-5 space-y-1`}>
            {g.items.map((item, j) => (
              <li key={j}><Latex text={item.text} /></li>
            ))}
          </ol>
        ) : (
          <ul key={i} className={`${className} space-y-1`}>
            {g.items.map((item, j) => (
              <li key={j} className="relative pl-4">
                <span className="absolute left-0.5 top-0 font-extrabold text-[#4F46E5]">•</span>
                <Latex text={item.text} />
                {item.subs && item.subs.length > 0 && (
                  <ul className="mt-1 space-y-1">
                    {item.subs.map((s, k) => (
                      <li key={k} className="relative pl-4">
                        <span className="absolute left-0.5 top-0 font-extrabold text-neutral-500">–</span>
                        <Latex text={s} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
});

/** Bersihkan output mentah AI sebelum di-render:
 *  <br/> → newline, <b>teks</b> → **teks** (jadi bold), tag lain di-strip,
 *  entities (&amp; &lt; &gt; &quot;) di-decode. Segmen math $...$ di-mask dulu. */
/** Perbaiki LaTeX rusak akibat unicode-escape decoding saat scraping.
 *  \r→CR merusak \right/\rightarrow, \t→TAB merusak \text/\times/\theta, \f→FF merusak \frac.
 *  Dipanggil paling awal di preprocessAiHtml sebelum maskMath. */
function repairBrokenLatex(text: string): string {
  if (!text) return text;
  let t = text;
  // \r (CR) + "ightarrow" → \rightarrow  (28 kasus)
  t = t.replace(/\rightarrow/g, '\\rightarrow');
  // \t (TAB) + "ext{" → \text{  (9 kasus)
  t = t.replace(/\text\{/g, '\\text{');
  // \t (TAB) + "imes" → \times  (1 kasus; TAB memastikan bukan kata "times")
  t = t.replace(/\times/g, '\\times');
  // \f (FF) + "rac{" → \frac{  (1 kasus)
  t = t.replace(/\frac\{/g, '\\frac{');
  // \t (TAB) + "heta" → \theta  (1 kasus)
  t = t.replace(/\theta/g, '\\theta');
  // "ight)" tanpa huruf sebelumnya → \right)  (2 kasus; hindari "light)"/"right)"/"night)")
  t = t.replace(/([^a-zA-Z])ight\)/g, '$1\\right)');
  t = t.replace(/^ight\)/g, '\\right)');
  return t;
}

function preprocessAiHtml(text: string): string {
  if (!text) return text;
  const { text: masked, segs } = maskMath(repairBrokenLatex(text));
  let t = masked;
  // Decode entities paling atas agar &lt;b&gt; diubah jadi <b> sebelum diganti jadi **teks**
  t = t
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
  t = t.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
  t = t.replace(/<\/?[a-zA-Z][^>]*>/g, '');
  return unmaskMath(t, segs);
}

const latexHtmlCache = new Map<string, string>();
const MAX_LATEX_CACHE = 400;

/** Render teks dengan LaTeX menjadi HTML string (untuk dangerouslySetInnerHTML), dengan LRU cache untuk performa 60fps */
export function renderLatexToHtml(text: string): string {
  if (!text) return text;
  const cached = latexHtmlCache.get(text);
  if (cached !== undefined) return cached;

  const clean = preprocessAiHtml(text);
  const src = autoWrapBareLatex(formatListNotation(clean));
  let result: string;
  if (!src.includes("$")) {
    result = richEsc(src);
  } else {
    const regex = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let out = "";
    while ((match = regex.exec(src)) !== null) {
      if (match.index > lastIndex) out += richEsc(src.slice(lastIndex, match.index));
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
        out += `<span class="italic bg-[#F0FFB8] px-1 rounded font-serif">${escapeHtml(code)}</span>`;
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < src.length) out += richEsc(src.slice(lastIndex));
    result = out;
  }

  if (latexHtmlCache.size >= MAX_LATEX_CACHE) {
    const firstKey = latexHtmlCache.keys().next().value;
    if (firstKey !== undefined) latexHtmlCache.delete(firstKey);
  }
  latexHtmlCache.set(text, result);
  return result;
}

/** Escape HTML lalu konversi **bold** / ***bold*** di segmen teks biasa menjadi <strong>.
 *  Markdown list (* item / 1. item) → <ul>/<ol>. *italic* → <em>. Newline \n → <br/>. */
function richEsc(s: string): string {
  const esc = escapeHtml(s);
  // Bold: **teks** atau ***teks*** → <strong>
  let withBold = esc.replace(/\*{2,3}([^*]+?)\*{2,3}/g, '<strong class="font-extrabold">$1</strong>');
  // Bersihkan sisa ** yang jompo (tidak berpasangan) → hapus saja
  withBold = withBold.replace(/\*{2,3}/g, '');
  // Italic: *teks* (single, bukan list) → <em>
  const withItalic = withBold.replace(/(^|[\s(])\*([^*\n]+?)\*(?=[\s).,;:!?]|$)/g, '$1<em class="italic">$2</em>');
  // List: baris diawali "* " atau "1. " → <ul>/<ol> dengan <li>
  const lines = withItalic.split('\n');
  const out: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  const closeList = () => {
    if (inList) {
      out.push(inList === 'ul' ? '</ul>' : '</ol>');
      inList = null;
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const ulMatch = /^\*\s+(.+)$/.exec(trimmed);
    const olMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed);
    if (ulMatch) {
      if (inList !== 'ul') {
        closeList();
        out.push('<ul class="list-disc pl-5 my-1 space-y-0.5">');
        inList = 'ul';
      }
      out.push(`<li>${ulMatch[1]}</li>`);
    } else if (olMatch) {
      if (inList !== 'ol') {
        closeList();
        out.push('<ol class="list-decimal pl-5 my-1 space-y-0.5">');
        inList = 'ol';
      }
      out.push(`<li>${olMatch[2]}</li>`);
    } else {
      closeList();
      // Sisa single "*" yang bukan list (misal "*note") → tampil apa adanya
      // Baris biasa: \n → <br/> (kecuali baris kosong)
      const cleaned = line.replace(/^\*\s*/, '• ');
      out.push(cleaned === '' ? '' : cleaned + '<br/>');
    }
  }
  closeList();
  // Hapus <br/> terakhir yang berlebih di akhir
  let result = out.join('\n');
  result = result.replace(/(<br\/>)+$/, '');
  return result.replace(/\n/g, '');
}

/** Badge counter yang subscribe ke log count saja (isolasi re-render).
 * Pakai ini agar halaman utama TIDAK re-render setiap ada event log. */
export const LogCounterLive = memo(function LogCounterLive({
  useLogCount,
  onClick,
}: {
  useLogCount: () => number;
  onClick: () => void;
}) {
  const count = useLogCount();
  return <LogCounter count={count} onClick={onClick} />;
});

/** Panel log yang subscribe ke logs hanya saat terbuka (isolasi re-render). */
export const LogPanelLive = memo(function LogPanelLive({
  useLogs,
  onClose,
  badge,
  title,
  zIndex,
  description,
}: {
  useLogs: () => LogEntry[];
  onClose: () => void;
  badge: string;
  title: string;
  zIndex?: string;
  description?: string;
}) {
  const logs = useLogs();
  return <LogPanel logs={logs} onClose={onClose} badge={badge ?? ''} title={title ?? ''} zIndex={zIndex} description={description} />;
});

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
  disabled,
}: {
  placeholder: string;
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled || !value.trim()) return;
        onSend(value);
        setValue('');
      }}
      className="p-3 bg-white border-t-2 border-[#111] flex gap-2 shrink-0"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        type="text"
        placeholder={placeholder}
        className="flex-1 border-2 border-[#111] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none min-w-0 disabled:bg-neutral-100 disabled:cursor-not-allowed"
      />
      <NeoBtn type="submit" disabled={disabled} className="bg-[#B6FF00] px-4 py-2 rounded-xl text-xs">
        Kirim
      </NeoBtn>
    </form>
  );
});
