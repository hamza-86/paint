'use client';

import React from 'react';
import ImageWithFallback from './ImageWithFallback';

export default function OwnerCard({
  name,
  role = 'Owner',
  phone,
  imageSrc,
  alt,
}) {
  return (
    <div className="owner-card" tabIndex={0} aria-label={`${name}, ${role}`}>
      <div className="owner-badge">{role}</div>
      <ImageWithFallback
        src={imageSrc}
        alt={alt || `${name} at the shop counter`}
        placeholderType="owner"
        label={name}
        className="owner-card-img"
      />
      <div className="owner-overlay">
        <div className="owner-role">{role}</div>
        <div className="owner-name">{name}</div>
        <a href={`tel:${phone.replace(/\s+/g, '')}`} className="owner-phone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 5c0 9 7 16 16 16l3-3-5-5-2 2c-3-1-5-3-6-6l2-2-5-5-3 3Z" />
          </svg>
          <span>{phone}</span>
        </a>
      </div>
    </div>
  );
}
