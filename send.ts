import { db } from '../../server/db.js';
import { mailEngine } from '../../server/mailer.js';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check Rate Limit (60 seconds)
    const lastSent = await db.getLastOtpSentTime(normalizedEmail);
    if (lastSent && (new Date().getTime() - lastSent.getTime() < 60000)) {
       return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting a new OTP.' });
    }

    // 2. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Save to Database
    await db.saveOtp(normalizedEmail, otpHash, expiresAt);

    // 4. Send Email via Fallback Engine
    await mailEngine.sendMail({
      to: normalizedEmail,
      subject: 'Your AVN Portal Verification Code',
      text: `Your verification code is: ${otpCode}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e3a8a;">AVN Portal Verification</h2>
          <p>Use the following one-time password to verify your email address:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #2563eb; margin: 16px 0;">
            ${otpCode}
          </div>
          <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('OTP Send Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
}