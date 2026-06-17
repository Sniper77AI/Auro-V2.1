/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";

// Retrieve variables prefixed with VITE_ for Vite clients
const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || "https://your-placeholder-supabase-url.supabase.co";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-anon-key";

// Warn developer if setup is missing
if (
  !metaEnv.VITE_SUPABASE_URL ||
  metaEnv.VITE_SUPABASE_URL === "" ||
  !metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.VITE_SUPABASE_ANON_KEY === ""
) {
  console.warn(
    "AURA ARCHITECTURE WARNING: Supabase API environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set. The Supabase client is initialized using secure sandbox fallbacks."
  );
}

// Create and export the secure, typed Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
