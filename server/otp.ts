import { randomInt, randomBytes, createHash } from 'crypto';
import { db } from './db';
import { sendOtpEmail } from './resend';

// Secret salt for OTP hashing (prevents rainbow table attacks)
const OTP_SALT = process.env.OTP_SECRET_SALT || 'portal_student_otp_salt_v1_secure';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_VERIFY_ATTEMPTS = 5;
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes to submit form after email verification

/**
 * Hash OTP using SHA-256 with salt
 */
export function hashOtp(otp: string): string {
  return createHash('sha256').update(`${otp}:${OTP_SALT}`).digest('hex');
}

/**
 * Generate 6-digit cryptographically secure OTP
 */
export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export interface RequestOtpResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  statusCode: number;
}

export async function requestEmailOtp(rawEmail: string): Promise<RequestOtpResult> {
  const email = rawEmail.trim().toLowerCase();

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
      statusCode: 400,
    };
  }

  // 1. Check cooldown (60 seconds)
  const lastSent = await db.getLastOtpSentTime(email);
  if (lastSent) {
    const elapsed = Date.now() - lastSent.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
        cooldownSeconds: remainingSeconds,
        statusCode: 429,
      };
    }
  }

  // 2. Generate secure 6-digit OTP and hash it
  const otp = generateOtp();
  const hashed = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // 3. Save OTP hash to database (invalidating previous unverified OTPs)
  await db.saveOtp(email, hashed, expiresAt);

  // 4. Send email via Resend
  const emailResult = await sendOtpEmail(email, otp);

  if (!emailResult.success) {
    return {
      success: false,
      message: emailResult.error || 'Failed to send OTP email. Please try again.',
      statusCode: 500,
    };
  }

  return {
    success: true,
    message: 'OTP sent to your email.',
    cooldownSeconds: 60,
    statusCode: 200,
  };
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  verificationToken?: string;
  remainingAttempts?: number;
  statusCode: number;
}

export async function verifyEmailOtp(rawEmail: string, rawOtp: string): Promise<VerifyOtpResult> {
  const email = rawEmail.trim().toLowerCase();
  const otp = (rawOtp || '').trim();

  if (!email) {
    return {
      success: false,
      message: 'Email address is required.',
      statusCode: 400,
    };
  }

  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return {
      success: false,
      message: 'Please enter a valid 6-digit OTP.',
      statusCode: 400,
    };
  }

  // 1. Fetch latest active unverified OTP for email
  const record = await db.getLatestActiveOtp(email);
  if (!record) {
    return {
      success: false,
      message: 'No active OTP request found. Please click Send OTP.',
      statusCode: 400,
    };
  }

  // 2. Check expiration
  const now = new Date();
  if (record.expiresAt < now) {
    return {
      success: false,
      message: 'This OTP has expired. Please request a new one.',
      statusCode: 400,
    };
  }

  // 3. Check attempt count
  if (record.attemptCount >= MAX_VERIFY_ATTEMPTS) {
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP.',
      statusCode: 429,
    };
  }

  // Increment attempt count
  const newAttemptCount = record.attemptCount + 1;
  await db.updateOtpAttempts(record.id, newAttemptCount);

  // 4. Verify hash
  const inputHash = hashOtp(otp);
  if (inputHash !== record.otpHash) {
    const remaining = MAX_VERIFY_ATTEMPTS - newAttemptCount;
    return {
      success: false,
      message: remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Incorrect OTP. Maximum attempts exceeded. Please request a new OTP.',
      remainingAttempts: remaining,
      statusCode: 400,
    };
  }

  // 5. Success: generate cryptographic verification token
  const token = randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

  await db.markOtpVerified(record.id, token, tokenExpiresAt);

  return {
    success: true,
    message: 'Email verified successfully.',
    verificationToken: token,
    statusCode: 200,
  };
}

export async function validateVerificationToken(email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;
  const record = await db.findValidVerificationToken(email, token);
  return Boolean(record);
}

export async function consumeVerificationToken(email: string, token: string): Promise<void> {
  const record = await db.findValidVerificationToken(email, token);
  if (record) {
    await db.consumeVerificationToken(record.id);
  }
}
