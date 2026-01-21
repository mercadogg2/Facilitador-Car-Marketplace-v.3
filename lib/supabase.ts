
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * RESOLUÇÃO DE ERRO RLS (Row-Level Security):
 * Se estiver a receber o erro "new row violates row-level security policy for table 'leads'",
 * execute o seguinte comando no SQL Editor do seu projeto Supabase:
 * 
 * -- Ativar permissão de inserção pública para a tabela de leads
 * create policy "Permitir inserção pública de leads"
 * on public.leads
 * for insert
 * to anon
 * with check (true);
 * 
 * -- Opcional: Permitir que administradores e stands leiam os leads
 * create policy "Permitir leitura para utilizadores autenticados"
 * on public.leads
 * for select
 * to authenticated
 * using (true);
 */

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).limit(1);
    
    if (!error) return { status: 'online' as const };
    
    if (error.code === 'PGRST104' || error.message.includes('relation "profiles" does not exist')) {
      return { status: 'missing_tables' as const, message: error.message };
    }
    
    return { status: 'error' as const, message: error.message };
  } catch (err: any) {
    return { status: 'offline' as const, message: err.message };
  }
};
