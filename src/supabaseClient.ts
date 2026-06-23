/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient<any, "public", any> | null = null;

/**
 * Lazily retrieves the Supabase client if configured with valid environment credentials.
 * If credentials are missing, placeholder, or invalid, returns null to trigger sandbox fallbacks.
 */
export function getSupabaseClient(): SupabaseClient<any, "public", any> | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (
    !url ||
    !key ||
    !url.startsWith("https://") ||
    !url.includes(".supabase.co") ||
    url.includes("your-placeholder") ||
    key.includes("dummy")
  ) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cachedClient;
}
