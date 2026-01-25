
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🔥 SCRIPT DE REPARAÇÃO DEFINITIVA (Execute no SQL EDITOR do Supabase):
 * 
 * -- 1. GARANTIR QUE A EXTENSÃO DE UUID ESTÁ ATIVA
 * CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 * 
 * -- 2. REPARAÇÃO DA TABELA PROFILES (Adiciona colunas e remove cache fantasma)
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stand_name TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
 * 
 * -- 3. REPARAÇÃO DA TABELA CARS
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS images TEXT[];
 * 
 * -- 4. RESET TOTAL DO CACHE DA API (Obrigatório para remover o erro 'schema cache')
 * -- Este comando força o PostgREST a re-mapear todas as tabelas e colunas imediatamente.
 * NOTIFY pgrst, 'reload schema';
 * 
 * -- 5. GARANTIR QUE AS POLÍTICAS DE RLS NÃO BLOQUEIAM AS NOVAS COLUNAS
 * -- Se as políticas forem antigas, elas podem ignorar colunas novas.
 * ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 * 
 * DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
 * CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
 * FOR SELECT USING (true);
 * 
 * DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
 * CREATE POLICY "Users can update own profile" ON public.profiles
 * FOR UPDATE USING (auth.uid() = id)
 * WITH CHECK (auth.uid() = id);
 */

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('id, description').limit(1);
    if (!error) return { status: 'online' as const };
    if (error.message.includes('description')) return { status: 'schema_error' as const, message: error.message };
    return { status: 'error' as const, message: error.message };
  } catch (err: any) {
    return { status: 'offline' as const, message: err.message };
  }
};
