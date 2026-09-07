'use client';

import React, { useState } from 'react';
import PublicNavbar from './PublicNavbar';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import StockSection from './StockSection';
import ColourMixingSection from './ColourMixingSection';
import AchievementSection from './AchievementSection';
import GallerySection from './GallerySection';
import ReviewsSection from './ReviewsSection';
import PublicFooter from './PublicFooter';
import CatalogOverlay from './CatalogOverlay';

export default function PublicHomePage() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <div className="public-home">
      {/* Rainbow Identity Strip */}
      <div className="rainbow-strip" aria-hidden="true" />

      {/* Flowing Paint Background Layer (fixed, whole page) */}
      <div className="paint-bg" aria-hidden="true">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
        <div className="blob blob4" />
      </div>

      {/* Main Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <main id="main-content">
        <HeroSection onOpenCatalog={() => setIsCatalogOpen(true)} />

        {/* About / Owners Section */}
        <AboutSection />

        {/* Products / Stock Section */}
        <StockSection />

        {/* Colour Mixing Section */}
        <ColourMixingSection />

        {/* Achievement Section */}
        <AchievementSection />

        {/* Gallery Section */}
        <GallerySection />

        {/* Reviews Section */}
        <ReviewsSection />
      </main>

      {/* Public Footer */}
      <PublicFooter />

      {/* Full-screen Interactive Catalog Overlay */}
      <CatalogOverlay
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />
    </div>
  );
}
