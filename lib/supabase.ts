
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * COMANDOS SQL DEFINITIVOS PARA O SUPABASE (SQL EDITOR):
 * 
 * 1. Criar a política de INSERÇÃO para o formulário público:
 * create policy "Inserção Pública de Leads" 
 * on public.leads 
 * for insert 
 * to anon 
 * with check (true);
 * 
 * 2. Criar a política de LEITURA para o Painel Admin/Stand:
 * create policy "Leitura de Leads para Autenticados" 
 * on public.leads 
 * for select 
 * to authenticated 
 * using (true);
 * 
 * 3. Garantir que a tabela permite acesso via API:
 * alter table public.leads enable row level security;
 */

export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).limit(1);
    if (!error) return { status: 'online' as const };
    return { status: 'error' as const, message: error.message };
  } catch (err: any) {
    return { status: 'offline' as const, message: err.message };
  }
};
