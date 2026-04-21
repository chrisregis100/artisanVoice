/**
 * Client env in `src/lib/env.ts` is validated at module load.
 * Set placeholders before any test file imports modules that transitively load `env`.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??=
  "test-publishable-key";
process.env.NEXT_PUBLIC_APP_URL ??= "https://test.example.com";
