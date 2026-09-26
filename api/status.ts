import { isPostgresConfigured } from '../server/db.js';
import { isSupabaseAuthConfigured } from '../server/supabase-auth.js';

export default function handler(_req: any, res: any) {
  return res.json({
    databaseConfigured: isPostgresConfigured(),
    databaseType: isPostgresConfigured() ? 'Supabase PostgreSQL' : 'Memory Database (Fallback)',
    supabaseAuthConfigured: isSupabaseAuthConfigured(),
  });
}
