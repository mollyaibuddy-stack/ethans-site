// Supabase client - will be configured when database is set up
// Sign up free at https://supabase.com
// Then fill in the values below from your Supabase project settings

export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
};
