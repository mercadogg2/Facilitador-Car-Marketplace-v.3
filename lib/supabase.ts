
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🚀 SCRIPT DE CONFIGURAÇÃO (Execute no SQL Editor do Supabase):
 * 
 * -- 1. Tabela de Carros (Anúncios)
 * ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
 * 
 * -- 2. Atualizar políticas para respeitar a visibilidade
 * -- Visitantes só podem ver anúncios ativos
 * DROP POLICY IF EXISTS "allow_public_select_cars" ON public.cars;
 * CREATE POLICY "allow_public_select_cars" ON public.cars 
 * FOR SELECT TO anon, authenticated 
 * USING (active = true OR auth.uid() = user_id);
 * 
 * -- 3. Manutenção de Stands (Dono do anúncio)
 * DROP POLICY IF EXISTS "Stands can manage own cars" ON public.cars;
 * CREATE POLICY "Stands can manage own cars" ON public.cars
 * FOR ALL TO authenticated
 * USING (auth.uid() = user_id)
 * WITH CHECK (auth.uid() = user_id);
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
