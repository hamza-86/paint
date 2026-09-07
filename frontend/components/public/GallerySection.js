'use client';

import React from 'react';
import ImageWithFallback from './ImageWithFallback';
import { SHOP_IMAGES } from './shopConfig';

const GALLERY_ITEMS = [
  {
    src: SHOP_IMAGES.storefront,
    alt: 'Shop storefront with paint buckets',
    caption: 'Storefront, Neemwadi Chowk',
  },
  {
    src: SHOP_IMAGES.interior,
    alt: 'Shelves stocked with paint tins',
    caption: 'Full stock, every shade',
  },
  {
    src: SHOP_IMAGES.archway,
    alt: 'Festive archway at the market entrance',
    caption: 'Festive season at the market',
  },
  {
    src: SHOP_IMAGES.counter,
    alt: 'Shop counter close-up',
    caption: 'The counter, always stocked',
  },
  {
    src: SHOP_IMAGES.owner,
    alt: 'Farook Shivani at the counter',
    caption: 'Farook, at the counter',
  },
  {
    src: SHOP_IMAGES.signage,
    alt: 'H.A Paints and Tools branded signage board',
    caption: 'Our shopfront signage',
  },
];

export default function GallerySection() {
  return (
    <section className="gallery section" id="gallery">
      <div className="wrap">
        <span className="kicker">
          <i className="swatch-dot" style={{ background: 'var(--plum)' }} />
          Around the shop
        </span>
        <h2 className="about-title" style={{ marginBottom: '34px' }}>
          A look inside
        </h2>

        <div className="gallery-scroll" tabIndex={0} aria-label="Shop photo gallery">
          {GALLERY_ITEMS.map((item, index) => (
            <div className="gallery-item" key={index}>
              <ImageWithFallback
                src={item.src}
                alt={item.alt}
                placeholderType="gallery"
                label={item.caption}
                className="gallery-item-img"
              />
              <div className="gallery-cap">{item.caption}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
