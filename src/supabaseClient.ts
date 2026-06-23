/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient<any, "public", any> | null = null;

const memoryStorage: Record<string, string> = {};

const safeSupabaseStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Ignore security errors
    }
    return memoryStorage[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      // Ignore security errors
    }
    memoryStorage[key] = value;
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      // Ignore security errors
    }
    delete memoryStorage[key];
  },
};

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
    try {
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: safeSupabaseStorage,
        },
      });
    } catch (e) {
      console.error("Failed to initialize Supabase client:", e);
      return null;
    }
  }
  return cachedClient;
}

