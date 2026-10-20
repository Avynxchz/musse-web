import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://auhqgzrrgvjbfvzvayzg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1aHFnenJyZ3ZqYmZ2enZheXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzUwNDgsImV4cCI6MjEwNjg1MTA0OH0.lthMo0A1QcAGOnp4NJ65-FDsP7yOCpA-OikA-Ei1gqY';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
