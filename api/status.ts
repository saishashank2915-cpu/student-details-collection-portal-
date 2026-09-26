import { isPostgresConfigured } from '../server/db';
import { isResendConfigured } from '../server/resend';

export default function handler(_req: any, res: any) {
  return res.json({
    databaseConfigured: isPostgresConfigured(),
    databaseType: isPostgresConfigured() ? 'Supabase PostgreSQL' : 'Memory Database (Fallback)',
    resendConfigured: isResendConfigured(),
  });
}
