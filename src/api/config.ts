/* Public values, baked in at build time. Without a URL the app runs on the
   test fixtures (fixture mode). The key is the publishable key, meant to be
   public; what it can do is limited by the database grants. */
export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
export const FIXTURE_MODE = !SUPABASE_URL;
