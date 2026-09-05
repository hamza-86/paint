'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginUser } from '@/lib/auth';
import { Suspense } from 'react';

// ─── Inner component that reads searchParams ──────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser({ email, password }, router, callbackUrl);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      {/* Logo + Title */}
      <div style={styles.header}>
        <div style={styles.logoCircle}>
          <PaintBrushIcon />
        </div>
        <h1 style={styles.title}>Paint Shop</h1>
        <p style={styles.subtitle}>Management Platform</p>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorBox} role="alert">
          <span style={styles.errorIcon}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={styles.form} noValidate>
        <div style={styles.fieldGroup}>
          <label htmlFor="email" style={styles.label}>
            Email Address
          </label>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>
              <EmailIcon />
            </span>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@paintshop.com"
              required
              style={styles.input}
              disabled={loading}
            />
          </div>
        </div>

        <div style={styles.fieldGroup}>
          <label htmlFor="password" style={styles.label}>
            Password
          </label>
          <div style={styles.inputWrapper}>
            <span style={styles.inputIcon}>
              <LockIcon />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={styles.eyeButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading || !email || !password}
          style={{
            ...styles.submitButton,
            ...(loading ? styles.submitButtonLoading : {}),
          }}
        >
          {loading ? (
            <span style={styles.spinner} />
          ) : null}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p style={styles.footer}>
        Painter Management Platform &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main style={styles.page}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />

      <div
        style={{
          ...styles.cardWrapper,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
// Using inline styles so this page works without extra CSS files.

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'hsl(222, 28%, 8%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "var(--font-geist-sans), 'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  // Floating accent blobs
  blob1: {
    position: 'absolute',
    top: '-120px',
    right: '-80px',
    width: '420px',
    height: '420px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, hsla(217,91%,60%,0.18) 0%, transparent 70%)',
    filter: 'blur(40px)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-100px',
    left: '-60px',
    width: '380px',
    height: '380px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, hsla(38,92%,55%,0.15) 0%, transparent 70%)',
    filter: 'blur(50px)',
    pointerEvents: 'none',
  },
  blob3: {
    position: 'absolute',
    top: '40%',
    left: '30%',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, hsla(270,80%,60%,0.08) 0%, transparent 70%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  cardWrapper: {
    transition: 'opacity 0.5s ease, transform 0.5s ease',
    width: '100%',
    maxWidth: '440px',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'hsla(222, 22%, 13%, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid hsla(217, 50%, 60%, 0.15)',
    borderRadius: '20px',
    padding: '40px 36px',
    boxShadow: '0 32px 80px hsla(0,0%,0%,0.45), 0 0 0 1px hsla(217,91%,60%,0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, hsl(217,91%,60%), hsl(38,92%,55%))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 8px 32px hsla(217,91%,60%,0.35)',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'hsl(210, 40%, 96%)',
    margin: '0 0 4px',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'hsl(217, 20%, 55%)',
    margin: 0,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'hsla(0, 84%, 60%, 0.12)',
    border: '1px solid hsla(0, 84%, 60%, 0.3)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '20px',
    fontSize: '13.5px',
    color: 'hsl(0, 80%, 70%)',
  },
  errorIcon: {
    flexShrink: 0,
    fontSize: '15px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'hsl(217, 30%, 72%)',
    letterSpacing: '0.2px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    display: 'flex',
    alignItems: 'center',
    color: 'hsl(217, 20%, 50%)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '11px 40px 11px 38px',
    background: 'hsla(220, 20%, 10%, 0.7)',
    border: '1px solid hsla(217, 40%, 40%, 0.3)',
    borderRadius: '10px',
    fontSize: '14px',
    color: 'hsl(210, 40%, 95%)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: 'hsl(217, 20%, 50%)',
    padding: '4px',
    borderRadius: '4px',
  },
  submitButton: {
    marginTop: '8px',
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, hsl(217,91%,58%), hsl(217,91%,48%))',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 20px hsla(217,91%,60%,0.35)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
  },
  submitButtonLoading: {
    opacity: 0.75,
    cursor: 'not-allowed',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid hsla(255,255%,255%,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    fontSize: '12px',
    color: 'hsl(217, 15%, 40%)',
  },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function PaintBrushIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3.5-2 4-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
