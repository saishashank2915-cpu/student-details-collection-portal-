import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'onboarding@resend.dev';

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendOtpEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends OTP email using Resend with clean HTML and plaintext fallback.
 */
export async function sendOtpEmail(toEmail: string, otp: string): Promise<SendOtpEmailResult> {
  const subject = 'Student Registration OTP';

  const textContent = `Hello,

Your OTP for Student Details Collection is:

${otp}

This OTP is valid for 5 minutes.

If you did not request this OTP, please ignore this email.

Regards,
Student Details Collection Portal`;

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Student Registration OTP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="background-color: #1a73e8; height: 6px;"></div>
    <div style="padding: 32px 28px;">
      <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Student Details Collection</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 16px 0;">Hello,</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">Your OTP for Student Details Collection is:</p>
      
      <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 18px 24px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a73e8; display: inline-block;">${otp}</span>
      </div>

      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 12px 0;">This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 0 0 24px 0;">If you did not request this OTP, please ignore this email.</p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />

      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
        Regards,<br>
        <strong style="color: #334155;">Student Details Collection Portal</strong>
      </p>
    </div>
  </div>
</body>
</html>`;

  if (!resendClient) {
    return {
      success: false,
      error: 'Email delivery is not configured. Set RESEND_API_KEY in the server environment and redeploy.',
    };
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: resendFromEmail,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    if (error) {
      console.error('[Resend] Error sending email:', error);
      if (error.message && (error.message.includes('only send testing emails') || error.message.includes('verify a domain'))) {
        return {
          success: false,
          error: 'Email sender is restricted. Verify your sending domain in Resend and set RESEND_FROM_EMAIL to an address on that domain, then redeploy.',
        };
      }
      return {
        success: false,
        error: error.message || 'Failed to send email via Resend.',
      };
    }

    if (!data?.id) {
      return { success: false, error: 'The email provider did not accept the message. Please try again later.' };
    }

    return {
      success: true,
      messageId: data.id,
    };
  } catch (err: any) {
    console.error('[Resend] Unexpected exception sending email:', err);
    return {
      success: false,
      error: err.message || 'Error occurred while contacting Resend service.',
    };
  }
}

export function isResendConfigured(): boolean {
  return Boolean(resendApiKey);
}
