
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🚀 EXECUTE ESTE SCRIPT NO SQL EDITOR SE OS LEADS OU ELIMINAÇÃO NÃO FUNCIONAREM:
 * 
 * -- 1. Garantir que as tabelas existem
 * CREATE TABLE IF NOT EXISTS public.leads (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at timestamptz DEFAULT now(),
 *   customer_name text NOT NULL,
 *   customer_email text NOT NULL,
 *   customer_phone text NOT NULL,
 *   message text,
 *   status text DEFAULT 'Pendente',
 *   car_id text,
 *   stand_name text
 * );
 * 
 * -- 2. Políticas para LEADS
 * ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
 * DROP POLICY IF EXISTS "allow_anon_insert" ON public.leads;
 * DROP POLICY IF EXISTS "allow_auth_select" ON public.leads;
 * DROP POLICY IF EXISTS "allow_auth_delete" ON public.leads;
 * CREATE POLICY "allow_anon_insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
 * CREATE POLICY "allow_auth_select" ON public.leads FOR SELECT TO authenticated USING (true);
 * CREATE POLICY "allow_auth_delete" ON public.leads FOR DELETE TO authenticated USING (true);
 * 
 * -- 3. Políticas para CARS (Eliminação Definitiva)
 * ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
 * DROP POLICY IF EXISTS "allow_public_select_cars" ON public.cars;
 * DROP POLICY IF EXISTS "allow_auth_all_cars" ON public.cars;
 * 
 * -- Qualquer um vê os carros
 * CREATE POLICY "allow_public_select_cars" ON public.cars FOR SELECT TO anon, authenticated USING (true);
 * -- Autenticados podem fazer tudo (CRUD)
 * CREATE POLICY "allow_auth_all_cars" ON public.cars FOR ALL TO authenticated USING (true) WITH CHECK (true);
 * 
 * -- 4. Privilégios Globais
 * GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
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
