export function isSupabaseAuthConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() &&
    (process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim()));
}

export interface AuthResult {
  ok: boolean;
  status: number;
  data: any;
  message: string;
  cooldownSeconds?: number;
}

export async function authRequest(endpoint: 'otp' | 'verify', body: Record<string, unknown>): Promise<AuthResult> {
  const rawUrl = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  if (!rawUrl || !key) {
    return { ok: false, status: 503, data: null,
      message: 'Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel and redeploy.' };
  }
  let base: URL;
  try {
    base = new URL(rawUrl);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error();
  } catch {
    return { ok: false, status: 503, data: null, message: 'SUPABASE_URL must be your HTTPS project URL, without a database connection string or extra path.' };
  }
  try {
    const response = await fetch(new URL(`/auth/v1/${endpoint}`, base), {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data && typeof data === 'object') {
      return { ok: true, status: response.status, data, message: '' };
    }
    const code = typeof data?.code === 'string' ? data.code : data?.error_code;
    let message = endpoint === 'verify'
      ? 'The code is invalid or expired. Request a new OTP and try again.'
      : 'Supabase could not send the email. Check Authentication logs and SMTP settings in Supabase.';
    if (response.status === 429) message = 'Too many OTP requests. Wait before trying again; the project email limit may have been reached.';
    else if (response.status === 401 || response.status === 403) message = 'Supabase rejected the request. Check the project API key and Authentication settings.';
    else if (code === 'email_address_not_authorized') message = 'Supabase email sending is restricted. Enable and save Custom SMTP in this Supabase project.';
    else if (code === 'signup_disabled') message = 'New user registration is disabled in Supabase Auth. Enable signups for student email verification.';
    else if (code === 'email_provider_disabled') message = 'Enable the Email provider in Supabase Authentication.';
    else if (code === 'captcha_failed') message = 'Supabase requires CAPTCHA verification. The portal CAPTCHA integration must be configured.';
    const retry = Number(response.headers.get('retry-after'));
    return { ok: false, status: response.status === 429 ? 429 : response.status >= 500 || response.ok ? 502 : 400,
      data: null, message,
      cooldownSeconds: response.status === 429 ? (Number.isFinite(retry) && retry > 0 ? Math.ceil(retry) : 60) : undefined };
  } catch {
    return { ok: false, status: 502, data: null, message: 'Unable to reach Supabase Auth. Please try again shortly.' };
  }
}
