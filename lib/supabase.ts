
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🔥 SCRIPT DE REPARAÇÃO DEFINITIVO:
 * 
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stand_name TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
 * 
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
 * 
 * GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
 * 
 * COMMENT ON TABLE public.profiles IS 'Schema version 2.2';
 * NOTIFY pgrst, 'reload schema';
 */

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (!error) return { status: 'online' as const };
    return { status: 'error' as const, message: error.message };
  } catch (err: any) {
    return { status: 'offline' as const, message: err.message };
  }
};
