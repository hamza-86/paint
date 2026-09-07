'use client';

import React from 'react';
import OwnerCard from './OwnerCard';
import { SHOP_IMAGES } from './shopConfig';

export default function AboutSection() {
  return (
    <>
      {/* Brush stroke divider from hero */}
      <div className="brush-divider" aria-hidden="true">
        <svg viewBox="0 0 1200 64" preserveAspectRatio="none">
          <path d="M0,20 C150,60 300,0 450,24 C600,48 750,4 900,26 C1020,44 1120,10 1200,20 L1200,64 L0,64 Z" fill="#FBF6EC" />
        </svg>
      </div>

      <section className="about section" id="about">
        <div className="wrap">
          <div className="about-head">
            <span className="kicker">
              <i className="swatch-dot" style={{ background: 'var(--terracotta)' }} />
              Our story
            </span>
            <h2 className="about-title">Run by two brothers, the old-fashioned way</h2>
            <div className="about-text">
              <p>
                Tucked in Neemwadi Chowk, Malkapur, Harun Aziz Paints &amp; Tools has been the address people turn to for wall paints, hardware, and honest advice on what will actually work for their home. What started as a small counter has grown into a full-stock shop for Asian Paints and Nerolac, run today by brothers Farook and Abdullah Shivani, without losing the personal service that got it here. Beyond paint tins, the shop carries hardware essentials, wallpapers, and — every festive season — Holi colours and Diwali specials that the whole lane waits for.
              </p>
            </div>
            <div className="about-stats">
              <div className="stat">
                <b>2+</b>
                <span>generations of trust</span>
              </div>
              <div className="stat">
                <b>2</b>
                <span>major paint brands stocked</span>
              </div>
              <div className="stat">
                <b>2020</b>
                <span>Nerolac Emerging Star Dealer</span>
              </div>
            </div>
          </div>

          <div className="owner-grid">
            <OwnerCard
              name="Farook Shivani"
              role="Owner"
              phone="+91 96044 86305"
              imageSrc={SHOP_IMAGES.owner}
              alt="Farook Shivani at the shop counter"
            />
            <OwnerCard
              name="Abdullah Shivani"
              role="Owner"
              phone="+91 90751 0962"
              imageSrc={SHOP_IMAGES.abdullah}
              alt="Abdullah Shivani at the shop counter"
            />
          </div>
        </div>
      </section>
    </>
  );
}
