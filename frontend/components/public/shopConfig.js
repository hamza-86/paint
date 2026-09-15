/**
 * Shared branding and visual configuration for the shop.
 */

export const SHOP_INFO = {
  name: 'Harun Aziz Paints & Tools',
  shortName: 'Harun Aziz Paints & Tools',
};

export const SHOP_IMAGES = {
  logo: 'https://res.cloudinary.com/wibcunug/image/upload/v1788795789/hroon_azzi_logo.webp',
  interior: 'https://res.cloudinary.com/wibcunug/image/upload/v1788798453/unnamed.webp',
  owner: 'https://res.cloudinary.com/wibcunug/image/upload/v1788795798/unnamed_4.webp',
  abdullah: 'https://res.cloudinary.com/wibcunug/image/upload/v1788795788/ChatGPT_Image_Sep_6_2026_10_31_18_AM.png',
  shopBanner2: 'https://res.cloudinary.com/wibcunug/image/upload/v1788792253/ChatGPT_Image_Sep_6_2026_10_49_00_AM.png',
  storefront: 'https://res.cloudinary.com/wibcunug/image/upload/v1788796677/unnamed_5.webp',
  archway: 'https://res.cloudinary.com/wibcunug/image/upload/v1788796681/unnamed_3.webp',
  counter: 'https://res.cloudinary.com/wibcunug/image/upload/v1788792253/ChatGPT_Image_Sep_6_2026_10_49_00_AM.png',
  signage: 'https://res.cloudinary.com/wibcunug/image/upload/v1788792253/ChatGPT_Image_Sep_6_2026_10_49_00_AM.png',
};

export const CATEGORY_ICON_MAP = {
  paints: 'bucket',
  'brushes & rollers': 'brush',
  'hardware & tools': 'tools',
  wallpaper: 'wallpaper',
  'festival colours': 'festival',
};

export function getCategoryIconType(category) {
  if (!category || typeof category !== 'string') return 'tools';
  const normalized = category.trim().toLowerCase();
  return CATEGORY_ICON_MAP[normalized] || 'tools';
}
