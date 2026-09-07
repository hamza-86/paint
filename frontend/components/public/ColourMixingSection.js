'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

const HUE_NAMES = [
  { max: 15, name: 'Red' },
  { max: 45, name: 'Orange' },
  { max: 65, name: 'Yellow' },
  { max: 100, name: 'Lime' },
  { max: 150, name: 'Green' },
  { max: 175, name: 'Teal' },
  { max: 200, name: 'Cyan' },
  { max: 225, name: 'Sky Blue' },
  { max: 255, name: 'Blue' },
  { max: 280, name: 'Indigo' },
  { max: 315, name: 'Purple' },
  { max: 345, name: 'Pink' },
  { max: 360, name: 'Red' },
];

function getNameForHue(hue) {
  for (const item of HUE_NAMES) {
    if (hue <= item.max) return item.name;
  }
  return 'Red';
}

export default function ColourMixingSection() {
  const [currentHue, setCurrentHue] = useState(null);
  const [label, setLabel] = useState('Hover to explore shades');
  const [isLocked, setIsLocked] = useState(false);
  const [coreBg, setCoreBg] = useState('var(--ink)');

  const wheelRef = useRef(null);
  const lockTimerRef = useRef(null);

  const calculateAngle = useCallback((clientX, clientY) => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return (deg + 90 + 360) % 360;
  }, []);

  const handlePointerMove = useCallback(
    (clientX, clientY) => {
      if (isLocked) return;
      const hue = Math.round(calculateAngle(clientX, clientY));
      setCurrentHue(hue);
      setLabel(getNameForHue(hue));
    },
    [isLocked, calculateAngle]
  );

  const handlePointerLeave = useCallback(() => {
    if (!isLocked) {
      setCurrentHue(null);
      setLabel('Hover to explore shades');
      setCoreBg('var(--ink)');
    }
  }, [isLocked]);

  const handlePick = useCallback(
    (clientX, clientY) => {
      const hue = Math.round(calculateAngle(clientX, clientY));
      const pickedName = getNameForHue(hue);
      setCurrentHue(hue);
      setIsLocked(true);
      setLabel(`You picked: ${pickedName}`);
      setCoreBg(`hsl(${hue}, 45%, 16%)`);

      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }

      lockTimerRef.current = setTimeout(() => {
        setIsLocked(false);
        setCoreBg('var(--ink)');
        setLabel('Hover to explore shades');
        setCurrentHue(null);
      }, 2200);
    },
    [calculateAngle]
  );

  useEffect(() => {
    return () => {
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <section className="mixing section" id="mixing">
        <div className="wrap">
          <div>
            <span className="kicker" style={{ color: 'var(--gold)' }}>
              <i className="swatch-dot" style={{ background: 'var(--gold)' }} />
              In-store colour lab
            </span>
            <h2>Any shade, mixed while you wait</h2>
            <p>
              Our computerised colour-matching machine mixes the exact shade you point to — off a swatch, a photo, or a wall you already love. No guessing, no repeat trips.
            </p>
            <p className="wheel-hint">
              Move your cursor around the wheel to explore shades — click to pick one.
            </p>
          </div>

          <div className="wheel-wrap">
            <div
              ref={wheelRef}
              className="wheel"
              id="colorWheel"
              role="slider"
              aria-label="Interactive color wheel"
              aria-valuenow={currentHue || 0}
              aria-valuetext={label}
              tabIndex={0}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onTouchMove={(e) => {
                if (e.touches[0]) {
                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onMouseLeave={handlePointerLeave}
              onClick={(e) => handlePick(e.clientX, e.clientY)}
              onTouchEnd={(e) => {
                if (e.changedTouches[0]) {
                  handlePick(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                  const nextHue = ((currentHue || 0) + 15) % 360;
                  setCurrentHue(nextHue);
                  setLabel(getNameForHue(nextHue));
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                  const prevHue = ((currentHue || 0) - 15 + 360) % 360;
                  setCurrentHue(prevHue);
                  setLabel(getNameForHue(prevHue));
                } else if (e.key === 'Enter' || e.key === ' ') {
                  const hue = currentHue || 0;
                  setIsLocked(true);
                  setLabel(`You picked: ${getNameForHue(hue)}`);
                  setCoreBg(`hsl(${hue}, 45%, 16%)`);
                }
              }}
            />
            <div
              className="wheel-core"
              id="wheelCore"
              style={{ background: coreBg }}
            >
              <div
                className="wheel-swatch"
                id="wheelSwatch"
                style={{
                  background:
                    currentHue !== null
                      ? `hsl(${currentHue}, 75%, 52%)`
                      : '#555',
                }}
              />
              <span id="wheelLabel">{label}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Brush stroke divider transition to achievement section */}
      <div className="brush-divider" aria-hidden="true">
        <svg viewBox="0 0 1200 64" preserveAspectRatio="none">
          <path d="M0,30 C150,0 300,58 450,26 C600,0 750,54 900,24 C1020,4 1120,44 1200,30 L1200,64 L0,64 Z" fill="#FFFFFF" />
        </svg>
      </div>
    </>
  );
}
