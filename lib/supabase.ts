
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🚀 SCRIPT DE CORREÇÃO PARA REMOÇÃO DEFINITIVA (Execute no SQL Editor do Supabase):
 * 
 * -- 1. Habilitar RLS na tabela de carros (se não estiver)
 * ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
 * 
 * -- 2. Remover políticas antigas para evitar conflitos
 * DROP POLICY IF EXISTS "allow_public_select_cars" ON public.cars;
 * DROP POLICY IF EXISTS "allow_auth_all_cars" ON public.cars;
 * DROP POLICY IF EXISTS "Stands can delete own cars" ON public.cars;
 * DROP POLICY IF EXISTS "Admins can delete any car" ON public.cars;
 * 
 * -- 3. Criar nova política de leitura pública
 * CREATE POLICY "allow_public_select_cars" ON public.cars 
 * FOR SELECT TO anon, authenticated 
 * USING (true);
 * 
 * -- 4. Criar política de controle total para o dono do anúncio
 * CREATE POLICY "Stands can manage own cars" ON public.cars
 * FOR ALL TO authenticated
 * USING (auth.uid() = user_id)
 * WITH CHECK (auth.uid() = user_id);
 * 
 * -- 5. Criar política especial para o Admin (email fixo)
 * CREATE POLICY "Admins can manage everything" ON public.cars
 * FOR ALL TO authenticated
 * USING (auth.jwt() ->> 'email' = 'admin@facilitadorcar.pt');
 * 
 * -- 6. Otimizar tabela de Leads para não bloquear deleção (Remover restrições de FK se houver)
 * -- Se 'car_id' for uma Foreign Key, ela precisa de ON DELETE CASCADE:
 * -- ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_car_id_fkey;
 * -- ALTER TABLE public.leads ADD CONSTRAINT leads_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;
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
