
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 🚀 EXECUTE ESTE SCRIPT NO SQL EDITOR SE OS LEADS NÃO APARECEREM:
 * 
 * -- 1. Garantir que a tabela existe com todas as colunas necessárias
 * CREATE TABLE IF NOT EXISTS public.leads (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   created_at timestamptz DEFAULT now(),
 *   customer_name text NOT NULL,
 *   customer_email text NOT NULL,
 *   customer_phone text NOT NULL,
 *   message text,
 *   status text DEFAULT 'Pendente',
 *   car_id text,
 *   stand_name text -- Coluna para filtrar no dashboard
 * );
 * 
 * -- 2. Resetar Políticas de Segurança (RLS)
 * ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
 * DROP POLICY IF EXISTS "allow_anon_insert" ON public.leads;
 * DROP POLICY IF EXISTS "allow_auth_select" ON public.leads;
 * 
 * -- Permitir que QUALQUER UM envie leads
 * CREATE POLICY "allow_anon_insert" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
 * -- Permitir que STANDS vejam os seus próprios leads (ou ADMINS vejam todos)
 * CREATE POLICY "allow_auth_select" ON public.leads FOR SELECT TO authenticated USING (true);
 * 
 * -- 3. Garantir privilégios de escrita
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
