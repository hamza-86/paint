'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/lib/auth';
import { SHOP_IMAGES } from '@/components/public/shopConfig';

// ─── Inner form (needs searchParams — must be inside Suspense) ─────────────────

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
    <div style={s.card}>
      {/* Brand header */}
      <div style={s.header}>
        <div style={s.logoWrapper}>
          <img
            src={SHOP_IMAGES.logo}
            alt="Harun Aziz Paints & Tools Logo"
            style={s.logoImg}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = document.getElementById('login-logo-fallback');
              if (fb) fb.style.display = 'flex';
            }}
          />
          <div id="login-logo-fallback" style={{ ...s.logoCircle, display: 'none' }}>
            <PaintBrushIcon />
          </div>
        </div>
        {/* Shop name exactly as on main page */}
        <div style={s.brandName}>
          Harun Aziz Paints &amp; Tools
          <span style={s.brandSub}>Neemwadi Chowk, Malkapur · Buldhana</span>
        </div>
        <p style={s.loginLabel}>
          <span style={s.swatchDot} />
          Owner &amp; Painter Portal
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={s.errorBox} role="alert">
          <span style={s.errorIcon}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={s.form} noValidate>
        {/* Email */}
        <div style={s.fieldGroup}>
          <label htmlFor="login-email" style={s.label}>Email Address</label>
          <div style={s.inputWrapper}>
            <span style={s.inputIcon}><EmailIcon /></span>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@harunazizpaints.com"
              required
              style={s.input}
              disabled={loading}
              onFocus={(e) => {
                e.target.style.borderColor = 'hsl(14, 78%, 54%)';
                e.target.style.boxShadow = '0 0 0 3px hsla(14,78%,54%,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'hsla(30,20%,40%,0.35)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={s.fieldGroup}>
          <label htmlFor="login-password" style={s.label}>Password</label>
          <div style={s.inputWrapper}>
            <span style={s.inputIcon}><LockIcon /></span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={s.input}
              disabled={loading}
              onFocus={(e) => {
                e.target.style.borderColor = 'hsl(14, 78%, 54%)';
                e.target.style.boxShadow = '0 0 0 3px hsla(14,78%,54%,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'hsla(30,20%,40%,0.35)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={s.eyeButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading || !email || !password}
          style={{
            ...s.submitButton,
            ...(loading || !email || !password ? s.submitDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (!loading && email && password) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 32px hsla(14,78%,54%,0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px hsla(14,78%,54%,0.35)';
          }}
        >
          {loading && <span style={s.spinner} />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Footer */}
      <p style={s.footer}>
        Harun Aziz Paints &amp; Tools &middot; Owner Portal &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

// ─── Page wrapper ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main style={s.page}>
      {/* Rainbow identity strip — identical to main page */}
      <div style={s.rainbowStrip} />

      {/* Drifting brand-colour blobs */}
      <div style={s.blob1} />
      <div style={s.blob2} />
      <div style={s.blob3} />
      <div style={s.blob4} />

      {/* Floating paint drops */}
      <div style={s.drop1}><PaintDrop color="hsl(14,78%,54%)" /></div>
      <div style={s.drop2}><PaintDrop color="hsl(43,100%,48%)" /></div>
      <div style={s.drop3}><PaintDrop color="hsl(207,76%,51%)" /></div>
      <div style={s.drop4}><PaintDrop color="hsl(296,42%,47%)" /></div>

      <div
        style={{
          ...s.cardWrapper,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(28px)',
        }}
      >
        <Link href="/" style={s.backLink}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back to Shop
        </Link>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        @keyframes hap-spin      { to   { transform: rotate(360deg); } }
        @keyframes hap-strip     { 0%   { background-position: 0% 0; } 100% { background-position: 200% 0; } }
        @keyframes hap-drift1    { 0%,100% { transform: translate(0,0)    scale(1);    } 50% { transform: translate(50px,35px)   scale(1.08); } }
        @keyframes hap-drift2    { 0%,100% { transform: translate(0,0)    scale(1);    } 50% { transform: translate(-45px,55px)  scale(0.94); } }
        @keyframes hap-drift3    { 0%,100% { transform: translate(0,0)    scale(1);    } 50% { transform: translate(35px,-40px)  scale(1.06); } }
        @keyframes hap-bob       { 0%,100% { transform: translateY(0);    }             50% { transform: translateY(-14px); }    }
        #login-submit-btn:not(:disabled):active { transform: translateY(0) scale(0.97) !important; }
        @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.001ms !important; } }
      `}</style>
    </main>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
// Warm ink/terracotta palette — mirrors the public landing page exactly.

const s = {
  /* ── Page shell ── */
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    background: 'linear-gradient(160deg, hsl(25,22%,8%) 0%, hsl(20,24%,6%) 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Baloo 2', 'Inter', 'Segoe UI', system-ui, sans-serif",
  },

  /* ── Rainbow strip (matches .rainbow-strip on main page) ── */
  rainbowStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '5px',
    zIndex: 10,
    background:
      'linear-gradient(90deg,hsl(350,68%,50%),hsl(14,78%,54%),hsl(43,100%,48%),hsl(146,49%,37%),hsl(207,76%,51%),hsl(296,42%,47%),hsl(350,68%,50%))',
    backgroundSize: '200% 100%',
    animation: 'hap-strip 10s linear infinite',
  },

  /* ── Blobs ── */
  blob1: {
    position: 'absolute', top: '-140px', left: '-130px',
    width: '480px', height: '480px', borderRadius: '50%',
    background: 'hsl(14,78%,54%)', opacity: 0.15, filter: 'blur(75px)',
    pointerEvents: 'none', animation: 'hap-drift1 26s ease-in-out infinite',
  },
  blob2: {
    position: 'absolute', top: '15%', right: '-170px',
    width: '420px', height: '420px', borderRadius: '50%',
    background: 'hsl(296,42%,47%)', opacity: 0.14, filter: 'blur(75px)',
    pointerEvents: 'none', animation: 'hap-drift2 32s ease-in-out infinite',
  },
  blob3: {
    position: 'absolute', bottom: '-150px', left: '15%',
    width: '440px', height: '440px', borderRadius: '50%',
    background: 'hsl(43,100%,48%)', opacity: 0.13, filter: 'blur(75px)',
    pointerEvents: 'none', animation: 'hap-drift3 24s ease-in-out infinite',
  },
  blob4: {
    position: 'absolute', bottom: '10%', right: '8%',
    width: '300px', height: '300px', borderRadius: '50%',
    background: 'hsl(207,76%,51%)', opacity: 0.12, filter: 'blur(65px)',
    pointerEvents: 'none', animation: 'hap-drift1 30s ease-in-out infinite reverse',
  },

  /* ── Floating paint drops ── */
  drop1: {
    position: 'absolute', top: '14%', right: '10%', width: '44px',
    opacity: 0.85, animation: 'hap-bob 5s ease-in-out infinite',
    pointerEvents: 'none',
  },
  drop2: {
    position: 'absolute', top: '68%', left: '8%', width: '28px',
    opacity: 0.78, animation: 'hap-bob 5s ease-in-out infinite -1.7s',
    pointerEvents: 'none',
  },
  drop3: {
    position: 'absolute', bottom: '14%', right: '20%', width: '22px',
    opacity: 0.72, animation: 'hap-bob 5s ease-in-out infinite -3.1s',
    pointerEvents: 'none',
  },
  drop4: {
    position: 'absolute', top: '45%', left: '5%', width: '18px',
    opacity: 0.65, animation: 'hap-bob 5s ease-in-out infinite -2.4s',
    pointerEvents: 'none',
  },

  /* ── Card wrapper ── */
  cardWrapper: {
    transition: 'opacity 0.6s ease, transform 0.6s ease',
    width: '100%',
    maxWidth: '448px',
    position: 'relative',
    zIndex: 1,
  },

  /* ── Card ── */
  card: {
    background: 'hsla(24,18%,13%,0.84)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid hsla(30,50%,55%,0.14)',
    borderRadius: '22px',
    padding: '42px 38px 36px',
    boxShadow: '0 32px 90px hsla(0,0%,0%,0.55), 0 0 0 1px hsla(14,78%,54%,0.07)',
  },

  /* ── Back to shop link ── */
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: 'hsl(38, 90%, 75%)',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    marginBottom: '16px',
    padding: '7px 16px',
    borderRadius: '20px',
    background: 'hsla(24, 25%, 15%, 0.85)',
    border: '1px solid hsla(38, 70%, 55%, 0.3)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  /* ── Header / brand ── */
  header: {
    textAlign: 'center',
    marginBottom: '34px',
  },
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16px',
  },
  logoImg: {
    width: '74px',
    height: '74px',
    borderRadius: '18px',
    objectFit: 'cover',
    border: '2px solid rgba(251, 246, 236, 0.22)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px hsla(14, 78%, 54%, 0.3)',
  },
  logoCircle: {
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, hsl(14,78%,54%), hsl(43,100%,48%))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px',
    boxShadow: '0 8px 36px hsla(14,78%,54%,0.42)',
  },
  brandName: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'hsl(40,45%,96%)',
    letterSpacing: '-0.3px',
    lineHeight: 1.2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '10px',
  },
  brandSub: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'hsl(30,18%,60%)',
    letterSpacing: '0.6px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  loginLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'hsl(43,80%,65%)',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    margin: 0,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  swatchDot: {
    display: 'inline-block',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'hsl(14,78%,54%)',
    flexShrink: 0,
  },

  /* ── Error box ── */
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    background: 'hsla(350,68%,50%,0.12)',
    border: '1px solid hsla(350,68%,50%,0.28)',
    borderRadius: '10px',
    padding: '12px 15px',
    marginBottom: '22px',
    fontSize: '13.5px',
    color: 'hsl(350,80%,74%)',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  errorIcon: { flexShrink: 0, fontSize: '15px' },

  /* ── Form ── */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: {
    fontSize: '12.5px',
    fontWeight: '600',
    color: 'hsl(30,22%,68%)',
    letterSpacing: '0.3px',
    textTransform: 'uppercase',
  },

  /* ── Input ── */
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: {
    position: 'absolute',
    left: '13px',
    display: 'flex',
    alignItems: 'center',
    color: 'hsl(30,18%,52%)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 42px 12px 40px',
    background: 'hsla(24,22%,8%,0.75)',
    border: '1px solid hsla(30,20%,40%,0.35)',
    borderRadius: '11px',
    fontSize: '14px',
    color: 'hsl(40,45%,95%)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: 'hsl(30,18%,52%)',
    padding: '5px',
    borderRadius: '5px',
  },

  /* ── Submit button ── */
  submitButton: {
    marginTop: '6px',
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, hsl(14,78%,56%), hsl(43,100%,50%))',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '0.2px',
    boxShadow: '0 4px 20px hsla(14,78%,54%,0.35)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  submitDisabled: {
    opacity: 0.55,
    cursor: 'not-allowed',
  },

  /* ── Spinner ── */
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid hsla(0,0%,100%,0.35)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'hap-spin 0.7s linear infinite',
    display: 'inline-block',
    flexShrink: 0,
  },

  /* ── Footer ── */
  footer: {
    textAlign: 'center',
    marginTop: '28px',
    fontSize: '11.5px',
    color: 'hsl(30,14%,42%)',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
};

// ─── SVG icons ────────────────────────────────────────────────────────────────

function PaintBrushIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
      <path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3.5-2 4-7" />
      <path d="M14.5 17.5 4.5 15" />
    </svg>
  );
}

function PaintDrop({ color }) {
  return (
    <svg viewBox="0 0 40 52" width="100%">
      <path d="M20 2C20 2 4 24 4 36a16 16 0 0 0 32 0C36 24 20 2 20 2Z" fill={color} />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
