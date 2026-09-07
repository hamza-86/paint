'use client';

import React from 'react';

const REVIEWS_DATA = [
  {
    quote:
      '"Got my living room shade matched exactly to a photo I showed them — no back and forth, done the same visit."',
    name: 'Customer name',
    role: 'Malkapur',
  },
  {
    quote:
      '"I\'ve been buying paint here for every house I\'ve painted in the last few years. Good stock, fair price, honest advice."',
    name: 'Customer name',
    role: 'Malkapur',
  },
  {
    quote:
      '"Holi colours, Diwali diyas, house paint — this is the one shop that has all of it ready before the season starts."',
    name: 'Customer name',
    role: 'Malkapur',
  },
];

export default function ReviewsSection() {
  return (
    <section className="reviews section" id="reviews">
      <div className="wrap">
        <span className="kicker">
          <i className="swatch-dot" style={{ background: 'var(--terracotta)' }} />
          What people say
        </span>
        <h2 className="about-title" style={{ marginBottom: '34px' }}>
          Customer voices
        </h2>

        <div className="review-grid">
          {REVIEWS_DATA.map((review, idx) => (
            <div className="review-card" key={idx}>
              <div className="stars" aria-label="5 out of 5 stars">
                ★★★★★
              </div>
              <p>{review.quote}</p>
              <div className="review-name">{review.name}</div>
              <div className="review-role">{review.role}</div>
            </div>
          ))}
        </div>

        <p className="placeholder-note">
          Sample reviews shown above — swap in real customer quotes whenever you&apos;re ready.
        </p>
      </div>
    </section>
  );
}
