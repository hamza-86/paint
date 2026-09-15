'use client';

import React, { useState, useCallback } from 'react';
import PageHeader from '@/components/admin/PageHeader';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

// ─── Small UI atoms ───────────────────────────────────────────────────────────

function FieldRow({ label, value, badge }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
      {badge && (
        <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mt-0.5">
          {badge}
        </span>
      )}
    </div>
  );
}

function Input({ id, label, type = 'text', value, onChange, placeholder, autoComplete, required }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', type = 'button', className = '' }) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Alert({ type, message }) {
  if (!message) return null;
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  const icons = { error: '✕', success: '✓', info: 'ℹ' };
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${styles[type]}`}>
      <span className="font-bold shrink-0 mt-0.5">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition text-xl leading-none ml-4 focus:outline-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, total = 2 }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              i < step ? 'bg-blue-600' : i === step ? 'bg-blue-300' : 'bg-slate-200'
            }`}
            style={{ width: i < step ? '24px' : '8px' }}
          />
        </React.Fragment>
      ))}
      <span className="text-xs text-slate-400 ml-1">Step {step + 1} of {total}</span>
    </div>
  );
}

// ─── OTP input ────────────────────────────────────────────────────────────────

function OtpInput({ value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        Verification Code <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        autoComplete="one-time-code"
        className="w-full px-3.5 py-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xl text-center font-mono tracking-[0.4em] placeholder:tracking-normal placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  );
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiPost(path, body) {
  const res = await fetch(`/api/backend${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ─── Change Email Modal ───────────────────────────────────────────────────────

function ChangeEmailModal({ open, onClose, currentEmail, onSuccess }) {
  const [step, setStep] = useState(0); // 0 = form, 1 = OTP
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = useCallback(() => {
    setStep(0);
    setNewEmail('');
    setCurrentPassword('');
    setOtp('');
    setSentTo('');
    setLoading(false);
    setError('');
    setSuccess('');
  }, []);

  const handleClose = () => { reset(); onClose(); };

  // Step 1 — request OTP
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiPost('/admin/account/request-email-change', {
        newEmail,
        currentPassword,
      });
      if (!ok) {
        setError(data.message || 'Failed to send verification code.');
      } else {
        setSentTo(data.sentTo || newEmail);
        setStep(1);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiPost('/admin/account/verify-email-change', { otp });
      if (!ok) {
        setError(data.message || 'Verification failed.');
      } else {
        setSuccess(`Email updated to ${data.newEmail || newEmail}`);
        onSuccess(data.newEmail || newEmail);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend
  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiPost('/admin/account/request-email-change', {
        newEmail,
        currentPassword,
      });
      if (!ok) setError(data.message || 'Failed to resend code.');
      else setError('');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Email Address"
      subtitle="You'll receive a verification code at your new email."
    >
      <StepIndicator step={step} />

      {success ? (
        <div className="space-y-4">
          <Alert type="success" message={success} />
          <Btn onClick={handleClose} variant="ghost" className="w-full">
            Close
          </Btn>
        </div>
      ) : step === 0 ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <FieldRow label="Current Email" value={currentEmail} />
          <Input
            id="new-email"
            label="New Email Address"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
            autoComplete="email"
            required
          />
          <Input
            id="email-change-password"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
          />
          <Alert type="error" message={error} />
          <div className="flex gap-3 pt-1">
            <Btn variant="ghost" onClick={handleClose} className="flex-1">Cancel</Btn>
            <Btn type="submit" disabled={loading || !newEmail || !currentPassword} className="flex-1">
              {loading && <Spinner />}
              {loading ? 'Sending…' : 'Send Verification Code'}
            </Btn>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <Alert
            type="info"
            message={`A 6-digit code was sent to ${sentTo}. It expires in 10 minutes.`}
          />
          <OtpInput value={otp} onChange={setOtp} />
          <Alert type="error" message={error} />
          <div className="flex gap-3 pt-1">
            <Btn variant="ghost" onClick={() => { setStep(0); setOtp(''); setError(''); }} className="flex-1">
              ← Back
            </Btn>
            <Btn type="submit" disabled={loading || otp.length !== 6} className="flex-1">
              {loading && <Spinner />}
              {loading ? 'Verifying…' : 'Verify & Change Email'}
            </Btn>
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full text-xs text-slate-400 hover:text-blue-600 transition text-center"
          >
            Didn&apos;t receive it? Resend code
          </button>
        </form>
      )}
    </Modal>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({ open, onClose, currentEmail }) {
  const [step, setStep] = useState(0); // 0 = form, 1 = OTP
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = useCallback(() => {
    setStep(0);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setOtp('');
    setSentTo('');
    setLoading(false);
    setError('');
    setSuccess('');
  }, []);

  const handleClose = () => { reset(); onClose(); };

  // Inline validation
  const passwordMismatch =
    confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

  // Step 1 — request OTP
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (passwordMismatch) return;
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiPost('/admin/account/request-password-change', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      if (!ok) {
        setError(data.message || 'Failed to send verification code.');
      } else {
        setSentTo(data.sentTo || currentEmail);
        setStep(1);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiPost('/admin/account/verify-password-change', { otp });
      if (!ok) {
        setError(data.message || 'Verification failed.');
      } else {
        setSuccess(data.message || 'Password updated successfully.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend
  const handleResend = async () => {
    setError('');
    setLoading(true);
    try {
      const { ok, data } = await apiPost('/admin/account/request-password-change', {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      if (!ok) setError(data.message || 'Failed to resend code.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change Password"
      subtitle="A verification code will be sent to your registered email."
    >
      <StepIndicator step={step} />

      {success ? (
        <div className="space-y-4">
          <Alert type="success" message={success} />
          <p className="text-xs text-slate-500 text-center">
            Please log out and log back in with your new password.
          </p>
          <Btn onClick={handleClose} variant="ghost" className="w-full">
            Close
          </Btn>
        </div>
      ) : step === 0 ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <Input
            id="pwd-current"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
          />
          <Input
            id="pwd-new"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            autoComplete="new-password"
            required
          />
          <div>
            <label htmlFor="pwd-confirm" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              id="pwd-confirm"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              required
              className={`w-full px-3.5 py-2.5 rounded-lg border text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                passwordMismatch
                  ? 'border-red-300 bg-red-50 focus:ring-red-400'
                  : 'border-slate-200 bg-white focus:ring-blue-500'
              }`}
            />
            {passwordMismatch && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>
            )}
          </div>
          <Alert type="error" message={error} />
          <div className="flex gap-3 pt-1">
            <Btn variant="ghost" onClick={handleClose} className="flex-1">Cancel</Btn>
            <Btn
              type="submit"
              disabled={loading || !currentPassword || !newPassword || !confirmNewPassword || passwordMismatch}
              className="flex-1"
            >
              {loading && <Spinner />}
              {loading ? 'Sending…' : 'Send Verification Code'}
            </Btn>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <Alert
            type="info"
            message={`A 6-digit code was sent to ${sentTo}. It expires in 10 minutes.`}
          />
          <OtpInput value={otp} onChange={setOtp} />
          <Alert type="error" message={error} />
          <div className="flex gap-3 pt-1">
            <Btn variant="ghost" onClick={() => { setStep(0); setOtp(''); setError(''); }} className="flex-1">
              ← Back
            </Btn>
            <Btn type="submit" disabled={loading || otp.length !== 6} className="flex-1">
              {loading && <Spinner />}
              {loading ? 'Verifying…' : 'Verify & Change Password'}
            </Btn>
          </div>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full text-xs text-slate-400 hover:text-blue-600 transition text-center"
          >
            Didn&apos;t receive it? Resend code
          </button>
        </form>
      )}
    </Modal>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { data: user, isLoading, refetch } = useCurrentUser();

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Optimistically update the displayed email after a successful change
  const [displayEmail, setDisplayEmail] = useState(null);

  const currentEmail =
    displayEmail ?? user?.email ?? (isLoading ? null : 'admin@paintshop.com');

  const handleEmailSuccess = (newEmail) => {
    setDisplayEmail(newEmail);
    // Also refresh the session data in the background
    if (typeof refetch === 'function') refetch();
  };

  return (
    <>
      <div className="space-y-8 max-w-2xl">
        <PageHeader
          title="Settings"
          description="Manage your shop owner account credentials."
          badge="Account"
        />

        {/* ── Shop Owner Account ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Shop Owner Account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Credentials used to access and manage this paint shop.
            </p>
          </div>

          <div className="px-6 py-5 space-y-0">
            {/* Email row */}
            <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                  Email Address
                </p>
                <p className="text-sm font-medium text-slate-800 truncate">
                  {isLoading && !displayEmail ? (
                    <span className="inline-block h-4 w-44 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    currentEmail
                  )}
                </p>
              </div>
              <button
                id="btn-change-email"
                onClick={() => setEmailModalOpen(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Change Email
              </button>
            </div>

            {/* Password row */}
            <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                  Password
                </p>
                <p className="text-sm font-medium text-slate-400 tracking-[0.3em]">
                  ••••••••••••
                </p>
              </div>
              <button
                id="btn-change-password"
                onClick={() => setPasswordModalOpen(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Change Password
              </button>
            </div>

            {/* Role row */}
            <div className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                  Account Role
                </p>
                <p className="text-sm font-medium text-slate-800">Shop Owner</p>
              </div>
              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Full Access
              </span>
            </div>
          </div>
        </div>

        {/* ── Security note ───────────────────────────────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3">
          <span className="text-amber-500 text-lg shrink-0 mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">
              Account changes require OTP verification
            </p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Email and password changes are protected by a one-time verification
              code sent to your email address. Codes expire in 10 minutes and
              can only be used once.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ChangeEmailModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        currentEmail={currentEmail || ''}
        onSuccess={handleEmailSuccess}
      />

      <ChangePasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        currentEmail={currentEmail || ''}
      />
    </>
  );
}
