'use client';

import React from 'react';
import Link from 'next/link';
import ImageWithFallback from './ImageWithFallback';
import { SHOP_IMAGES } from './shopConfig';

export default function PublicFooter() {
  return (
    <footer id="contact">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <ImageWithFallback
                src={SHOP_IMAGES.logo}
                alt="H.A Paints logo"
                placeholderType="logo"
                className="footer-logo-img"
              />
              <div className="brand-name" style={{ color: 'var(--cream)' }}>
                Harun Aziz Paints &amp; Tools
              </div>
            </div>
            <p>
              Wall paints, hardware, wallpapers and festive colours — trusted in Malkapur for generations.
            </p>
            <div className="swatch-legend" aria-hidden="true">
              <div style={{ background: 'var(--terracotta)' }} />
              <div style={{ background: 'var(--plum)' }} />
              <div style={{ background: 'var(--gold)' }} />
              <div style={{ background: 'var(--nerolac-red)' }} />
              <div style={{ background: 'var(--blue)' }} />
              <div style={{ background: 'var(--green)' }} />
            </div>
          </div>

          <div>
            <h4>Visit us</h4>
            <ul>
              <li>Neemwadi Chowk</li>
              <li>Malkapur, Buldhana, Maharashtra</li>
              <li>Open all days</li>
            </ul>
          </div>

          <div>
            <h4>Quick links</h4>
            <ul>
              <li>
                <a href="#stock">Products</a>
              </li>
              <li>
                <a href="#gallery">Gallery</a>
              </li>
              <li>
                <Link href="/login" id="footer-login-link">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Harun Aziz Paints &amp; Tools, Malkapur</span>
          <span>Authorised Asian Paints &amp; Nerolac dealer</span>
        </div>
      </div>
    </footer>
  );
}
