import { verifyEmailOtp } from '../../server/otp';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are both required.' });
    }

    const result = await verifyEmailOtp(email, otp);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      verified: result.success,
      verificationToken: result.verificationToken,
      remainingAttempts: result.remainingAttempts,
    });
  } catch (error: any) {
    console.error('Vercel handler error in /api/otp/verify:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred during verification.' });
  }
}
