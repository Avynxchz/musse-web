import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/tutor
 * Langsung ke Groq API (tidak lagi via Railway).
 *
 * Request body: { subject, paket, nomor, message }
 * Response: { status: 'success', reply } | { status: 'rate_limited' } | { status: 'error' }
 *
 * Env yang dibutuhkan di Vercel:
 * - GROQ_API_KEY: API key Groq (https://console.groq.com)
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-120b';
const TIMEOUT_MS = 60000;

export async function POST(req: NextRequest) {
  try {
    let body: { subject?: string; paket?: number | string; nomor?: number | string; message?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Payload JSON tidak valid.' },
        { status: 400 }
      );
    }
    const { subject, paket, nomor, message } = body;

    if (!subject || !message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { status: 'error', message: 'Subject dan message wajib diisi.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { status: 'backend_unavailable', message: 'API key belum dikonfigurasi.' },
        { status: 503 }
      );
    }

    const systemPrompt = `Kamu adalah AI Tutor untuk aplikasi belajar TKA (Tes Kemampuan Akademik) Indonesia bernama MUSSE.

Konteks: user sedang mengerjakan soal ${subject} paket ${paket || 1} nomor ${nomor || 1}.

Tugasmu:
- Jawab pertanyaan user dengan jelas dan ringkas
- Gunakan Bahasa Indonesia yang santai tapi tetap edukatif
- Kalau menjelaskan konsep, kasih contoh konkret
- Format jawaban pakai markdown sederhana (bold, list)
- Jangan bertele-tele, langsung ke intinya

PENTING: Jangan tampilkan tag HTML mentah seperti <b> atau <i>. Gunakan **bold** untuk penekanan.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message.trim() },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        return NextResponse.json(
          { status: 'rate_limited', message: 'AI sedang sibuk, coba lagi sebentar.' },
          { status: 429 }
        );
      }

      if (!res.ok) {
        // Bedakan penyebab gagalnya (bukan 502 generik) supaya bisa didiagnosis:
        // 401 = key tidak valid, 400 = model tidak tersedia, sisanya = gangguan hulu.
        // Pesan ke klien dijaga generik (tidak meneruskan body mentah Groq).
        console.error('[tutor] Groq error', res.status);
        if (res.status === 401) {
          return NextResponse.json(
            { status: 'error', code: 'invalid_key', message: 'API key AI tidak valid.' },
            { status: 502 }
          );
        }
        if (res.status === 400) {
          return NextResponse.json(
            { status: 'error', code: 'model_unavailable', message: 'Model AI sedang tidak tersedia.' },
            { status: 502 }
          );
        }
        return NextResponse.json(
          { status: 'error', code: 'upstream_error', message: 'Gagal mendapatkan respons AI.' },
          { status: 502 }
        );
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';

      if (!reply) {
        return NextResponse.json(
          { status: 'error', code: 'empty_reply', message: 'Respons AI kosong.' },
          { status: 502 }
        );
      }

      return NextResponse.json({ status: 'success', reply });
    } catch (fetchErr) {
      const isTimeout = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      return NextResponse.json(
        {
          status: 'backend_unavailable',
          message: isTimeout ? 'AI sedang sibuk, coba lagi sebentar.' : 'Backend AI tidak dapat dihubungi.',
        },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Gagal memproses permintaan.' },
      { status: 500 }
    );
  }
}
