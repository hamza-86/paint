'use client';

import React from 'react';

export default function StockSection() {
  return (
    <section className="stock section" id="stock">
      <div className="wrap">
        <div className="stock-head">
          <span className="kicker">
            <i className="swatch-dot" style={{ background: 'var(--plum)' }} />
            What we stock
          </span>
          <h2 className="about-title">One shop, everything the wall needs</h2>
        </div>

        <div className="stock-grid">
          {/* Card 1: Wall Paints */}
          <div className="swatch-card">
            <svg className="swatch-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="14" y="6" width="20" height="14" rx="2" fill="var(--blue)" />
              <path d="M16 20h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V20Z" fill="var(--ink)" />
              <rect x="18" y="2" width="12" height="6" rx="1" fill="var(--gold)" />
            </svg>
            <h3>Wall Paints</h3>
            <p>
              Full range of Asian Paints &amp; Nerolac — interior, exterior, primers and custom-mixed shades on the spot.
            </p>
          </div>

          {/* Card 2: Hardware & Tools */}
          <div className="swatch-card">
            <svg className="swatch-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="16" cy="32" r="8" stroke="var(--plum)" strokeWidth="3" />
              <circle cx="32" cy="16" r="8" stroke="var(--plum)" strokeWidth="3" />
              <path d="M21 27 27 21" stroke="var(--plum)" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <h3>Hardware &amp; Tools</h3>
            <p>
              Fittings, cycle parts, brushes, rollers and the everyday hardware a home or workshop keeps running back for.
            </p>
          </div>

          {/* Card 3: Wallpapers */}
          <div className="swatch-card">
            <svg className="swatch-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect x="6" y="6" width="36" height="36" rx="3" stroke="var(--gold)" strokeWidth="3" />
              <path d="M6 16c8-6 10 6 18 0s10 6 18 0" stroke="var(--gold)" strokeWidth="3" fill="none" />
            </svg>
            <h3>Wallpapers</h3>
            <p>
              Design wallpapers to finish a room paint can't — patterns and textures for feature walls, picked in-store.
            </p>
          </div>

          {/* Card 4: Festival Colours */}
          <div className="swatch-card">
            <svg className="swatch-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="6" fill="var(--nerolac-red)" />
              <circle cx="10" cy="14" r="4" fill="var(--gold)" />
              <circle cx="38" cy="14" r="4" fill="var(--blue)" />
              <circle cx="10" cy="36" r="4" fill="var(--green)" />
              <circle cx="38" cy="36" r="4" fill="var(--plum)" />
            </svg>
            <h3>Festival Colours</h3>
            <p>
              Holi gulal and colours every March, Diwali decor specials every autumn — stocked ahead of the rush.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
