
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🚀 SCRIPT DE CONFIGURAÇÃO (Execute no SQL Editor do Supabase):
 * 
 * -- 1. Garantir que a tabela profiles tem as colunas necessárias
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS description TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stand_name TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
 * ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
 * 
 * -- 2. Configurar RLS para permitir que utilizadores editem os seus próprios perfis
 * CREATE POLICY "Users can update own profile" ON public.profiles
 * FOR UPDATE USING (auth.uid() = id);
 * 
 * -- 3. Permitir inserção inicial se não existir
 * CREATE POLICY "Users can insert own profile" ON public.profiles
 * FOR INSERT WITH CHECK (auth.uid() = id);
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
