
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://xglpvmtqwxseglychjhr.supabase.co';
export const supabaseAnonKey = 'sb_publishable_o-wZ9sIKkceI0RfEJ4doRw_wXwVvRv7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Função para testar a saúde da conexão e existência de tabelas básicas
 */
export const checkSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).limit(1);
    
    if (!error) return { status: 'online' as const };
    
    // PGRST104: Tabela não encontrada
    if (error.code === 'PGRST104' || error.message.includes('relation "profiles" does not exist')) {
      return { status: 'missing_tables' as const, message: error.message };
    }
    
    return { status: 'error' as const, message: error.message };
  } catch (err: any) {
    return { status: 'offline' as const, message: err.message };
  }
};
