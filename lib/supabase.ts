
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🛠️ SCRIPT DE MANUTENÇÃO TOTAL (Execute no SQL EDITOR do Supabase):
 * 
 * -- 1. Garantir colunas essenciais na tabela PROFILES
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stand_name TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
 * 
 * -- 2. Garantir colunas essenciais na tabela CARS
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS images TEXT[];
 * 
 * -- 3. LIMPAR CACHE DO ESQUEMA (Solução para o erro 'schema cache')
 * NOTIFY pgrst, 'reload schema';
 * 
 * -- 4. Configurar permissões de ADMIN (Substitua pelo seu email de admin)
 * -- Permite ao admin gerir tudo ignorando RLS restritivo
 * DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
 * CREATE POLICY "Admins have full access to profiles" ON public.profiles 
 * FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');
 * 
 * DROP POLICY IF EXISTS "Admins have full access to cars" ON public.cars;
 * CREATE POLICY "Admins have full access to cars" ON public.cars 
 * FOR ALL USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');
 */

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('leads').select('id').limit(1);
    if (!error || error.code === 'PGRST116') return { status: 'online' as const };
    return { status: 'error' as const, message: error.message };
  } catch (err: any) {
    return { status: 'offline' as const, message: err.message };
  }
};
