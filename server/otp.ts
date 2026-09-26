import { randomBytes, createHash } from 'crypto';
import { db, isPostgresConfigured } from './db.js';
import { authRequest } from './supabase-auth.js';

const TOKEN_EXPIRY_MS = 15 * 60 * 1000;
const normalizeEmail = (value: unknown): string => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = (value: string): boolean => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const tokenHash = (value: string): string => createHash('sha256').update(value).digest('hex');

export interface RequestOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  statusCode: number;
}

export async function requestEmailOtp(rawEmail: string): Promise<RequestOtpResult> {
  const email = normalizeEmail(rawEmail);
  if (!validEmail(email)) return { success: false, message: 'Please enter a valid email address.', statusCode: 400 };
  const result = await authRequest('otp', { email, create_user: true });
  if (!result.ok) return { success: false, message: result.message, statusCode: result.status, cooldownSeconds: result.cooldownSeconds };
  return { success: true, message: 'OTP requested. Check your inbox and spam folder.', cooldownSeconds: 60, statusCode: 200 };
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  verificationToken?: string;
  remainingAttempts?: number;
  statusCode: number;
}

export async function verifyEmailOtp(rawEmail: string, rawOtp: string): Promise<VerifyOtpResult> {
  const email = normalizeEmail(rawEmail);
  const otp = typeof rawOtp === 'string' ? rawOtp.trim() : '';
  if (!validEmail(email) || !/^\d{6}$/.test(otp)) {
    return { success: false, message: 'Enter a valid email address and the 6-digit code.', statusCode: 400 };
  }
  if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && !isPostgresConfigured()) {
    return { success: false, message: 'The portal database is not configured. Set DATABASE_URL before verifying.', statusCode: 503 };
  }
  const result = await authRequest('verify', { email, token: otp, type: 'email' });
  if (!result.ok) return { success: false, message: result.message, statusCode: result.status };
  const user = result.data?.user;
  if (!result.data?.access_token || !user?.id || !user?.email_confirmed_at || normalizeEmail(user.email) !== email) {
    return { success: false, message: 'Supabase did not confirm this email address. Request a new OTP.', statusCode: 400 };
  }
  // Do not expose Supabase access/refresh tokens. Issue a scoped form-submission token.
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);
  try {
    const record = await db.saveOtp(email, tokenHash(randomBytes(32).toString('hex')), new Date());
    await db.markOtpVerified(record.id, tokenHash(token), expires);
  } catch {
    return { success: false, message: 'Email was confirmed, but the portal could not save verification. Check the database connection, then request a new OTP.', statusCode: 503 };
  }
  return { success: true, message: 'Email verified successfully.', verificationToken: token, statusCode: 200 };
}

export async function validateVerificationToken(email: string, token: string): Promise<boolean> {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return false;
  const record = await db.findValidVerificationToken(normalizeEmail(email), tokenHash(token));
  return Boolean(record?.verifiedAt);
}

export async function consumeVerificationToken(email: string, token: string): Promise<void> {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return;
  const record = await db.findValidVerificationToken(normalizeEmail(email), tokenHash(token));
  if (record) await db.consumeVerificationToken(record.id);
}
