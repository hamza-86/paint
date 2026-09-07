'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable Image with Fallback
 *
 * Reliably displays real images with eager loading, async decoding,
 * automatic single-retry on hydration race conditions, and an elegant
 * themed SVG placeholder when a URL is genuinely missing or broken.
 */
export default function ImageWithFallback({
  src,
  alt = '',
  className = '',
  style = {},
  placeholderType = 'photo', // 'logo' | 'owner' | 'photo' | 'gallery' | 'achieve'
  label,
  lazy = false,
  children,
}) {
  const cleanSrc = typeof src === 'string' ? src.trim() : '';
  const isPlaceholderToken = !cleanSrc || cleanSrc.startsWith('IMAGE_URL_');

  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const imgRef = useRef(null);

  useEffect(() => {
    setHasError(false);
    setRetryKey(0);
  }, [cleanSrc]);

  const handleError = (e) => {
    // If the browser already resolved dimensions, do not treat as error
    if (e?.currentTarget?.naturalWidth > 0) {
      return;
    }
    if (retryKey < 1) {
      // Retry once after a brief interval to overcome hydration or network blips
      setTimeout(() => {
        setRetryKey((k) => k + 1);
      }, 400);
    } else {
      setHasError(true);
    }
  };

  if (isPlaceholderToken || hasError) {
    if (placeholderType === 'logo') {
      return (
        <div
          className={`flex items-center justify-center font-bold text-xs tracking-wider rounded-lg select-none ${className}`}
          style={{
            background: 'linear-gradient(135deg, var(--terracotta), var(--nerolac-red))',
            color: 'var(--cream)',
            border: '1px solid rgba(251,246,236,0.15)',
            width: '42px',
            height: '42px',
            minWidth: '42px',
            ...style,
          }}
          title={alt || 'H.A Paints & Tools Logo'}
          role="img"
          aria-label={alt || 'H.A Paints & Tools Logo'}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 11V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7" />
            <path d="M19 11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3" />
            <path d="M12 14v7" />
            <path d="M9 21h6" />
          </svg>
        </div>
      );
    }

    if (placeholderType === 'owner') {
      return (
        <div
          className={`w-full h-full flex flex-col items-center justify-center gap-3 select-none text-center p-4 ${className}`}
          style={{
            background: 'linear-gradient(160deg, var(--plum), var(--ink))',
            ...style,
          }}
        >
          <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="var(--cream)" strokeWidth="1.75" className="opacity-80">
            <circle cx="32" cy="22" r="12" />
            <path d="M12 56c0-11 9-20 20-20s20 9 20 20" />
          </svg>
          <span style={{ color: 'var(--cream)', fontSize: '0.82rem', opacity: 0.85, fontWeight: 500 }}>
            {label || alt || 'Shop Owner'}
          </span>
          {children}
        </div>
      );
    }

    // Default photo / gallery / achievement placeholder
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center gap-2 select-none text-center p-3 ${className}`}
        style={{
          background: 'linear-gradient(145deg, #2a221e, #1a1310)',
          color: 'var(--cream)',
          ...style,
        }}
        role="img"
        aria-label={alt || 'Harun Aziz Paints & Tools photo'}
      >
        <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="var(--gold)" strokeWidth="1.8" className="opacity-75">
          <rect x="6" y="8" width="36" height="30" rx="4" />
          <circle cx="17" cy="18" r="4" />
          <path d="m42 32-11-11-15 15" />
        </svg>
        <span style={{ color: '#E5DACE', fontSize: '0.76rem', opacity: 0.8, maxWidth: '200px' }}>
          {label || alt || 'Harun Aziz Paints & Tools'}
        </span>
        {children}
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      key={`${cleanSrc}-${retryKey}`}
      src={cleanSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
    />
  );
}
