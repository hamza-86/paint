'use client';

import React from 'react';
import ImageWithFallback from './ImageWithFallback';
import { SHOP_IMAGES } from './shopConfig';

export default function AchievementSection() {
  return (
    <section className="achieve section" id="achieve">
      <div className="wrap achieve-grid">
        <ImageWithFallback
          src={SHOP_IMAGES.shopBanner2}
          alt="Harun Aziz Paints and Tools shopfront, Malkapur"
          placeholderType="achieve"
          label="Nerolac Emerging Star Dealer"
          className="achieve-photo"
        />
        <div>
          <div className="badge-row">
            <span className="badge-pill">Nerolac Emerging Star, 2020</span>
          </div>
          <h2 className="about-title">Recognised by the brands we sell</h2>
          <p style={{ fontSize: '1.02rem', lineHeight: 1.7, color: '#3B332E', maxWidth: '520px' }}>
            Harun Aziz Paints &amp; Tools was named to Nerolac's Emerging Stars Dealer Club — a mark of consistent sales and customer trust that the shop has carried forward every year since.
          </p>
        </div>
      </div>
    </section>
  );
}
