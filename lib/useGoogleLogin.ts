'use client'

import { createClient } from '@/lib/supabase'

/**
 * Hook login Google via Supabase OAuth.
 * Dipakai di Hero, Closing, LockedPreview — dulunya duplikat 3x.
 */
export function useGoogleLogin() {
  return async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }
}
