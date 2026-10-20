import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/tutor
 * Proxy ke Railway backend AI Tutor (tka-master.up.railway.app)
 *
 * Kenapa pakai proxy? Supaya API key & logika kuota tetap di server,
 * tidak terekspos ke browser user.
 *
 * Request body: { subject, paket, nomor, message }
 * Response: { status, reply, ... } dari Railway
 */

const RAILWAY_BASE = process.env.RAILWAY_BACKEND_URL || 'https://tka-master.up.railway.app';
const TIMEOUT_MS = 60000; // AI bisa butuh waktu lama

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

    // Validasi input
    if (!subject || !message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { status: 'error', message: 'Subject dan message wajib diisi.' },
        { status: 400 }
      );
    }

    // Forward ke Railway dengan timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${RAILWAY_BASE}/api/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          paket: Number(paket) || 1,
          nomor: Number(nomor) || 1,
          message: message.trim(),
        }),
        signal: controller.signal,
      });

      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = {
          status: 'backend_unavailable',
          message: 'Format balasan AI tidak valid.',
        };
      }

      // Teruskan status & body dari Railway apa adanya
      return NextResponse.json(data, { status: res.status });
    } catch (fetchErr) {
      // Railway down / timeout -> kasih tau frontend biar fallback ke template
      const isTimeout =
        fetchErr instanceof Error && fetchErr.name === 'AbortError';
      return NextResponse.json(
        {
          status: 'backend_unavailable',
          message: isTimeout
            ? 'AI sedang sibuk, coba lagi sebentar.'
            : 'Backend AI tidak dapat dihubungi.',
        },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: 'Gagal memproses permintaan.' },
      { status: 500 }
    );
  }
}
