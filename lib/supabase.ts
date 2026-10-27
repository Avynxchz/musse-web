import { createBrowserClient } from '@supabase/ssr';

// Konstanta Supabase terpusat di sini (satu-satunya tempat nilai ini ditulis).
// Dipakai juga oleh route callback auth & lib/soal. Nilai diambil dari env
// bila tersedia, fallback ke nilai saat ini supaya production tidak berubah.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://auhqgzrrgvjbfvzvayzg.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1aHFnenJyZ3ZqYmZ2enZheXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzUwNDgsImV4cCI6MjEwNjg1MTA0OH0.lthMo0A1QcAGOnp4NJ65-FDsP7yOCpA-OikA-Ei1gqY';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
