'use client';

import React from 'react';
import Link from 'next/link';
import ImageWithFallback from './ImageWithFallback';
import { SHOP_IMAGES } from './shopConfig';

export default function PublicNavbar() {
  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="wrap">
        <a href="#hero" className="brand" aria-label="Harun Aziz Paints & Tools Home">
          <ImageWithFallback
            src={SHOP_IMAGES.logo}
            alt="H.A Paints and Tools logo"
            placeholderType="logo"
            className="brand-logo-img"
          />
          <div className="brand-name">
            Harun Aziz Paints &amp; Tools
            <span>Malkapur, Buldhana</span>
          </div>
        </a>

        <div className="swatch-nav">
          <a href="#about">
            <i className="swatch-dot" style={{ background: 'var(--terracotta)' }} />
            <span className="label">Our Story</span>
          </a>
          <a href="#stock">
            <i className="swatch-dot" style={{ background: 'var(--blue)' }} />
            <span className="label">Products</span>
          </a>
          <a href="#gallery">
            <i className="swatch-dot" style={{ background: 'var(--green)' }} />
            <span className="label">Gallery</span>
          </a>
          <Link href="/login" className="login-btn" id="nav-login-btn">
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
