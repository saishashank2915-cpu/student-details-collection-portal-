import React, { useState, useEffect } from 'react';
import { validateEmail, validateMobileNumber } from '../lib/validation';

interface ContactVerificationProps {
  email: string;
  mobileNumber: string;
  isEmailVerified: boolean;
  verificationToken: string;
  onEmailChange: (newEmail: string) => void;
  onMobileChange: (newMobile: string) => void;
  onVerificationSuccess: (token: string) => void;
  onResetEmailVerification: () => void;
  errors: Record<string, string | undefined>;
}

export const ContactVerificationSection: React.FC<ContactVerificationProps> = ({
  email,
  mobileNumber,
  isEmailVerified,
  onEmailChange,
  onMobileChange,
  onVerificationSuccess,
  onResetEmailVerification,
  errors,
}) => {
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Timer countdown for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendOtp = async () => {
    setOtpError(null);
    setOtpMessage(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setOtpError(emailErr);
      return;
    }

    if (isSendingOtp || cooldown > 0) return;

    setIsSendingOtp(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => ({
        success: false,
        message: `The OTP service returned an invalid response (HTTP ${response.status}). Check the Vercel runtime logs.`,
      }));

      if (response.ok && data.success) {
        setOtpSent(true);
        setOtpMessage('OTP sent to your email.');
        setCooldown(data.cooldownSeconds || 60);
      } else {
        setOtpError(data.message || 'Failed to send OTP. Please try again.');
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
      }
    } catch (err: any) {
      setOtpError('Network error while requesting OTP. Please check your connection.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);

    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter the 6-digit OTP received in your email.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
        }),
      });

      const data = await response.json().catch(() => ({
        success: false,
        message: `The OTP service returned an invalid response (HTTP ${response.status}). Check the Vercel runtime logs.`,
      }));

      if (response.ok && data.verified && data.verificationToken) {
        onVerificationSuccess(data.verificationToken);
        setOtpError(null);
        setOtpMessage(null);
        setOtpInput('');
      } else {
        setOtpError(data.message || 'Invalid OTP. Please check and try again.');
      }
    } catch (err: any) {
      setOtpError('Network error while verifying OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleChangeEmailClick = () => {
    onResetEmailVerification();
    setOtpSent(false);
    setOtpInput('');
    setOtpMessage(null);
    setOtpError(null);
    setCooldown(0);
  };

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only digits, maximum 10
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    onMobileChange(digitsOnly);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden mb-5">
      {/* Section Header */}
      <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-800 tracking-wide uppercase">
          2. Contact Verification
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Field 5: Email Address with OTP */}
        <div>
          <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email Address <span className="text-red-500">*</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="emailAddress"
              type="email"
              value={email}
              disabled={isEmailVerified}
              onChange={(e) => {
                if (isEmailVerified) onResetEmailVerification();
                onEmailChange(e.target.value.toLowerCase().trim());
              }}
              placeholder="e.g. student@example.com"
              className={`flex-1 px-3.5 py-2.5 rounded-md border text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none transition-colors ${
                isEmailVerified
                  ? 'bg-gray-100/70 border-gray-300 text-gray-700 cursor-not-allowed'
                  : errors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                  : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
              }`}
            />

            {!isEmailVerified ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || cooldown > 0 || !email.trim()}
                className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isSendingOtp || cooldown > 0 || !email.trim()
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:bg-blue-800'
                }`}
              >
                {isSendingOtp
                  ? 'Sending...'
                  : cooldown > 0
                  ? `Resend OTP (${cooldown}s)`
                  : otpSent
                  ? 'Resend OTP'
                  : 'Send OTP'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleChangeEmailClick}
                className="px-4 py-2.5 rounded-md text-sm font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer transition-colors whitespace-nowrap"
              >
                Change Email
              </button>
            )}
          </div>

          {/* Email Verified Badge */}
          {isEmailVerified && (
            <div className="mt-2.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md w-fit">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Email Verified</span>
            </div>
          )}

          {/* Form Error */}
          {errors.email && !isEmailVerified && (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          )}

          {/* OTP Sent status message */}
          {otpMessage && !isEmailVerified && (
            <p className="mt-2 text-xs font-medium text-emerald-700">{otpMessage}</p>
          )}

          {otpError && !isEmailVerified && (
            <p role="alert" className="mt-2 text-xs text-red-600 font-medium">{otpError}</p>
          )}

          {/* OTP Input Row when sent and not yet verified */}
          {!isEmailVerified && otpSent && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <label htmlFor="otpField" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                OTP (One-Time Password) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="otpField"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="w-full sm:w-48 px-3.5 py-2 rounded-md border border-gray-300 text-base font-mono tracking-widest text-center text-gray-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otpInput.trim().length !== 6}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isVerifyingOtp || otpInput.trim().length !== 6
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  }`}
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                A 6-digit code has been sent to your email. It is valid for 5 minutes.
              </p>
            </div>
          )}

          {!otpSent && !isEmailVerified && (
            <p className="mt-1 text-xs text-gray-400">
              Click &quot;Send OTP&quot; to verify your email. Email verification is required before submission.
            </p>
          )}
        </div>

        {/* Field 6: Mobile Number (STRICTLY NO OTP / SMS) */}
        <div>
          <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <span className="inline-flex items-center px-3.5 py-2.5 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-600 font-medium text-sm select-none">
              +91
            </span>
            <input
              id="mobileNumber"
              type="tel"
              value={mobileNumber}
              onChange={handleMobileInput}
              placeholder="9876543210"
              maxLength={10}
              className={`flex-1 sm:w-64 px-3.5 py-2.5 rounded-r-md border text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none transition-colors ${
                errors.mobileNumber
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                  : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
              }`}
            />
          </div>
          {errors.mobileNumber ? (
            <p className="mt-1 text-xs text-red-600">{errors.mobileNumber}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">
              Enter 10-digit Indian mobile number. No OTP required for mobile.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
