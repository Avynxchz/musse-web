import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { PASS_PRICE_IDR, SUPABASE_URL } from '@/lib/payment';
import { verifyNotificationSignature } from '@/lib/doku';

/**
 * API Route: POST /api/payment/webhook
 * Dipanggil DOKU (bukan user) — tanpa sesi login. Satu-satunya bukti sah:
 * signature Non-SNAP atas body mentah. Tanpa signature valid, tidak ada
 * perubahan status apa pun.
 *
 * Alur: verifikasi signature -> cari order by invoice_number -> cek nominal
 * (harus Rp5.000 persis) -> SUCCESS: pending jadi paid (idempoten: update
 * bersyarat status='pending', jadi notifikasi ganda aman) -> FAILED/EXPIRED:
 * pending jadi failed/expired. Status lain: dicatat, tanpa perubahan.
 * Webhook menulis via service role (melewati RLS) — env SUPABASE_SERVICE_ROLE_KEY
 * hanya ada di server, tidak pernah ke klien.
 */

const WEBHOOK_PATH = '/api/payment/webhook';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ status: 'error', message: 'Body kosong.' }, { status: 400 });
    }

    const secretKey = (process.env.DOKU_SECRET_KEY || '').trim();
    if (!secretKey) {
      console.error('[payment/webhook] DOKU_SECRET_KEY missing');
      return NextResponse.json(
        { status: 'error', message: 'Konfigurasi webhook belum lengkap.' },
        { status: 503 }
      );
    }

    const verified = verifyNotificationSignature(
      secretKey,
      {
        clientId: req.headers.get('client-id') || '',
        requestId: req.headers.get('request-id') || '',
        timestamp: req.headers.get('request-timestamp') || '',
        signature: req.headers.get('signature') || '',
      },
      WEBHOOK_PATH,
      rawBody
    );
    if (!verified) {
      console.error(
        '[payment/webhook] bad signature, request-id:',
        req.headers.get('request-id') || '(none)'
      );
      return NextResponse.json(
        { status: 'error', message: 'Signature tidak valid.' },
        { status: 401 }
      );
    }

    let payload: {
      order?: { invoice_number?: string; amount?: number | string };
      transaction?: { status?: string };
    };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Payload JSON tidak valid.' },
        { status: 400 }
      );
    }

    const invoice = payload.order?.invoice_number;
    if (typeof invoice !== 'string' || !invoice) {
      return NextResponse.json(
        { status: 'error', message: 'invoice_number tidak ada.' },
        { status: 400 }
      );
    }

    const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!serviceRoleKey) {
      console.error('[payment/webhook] SUPABASE_SERVICE_ROLE_KEY missing');
      return NextResponse.json(
        { status: 'error', message: 'Konfigurasi database belum lengkap.' },
        { status: 503 }
      );
    }
    const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error: findError } = await supabase
      .from('payments')
      .select('order_id, status, amount')
      .eq('order_id', invoice)
      .maybeSingle();
    if (findError) {
      console.error('[payment/webhook] lookup failed', findError.code);
      return NextResponse.json(
        { status: 'error', message: 'Gagal memeriksa order.' },
        { status: 502 }
      );
    }
    if (!row) {
      // Invoice tak dikenal: kembalikan 404 supaya DOKU me-retry; kalau order
      // memang tidak pernah dibuat, retry itu hanya noise di log.
      console.error('[payment/webhook] unknown invoice:', invoice);
      return NextResponse.json(
        { status: 'error', message: 'Order tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Nominal harus persis Rp5.000 — notifikasi dengan nominal lain tidak
    // boleh mengaktifkan pass, apa pun statusnya.
    if (Number(payload.order?.amount) !== PASS_PRICE_IDR) {
      console.error('[payment/webhook] amount mismatch for', invoice);
      return NextResponse.json(
        { status: 'error', message: 'Nominal tidak cocok.' },
        { status: 400 }
      );
    }

    const txStatus = payload.transaction?.status;
    if (txStatus === 'SUCCESS') {
      if (row.status === 'paid') {
        return NextResponse.json({ status: 'ok', already: true });
      }
      if (row.status !== 'pending') {
        console.error('[payment/webhook] SUCCESS for non-pending order:', invoice, row.status);
        return NextResponse.json({ status: 'ok', ignored: true });
      }
      const { error: updError } = await supabase
        .from('payments')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('order_id', invoice)
        .eq('status', 'pending');
      if (updError) {
        console.error('[payment/webhook] mark paid failed', updError.code);
        return NextResponse.json(
          { status: 'error', message: 'Gagal memperbarui order.' },
          { status: 502 }
        );
      }
      return NextResponse.json({ status: 'ok', paid: true });
    }

    if (txStatus === 'FAILED' || txStatus === 'EXPIRED') {
      if (row.status === 'pending') {
        await supabase
          .from('payments')
          .update({ status: txStatus.toLowerCase() })
          .eq('order_id', invoice)
          .eq('status', 'pending');
      }
      return NextResponse.json({ status: 'ok', marked: txStatus.toLowerCase() });
    }

    console.error('[payment/webhook] unknown tx status:', txStatus, 'for', invoice);
    return NextResponse.json({ status: 'ok', ignored: true });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Gagal memproses notifikasi.' },
      { status: 500 }
    );
  }
}
