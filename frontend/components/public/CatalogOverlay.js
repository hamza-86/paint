'use client';

import React, { useState, useEffect, useRef } from 'react';
import ImageWithFallback from './ImageWithFallback';
import { getCategoryIconType } from './shopConfig';

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
      return (
        <svg viewBox="0 0 48 48" fill="none" className="cat-icon" aria-hidden="true">
          <rect x="8" y="10" width="32" height="28" rx="6" fill="var(--terracotta)" opacity="0.9" />
          <path d="M16 18h16M16 24h16M16 30h10" stroke="var(--cream)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}

const formatPrice = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const buildCatalogFromItems = (items = []) => {
  const categoryMap = new Map();

  items.forEach((item) => {
    if (!item || !item.category || !item.name) return;

    const category = String(item.category).trim();
    const brand = String(item.brand || 'Other').trim() || 'Other';

    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        name: category,
        iconType: getCategoryIconType(category),
        brands: new Map(),
      });
    }

    const categoryEntry = categoryMap.get(category);
    if (!categoryEntry.brands.has(brand)) {
      categoryEntry.brands.set(brand, []);
    }

    categoryEntry.brands.get(brand).push({
      ...item,
      price: Number(item.price) || 0,
      imageUrl: item.imageUrl || '',
    });
  });

  return [...categoryMap.values()].map((categoryEntry) => ({
    id: categoryEntry.name,
    name: categoryEntry.name,
    iconType: categoryEntry.iconType,
    brands: [...categoryEntry.brands.entries()].map(([brandName, brandItems]) => ({
      name: brandName,
      items: brandItems,
    })),
  }));
};

export default function CatalogOverlay({ isOpen, onClose }) {
  const [catalog, setCatalog] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentCategory(null);
      setCurrentBrand(null);
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

  useEffect(() => {
    if (!isOpen) return;

    const loadCatalog = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/backend/items/public', { cache: 'no-store' });
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data?.items || []);

        if (!response.ok || (!Array.isArray(data) && !data?.success)) {
          throw new Error(data?.message || 'Unable to load products right now.');
        }

        const nextCatalog = buildCatalogFromItems(items);
        setCatalog(nextCatalog);
        setCurrentCategory(null);
        setCurrentBrand(null);
      } catch (fetchError) {
        setCatalog([]);
        setError(fetchError?.message || 'Unable to load products right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, [isOpen]);

  const handleOpenCategory = (categoryName) => {
    setCurrentCategory(categoryName);
    const categoryData = catalog.find((cat) => cat.name === categoryName);
    const firstBrand = categoryData?.brands?.[0]?.name || null;
    setCurrentBrand(firstBrand);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  };

  const handleBack = () => {
    setCurrentCategory(null);
    setCurrentBrand(null);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  };

  if (!isOpen) return null;

  const activeCategoryData = currentCategory
    ? catalog.find((item) => item.name === currentCategory) || null
    : null;

  const activeBrandData = activeCategoryData?.brands?.find((brand) => brand.name === currentBrand) || null;
  const itemsToRender = activeBrandData?.items || [];

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
          {!currentCategory ? (
            <div id="catalogCategoryView">
              {loading ? (
                <div className="catalog-empty">
                  <div className="catalog-loading">Loading products…</div>
                </div>
              ) : error ? (
                <div className="catalog-empty">
                  <div>{error}</div>
                  <button type="button" className="catalog-retry" onClick={() => window.location.reload()}>
                    Retry
                  </button>
                </div>
              ) : catalog.length === 0 ? (
                <div className="catalog-empty">No products are currently available.</div>
              ) : (
                <div className="cat-tiles" id="catTiles">
                  {catalog.map((cat) => (
                    <div
                      key={cat.id}
                      className="cat-tile"
                      tabIndex={0}
                      role="button"
                      onClick={() => handleOpenCategory(cat.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleOpenCategory(cat.name);
                        }
                      }}
                    >
                      <CategoryIcon type={cat.iconType} />
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div id="catalogProductView">
              {activeCategoryData?.brands?.length ? (
                <div className="company-row" id="companyRow" role="tablist" aria-label="Brand selection">
                  {activeCategoryData.brands.map((brand) => {
                    const initials = brand.name
                      .split(' ')
                      .map((word) => word[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    const isActive = brand.name === currentBrand;

                    return (
                      <button
                        key={brand.name}
                        type="button"
                        className={`company-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setCurrentBrand(brand.name)}
                        role="tab"
                        aria-selected={isActive}
                      >
                        <span className="company-circle">{initials || 'BR'}</span>
                        <span className="clabel">{brand.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="catalog-empty">No products available in this category right now.</div>
              )}

              <div className="product-scroll">
                {itemsToRender.length > 0 ? (
                  <div className="product-grid" id="productGrid">
                    {itemsToRender.map((item, index) => (
                      <div className="product-card" key={`${item._id || item.name}-${index}`}>
                        <div className="product-img" style={{ background: `linear-gradient(160deg, #f0d6ba, #c77a3d)` }}>
                          <ImageWithFallback
                            src={item.imageUrl}
                            alt={item.name}
                            placeholderType="photo"
                            className="product-image"
                          />
                        </div>
                        <div className="product-info">
                          <div className="product-name">{item.name}</div>
                          <div className="product-price">{formatPrice(item.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeCategoryData?.brands?.length ? (
                  <div className="catalog-empty">No products available for this brand right now.</div>
                ) : (
                  <div className="catalog-empty">No products are currently available.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
