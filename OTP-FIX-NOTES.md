# OTP delivery fix

Upload the extracted project contents to the repository root and redeploy.

Required server environment settings:
- RESEND_API_KEY: your Resend API key.
- RESEND_FROM_EMAIL: an email address on your Resend-verified sending domain.
- DATABASE_URL: your persistent PostgreSQL connection string. The existing in-memory fallback is not suitable for reliable verification across Vercel functions.

The resend.dev default sender is restricted to testing with your Resend account email. It cannot send to arbitrary students.

Changes: display OTP errors on the first request, describe non-JSON API failures, remove simulated delivery and OTP disclosure, require provider message acceptance, correct the send handler method status to 405.

Validation: five mocked email-provider scenarios passed. No real email was sent. A complete production build and deployed delivery were not verified in this environment.

If sending still fails, copy the visible error and the Vercel runtime log for /api/otp/send. Do not share API keys or database passwords.
