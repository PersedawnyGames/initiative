/* ==========================================================================
   Sprout Night sign-ups — connection settings
   --------------------------------------------------------------------------
   Paste the two values from Supabase here (Project Settings → API).
   Both are meant to be public — the database rules in supabase/setup.sql
   are what keep sign-ups safe, not these values.
   Never paste the "service_role" / "secret" key here.
   ========================================================================== */
window.SPROUT_CONFIG = {
  supabaseUrl: '',      // e.g. 'https://abcdefghijkl.supabase.co'
  supabaseKey: ''       // the "anon" / "publishable" key
};
