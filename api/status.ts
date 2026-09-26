import { isPostgresConfigured } from '../server/db.js';
import { isResendConfigured } from '../server/resend.js';

export default function handler(_req: any, res: any) {
  return res.json({
    databaseConfigured: isPostgresConfigured(),
    databaseType: isPostgresConfigured() ? 'Supabase PostgreSQL' : 'Memory Database (Fallback)',
    resendConfigured: isResendConfigured(),
  });
}
