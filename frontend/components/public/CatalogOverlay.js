'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CATALOG_DATA } from './shopConfig';

function CategoryIcon({ type }) {
  switch (type) {
    case 'bucket':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="cat-icon" aria-hidden="true">
          <rect x="14" y="6" width="20" height="14" rx="2" fill="var(--terracotta)" />
          <path d="M16 20h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V20Z" fill="var(--ink)" />
          <rect x="18" y="2" width="12" height="6" rx="1" fill="var(--gold)" />
        </svg>
      );
    case 'brush':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="cat-icon" aria-hidden="true">
          <rect x="14" y="6" width="20" height="14" rx="2" fill="var(--gold)" />
          <path d="M16 20h16v20a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4V20Z" fill="var(--ink)" />
        </svg>
      );
    case 'tools':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="cat-icon" aria-hidden="true">
          <circle cx="16" cy="32" r="8" stroke="var(--plum)" strokeWidth="3" />
          <circle cx="32" cy="16" r="8" stroke="var(--plum)" strokeWidth="3" />
          <path d="M21 27 27 21" stroke="var(--plum)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'wallpaper':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="cat-icon" aria-hidden="true">
          <rect x="6" y="6" width="36" height="36" rx="3" stroke="var(--gold)" strokeWidth="3" />
          <path d="M6 16c8-6 10 6 18 0s10 6 18 0" stroke="var(--gold)" strokeWidth="3" fill="none" />
        </svg>
      );
    case 'festival':
      return (
        <svg viewBox="0 0 48 48" fill="none" className="cat-icon" aria-hidden="true">
          <circle cx="24" cy="24" r="6" fill="var(--nerolac-red)" />
          <circle cx="10" cy="14" r="4" fill="var(--gold)" />
          <circle cx="38" cy="14" r="4" fill="var(--plum)" />
          <circle cx="10" cy="36" r="4" fill="var(--terracotta)" />
          <circle cx="38" cy="36" r="4" fill="var(--gold)" />
        </svg>
      );
    default:
      return null;
  }
}

export default function CatalogOverlay({ isOpen, onClose }) {
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentCompany, setCurrentCompany] = useState(null);
  const bodyRef = useRef(null);

  // Manage body scroll lock & Escape key
  useEffect(() => {
    if (!isOpen) {
      setCurrentCategory(null);
      setCurrentCompany(null);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (currentCategory) {
          handleBack();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentCategory, onClose]);

  const handleOpenCategory = (catId) => {
    setCurrentCategory(catId);
    const cat = CATALOG_DATA[catId];
    if (cat?.companies) {
      const firstCompanyKey = Object.keys(cat.companies)[0];
      setCurrentCompany(firstCompanyKey);
    } else {
      setCurrentCompany(null);
    }
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  };

  const handleBack = () => {
    setCurrentCategory(null);
    setCurrentCompany(null);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  };

  if (!isOpen) return null;

  const activeCategoryData = currentCategory ? CATALOG_DATA[currentCategory] : null;

  // Resolve items to render
  let itemsToRender = [];
  if (activeCategoryData) {
    if (activeCategoryData.companies && currentCompany) {
      itemsToRender = activeCategoryData.companies[currentCompany]?.items || [];
    } else {
      itemsToRender = activeCategoryData.items || [];
    }
  }

  return (
    <div
      className={`catalog ${isOpen ? 'open' : ''}`}
      id="catalogOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalogTitle"
    >
      <div className="catalog-header">
        <div className="wrap">
          <button
            type="button"
            className="catalog-back"
            id="catalogBackBtn"
            onClick={handleBack}
            style={{ visibility: currentCategory ? 'visible' : 'hidden' }}
            aria-label="Back to categories"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Categories
          </button>

          <span className="catalog-title" id="catalogTitle">
            {activeCategoryData ? activeCategoryData.name : 'What we stock'}
          </span>

          <button
            type="button"
            className="catalog-close"
            onClick={onClose}
            aria-label="Close catalog"
            id="catalogCloseBtn"
          >
            ×
          </button>
        </div>
      </div>

      <div className="catalog-body" ref={bodyRef}>
        <div className="wrap">
          {/* Category View */}
          {!currentCategory ? (
            <div id="catalogCategoryView">
              <div className="cat-tiles" id="catTiles">
                {Object.values(CATALOG_DATA).map((cat) => (
                  <div
                    key={cat.id}
                    className="cat-tile"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleOpenCategory(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleOpenCategory(cat.id);
                      }
                    }}
                  >
                    <CategoryIcon type={cat.iconType} />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Product View */
            <div id="catalogProductView">
              {activeCategoryData.companies && (
                <div className="company-row" id="companyRow" role="tablist" aria-label="Brand Companies">
                  {Object.entries(activeCategoryData.companies).map(([compKey, compData]) => {
                    const initials = compData.label
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2);
                    const isActive = compKey === currentCompany;
                    return (
                      <button
                        key={compKey}
                        type="button"
                        className={`company-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setCurrentCompany(compKey)}
                        role="tab"
                        aria-selected={isActive}
                      >
                        <span className="company-circle">{initials}</span>
                        <span className="clabel">{compData.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="product-scroll">
                {itemsToRender.length > 0 ? (
                  <div className="product-grid" id="productGrid">
                    {itemsToRender.map((item, i) => (
                      <div className="product-card" key={i}>
                        <div
                          className="product-img"
                          style={{
                            background: `linear-gradient(160deg, hsl(${item.hue},70%,60%), hsl(${item.hue},65%,40%))`,
                          }}
                        >
                          <svg viewBox="0 0 40 52" fill="none" aria-hidden="true">
                            <path d="M8 6h24v10H8z" fill="rgba(255,255,255,0.85)" />
                            <path
                              d="M10 16h20v28a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V16Z"
                              fill="rgba(34,29,26,0.55)"
                            />
                          </svg>
                        </div>
                        <div className="product-info">
                          <div className="product-name">{item.name}</div>
                          <div className="product-price">{item.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="catalog-empty">More items coming soon.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
