import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';

// ============================================================================
// Cliente Supabase
// ============================================================================
// Singleton usado em todo o app para qualquer operação no banco.
// Tipado com Database (gerado pela Supabase CLI) para garantir
// autocomplete e validação de tipos em todas as queries.
//
// As variáveis vêm do .env.local (nunca commitado).
// No Vite, variáveis com prefixo VITE_ são expostas no frontend via import.meta.env.
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase ausentes. Verifique o arquivo .env.local ' +
      'na raiz do projeto (use .env.example como referência).'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
