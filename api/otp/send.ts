import type { IncomingMessage, ServerResponse } from 'http';
import { requestEmailOtp } from '../../server/otp';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const result = await requestEmailOtp(email);
    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
    });
  } catch (error: any) {
    console.error('Vercel handler error in /api/otp/send:', error);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
}
