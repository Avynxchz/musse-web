/**
 * Klien DOKU Checkout (Non-SNAP) — SERVER-SIDE SAJA.
 * Jangan import file ini dari komponen klien: ia membaca Secret Key dari env.
 *
 * Kontrak (developers.doku.com): Backend Integration Checkout + Signature
 * Component Non-SNAP. Sandbox: api-sandbox.doku.com, produksi: api.doku.com.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

const SANDBOX_BASE = 'https://api-sandbox.doku.com';
const PROD_BASE = 'https://api.doku.com';
export const CHECKOUT_PATH = '/checkout/v1/payment';

export interface DokuConfig {
  clientId: string;
  secretKey: string;
  isProduction: boolean;
}

export function getDokuConfig(): DokuConfig | null {
  const clientId = (process.env.DOKU_CLIENT_ID || '').trim();
  const secretKey = (process.env.DOKU_SECRET_KEY || '').trim();
  if (!clientId || !secretKey) return null;
  return { clientId, secretKey, isProduction: process.env.DOKU_IS_PRODUCTION === '1' };
}

// Timestamp UTC format ISO8601 Z, mis. 2020-08-11T08:45:42Z.
// DOKU minta UTC+0; WIB = UTC+7, jadi timestamp UTC = waktu WIB dikurangi 7 jam
// (toISOString sudah UTC).
export function utcTimestamp(now = new Date()): string {
  return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

// Digest: base64(SHA-256(body persis seperti dikirim/diterima)).
export function computeDigest(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('base64');
}

// Signature Non-SNAP: HMACSHA256=base64(HMAC-SHA256(secret, stringToSign)).
// stringToSign: 5 baris "Kunci:nilai" dipisah \n, tanpa \n di akhir.
export function computeSignature(
  secretKey: string,
  parts: {
    clientId: string;
    requestId: string;
    timestamp: string;
    target: string;
    digest: string;
  }
): string {
  const stringToSign = [
    `Client-Id:${parts.clientId}`,
    `Request-Id:${parts.requestId}`,
    `Request-Timestamp:${parts.timestamp}`,
    `Request-Target:${parts.target}`,
    `Digest:${parts.digest}`,
  ].join('\n');
  const hmac = createHmac('sha256', secretKey).update(stringToSign, 'utf8').digest('base64');
  return `HMACSHA256=${hmac}`;
}

// Perbandingan signature anti-timing-attack; false kalau format/panjang beda.
export function signaturesEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export interface CheckoutRequest {
  invoiceNumber: string;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
  callbackBaseUrl: string; // origin app, mis. https://xxx.vercel.app
  notificationUrl: string; // override per-order, mis. {origin}/api/payment/webhook
}

export interface CheckoutResult {
  paymentUrl: string;
  expiredDate?: string;
}

export async function createCheckoutPayment(
  cfg: DokuConfig,
  req: CheckoutRequest
): Promise<CheckoutResult> {
  const bodyObj = {
    order: {
      amount: req.amount,
      invoice_number: req.invoiceNumber,
      currency: 'IDR',
      callback_url: `${req.callbackBaseUrl}/beli`,
      callback_url_result: `${req.callbackBaseUrl}/beli`,
      language: 'ID',
      auto_redirect: true,
      line_items: [
        { id: 'MUSSE-FULL', name: 'Full Akses MUSSE', quantity: 1, price: req.amount },
      ],
    },
    payment: {
      payment_due_date: 60,
      payment_method_types: ['QRIS', 'EMONEY_DANA'],
    },
    customer: {
      ...(req.customerId ? { id: req.customerId } : {}),
      ...(req.customerName ? { name: req.customerName } : {}),
      ...(req.customerEmail ? { email: req.customerEmail } : {}),
    },
    additional_info: {
      override_notification_url: req.notificationUrl,
    },
  };
  const body = JSON.stringify(bodyObj);
  const requestId = crypto.randomUUID();
  const timestamp = utcTimestamp();
  const digest = computeDigest(body);
  const signature = computeSignature(cfg.secretKey, {
    clientId: cfg.clientId,
    requestId,
    timestamp,
    target: CHECKOUT_PATH,
    digest,
  });

  const base = cfg.isProduction ? PROD_BASE : SANDBOX_BASE;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${base}${CHECKOUT_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': cfg.clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        Signature: signature,
      },
      body,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      // Pesan DOKU tidak diteruskan mentah ke klien (bisa memuat detail internal).
      console.error('[doku] create payment failed', res.status);
      throw new Error('DOKU_REJECTED');
    }
    const paymentUrl = data?.response?.payment?.url;
    if (typeof paymentUrl !== 'string' || !paymentUrl) {
      console.error('[doku] create payment: payment.url missing');
      throw new Error('DOKU_BAD_RESPONSE');
    }
    return { paymentUrl, expiredDate: data.response.payment.expired_date };
  } finally {
    clearTimeout(timeout);
  }
}

// Verifikasi signature notifikasi Non-SNAP dari DOKU.
// targetPath = path URL notifikasi merchant, mis. /api/payment/webhook.
// rawBody = body mentah persis seperti diterima (jangan re-serialize JSON,
// karena Digest dihitung dari byte asli yang dikirim DOKU).
export function verifyNotificationSignature(
  secretKey: string,
  headers: { clientId: string; requestId: string; timestamp: string; signature: string },
  targetPath: string,
  rawBody: string
): boolean {
  if (!headers.clientId || !headers.requestId || !headers.timestamp || !headers.signature) {
    return false;
  }
  const digest = computeDigest(rawBody);
  const expected = computeSignature(secretKey, {
    clientId: headers.clientId,
    requestId: headers.requestId,
    timestamp: headers.timestamp,
    target: targetPath,
    digest,
  });
  return signaturesEqual(headers.signature, expected);
}
