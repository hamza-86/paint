'use client';

import React, { useEffect, useState, useRef } from 'react';
import { SHOP_IMAGES } from './shopConfig';

export default function HeroSection({ onOpenCatalog }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dripD, setDripD] = useState(
    'M0,0 L1200,0 L1200,600 Q1100,600 1080,560 Q1000,500 900,600 Q800,700 700,560 Q600,460 500,600 Q400,700 300,560 Q200,460 100,600 Q40,650 0,560 Z'
  );

  const dripFrames = useRef([
    'M0,0 L1200,0 L1200,600 Q1100,600 1080,560 Q1000,500 900,600 Q800,700 700,560 Q600,460 500,600 Q400,700 300,560 Q200,460 100,600 Q40,650 0,560 Z',
    'M0,0 L1200,0 L1200,260 Q1100,300 1080,220 Q1000,140 900,260 Q800,340 700,220 Q600,160 500,260 Q400,340 300,220 Q200,160 100,260 Q40,300 0,220 Z',
    'M0,0 L1200,0 L1200,40 Q1100,60 1080,30 Q1000,10 900,30 Q800,50 700,30 Q600,20 500,30 Q400,50 300,30 Q200,20 100,30 Q40,40 0,30 Z',
    'M0,0 L1200,0 L1200,0 Z',
  ]);

  const isInteriorPlaceholder =
    !SHOP_IMAGES.interior || SHOP_IMAGES.interior.startsWith('IMAGE_URL_');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setDripD(dripFrames.current[3]);
      setIsLoaded(true);
      return;
    }

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < dripFrames.current.length) {
        setDripD(dripFrames.current[step]);
      } else {
        clearInterval(interval);
      }
    }, 450);

    const loadTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);

    return () => {
      clearInterval(interval);
      clearTimeout(loadTimer);
    };
  }, []);

  return (
    <section className="hero" id="hero">
      {/* Hero Background */}
      <div
        className="hero-bg"
        style={{
          backgroundImage: isInteriorPlaceholder
            ? 'radial-gradient(ellipse at 70% 30%, rgba(142,59,143,0.35), transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(228,87,46,0.3), transparent 60%), linear-gradient(180deg, #241914 0%, #150e0c 100%)'
            : `url('${SHOP_IMAGES.interior}')`,
        }}
        aria-hidden="true"
      />
      <div className="hero-overlay" aria-hidden="true" />

      {/* Floating Paint Drops */}
      <div className="floaty floaty-1" style={{ top: '20%', right: '9%', width: '64px' }} aria-hidden="true">
        <svg viewBox="0 0 40 52" width="100%">
          <path d="M20 2C20 2 4 24 4 36a16 16 0 0 0 32 0C36 24 20 2 20 2Z" fill="var(--terracotta)" opacity="0.85" />
        </svg>
      </div>
      <div className="floaty floaty-2" style={{ top: '42%', right: '20%', width: '38px' }} aria-hidden="true">
        <svg viewBox="0 0 40 52" width="100%">
          <path d="M20 2C20 2 4 24 4 36a16 16 0 0 0 32 0C36 24 20 2 20 2Z" fill="var(--gold)" opacity="0.85" />
        </svg>
      </div>
      <div className="floaty floaty-3" style={{ top: '60%', right: '12%', width: '30px' }} aria-hidden="true">
        <svg viewBox="0 0 40 52" width="100%">
          <path d="M20 2C20 2 4 24 4 36a16 16 0 0 0 32 0C36 24 20 2 20 2Z" fill="var(--blue)" opacity="0.85" />
        </svg>
      </div>

      {/* Content */}
      <div className="hero-content">
        <div className="wrap">
          <span
            className="eyebrow-hand"
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }}
          >
            Trusted in Malkapur, since generations
          </span>

          <h1 className="hero-title" id="heroTitle">
            <span className="stroke-line">
              <span
                style={{
                  transform: isLoaded ? 'translateY(0)' : 'translateY(115%)',
                  transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                Every wall in Malkapur
              </span>
            </span>
            <span className="stroke-line">
              <span
                style={{
                  transform: isLoaded ? 'translateY(0)' : 'translateY(115%)',
                  transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.16s',
                }}
              >
                deserves this shine.
              </span>
            </span>
          </h1>

          <p
            className="hero-sub"
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.7s ease 0.3s',
            }}
          >
            Asian Paints &amp; Nerolac dealer, custom colour mixing, hardware, wallpapers, and festive Holi &amp; Diwali colours — from a shop the town has trusted for years.
          </p>

          <div
            className="hero-cta-row"
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.7s ease 0.45s',
            }}
          >
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenCatalog}
              id="hero-catalog-cta"
            >
              See what we stock
            </button>
          </div>
        </div>
      </div>

      {/* Drip SVG */}
      <svg className="drip-svg" id="dripSvg" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
        <path
          id="dripPath"
          d={dripD}
          fill="var(--plaster)"
          style={{ transition: 'd 0.7s cubic-bezier(0.6, 0, 0.3, 1)' }}
        />
      </svg>
    </section>
  );
}
