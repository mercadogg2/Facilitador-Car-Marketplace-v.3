
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🛠️ SCRIPT DE REPARAÇÃO TOTAL (Se os leads falharem):
 * Execute isto no SQL Editor do Supabase se os dados não salvarem:
 * 
 * -- 1. Recriar a tabela com car_id tipo TEXT (para aceitar IDs '1', '2' ou UUIDs)
 * DROP TABLE IF EXISTS public.leads;
 * CREATE TABLE public.leads (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at timestamptz DEFAULT now(),
 *   customer_name text NOT NULL,
 *   customer_email text NOT NULL,
 *   customer_phone text NOT NULL,
 *   message text,
 *   status text DEFAULT 'Pendente',
 *   car_id text -- Mudamos para TEXT para ser compatível com tudo
 * );
 * 
 * -- 2. Liberar RLS
 * ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "allow_anon_insert" ON public.leads FOR INSERT TO anon WITH CHECK (true);
 * CREATE POLICY "allow_auth_select" ON public.leads FOR SELECT TO authenticated USING (true);
 * 
 * -- 3. Dar permissões de sistema
 * GRANT ALL ON TABLE public.leads TO anon, authenticated, service_role;
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
