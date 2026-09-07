/**
 * Shop Configuration & Placeholder Images
 *
 * Visual Source of Truth: harun-aziz-paints-tools-no-images.html
 *
 * Image URLs are kept as clean placeholder tokens so real URLs can be swapped in later.
 */

export const SHOP_IMAGES = {
  logo: 'IMAGE_URL_LOGO',
  interior: 'IMAGE_URL_INTERIOR',
  owner: 'IMAGE_URL_OWNER',
  abdullah: 'IMAGE_URL_ABDULLAH',
  shopBanner2: 'IMAGE_URL_SHOPBANNER2',
  storefront: 'IMAGE_URL_STOREFRONT',
  archway: 'IMAGE_URL_ARCHWAY',
  counter: 'IMAGE_URL_COUNTER',
  signage: 'IMAGE_URL_SIGNAGE',
};

export const CATALOG_DATA = {
  paints: {
    id: 'paints',
    name: 'Paints',
    iconType: 'bucket',
    companies: {
      asian: {
        label: 'Asian Paints',
        items: [
          { name: 'Apcolite Premium Emulsion, 1L', price: '₹320', hue: 200 },
          { name: 'Royale Luxury Emulsion, 1L', price: '₹680', hue: 20 },
          { name: 'Tractor Emulsion, 1L', price: '₹210', hue: 280 },
          { name: 'Ace Exterior Emulsion, 1L', price: '₹340', hue: 140 },
          { name: 'Apex Ultima Protek, 1L', price: '₹720', hue: 40 },
          { name: 'Royale Play Metallics, 1L', price: '₹1450', hue: 320 },
          { name: 'SmartCare Damp Proof, 1L', price: '₹410', hue: 0 },
          { name: 'Tractor Shyne, 1L', price: '₹240', hue: 60 },
          { name: 'WoodTech Melamyne, 1L', price: '₹560', hue: 100 },
        ],
      },
      nerolac: {
        label: 'Nerolac',
        items: [
          { name: 'Beauty Gold Interior Emulsion, 1L', price: '₹300', hue: 210 },
          { name: 'Impressions Eco Clean, 1L', price: '₹640', hue: 30 },
          { name: 'Excel Total Exterior, 1L', price: '₹380', hue: 150 },
          { name: 'Suraksha Anti-Termite Primer, 1L', price: '₹260', hue: 50 },
          { name: 'Pearl Interior Emulsion, 1L', price: '₹470', hue: 330 },
          { name: 'Nerolac Enamel Paint, 1L', price: '₹290', hue: 10 },
          { name: 'Nerolac Primer, 1L', price: '₹220', hue: 190 },
          { name: 'Nerolac WoodFin, 1L', price: '₹610', hue: 80 },
          { name: 'Nerolac Roof Guard, 1L', price: '₹520', hue: 260 },
        ],
      },
      other: {
        label: 'Other Brands',
        items: [
          { name: 'Berger Silk Luxury Emulsion, 1L', price: '₹650', hue: 220 },
          { name: 'Dulux Weathershield, 1L', price: '₹700', hue: 35 },
          { name: 'JK WallMaxX Putty, 1kg', price: '₹55', hue: 0 },
          { name: 'Birla White Putty, 1kg', price: '₹58', hue: 0 },
          { name: 'JSW Paints Emulsion, 1L', price: '₹360', hue: 170 },
          { name: 'Shalimar Superlac, 1L', price: '₹310', hue: 290 },
        ],
      },
    },
  },
  brushes: {
    id: 'brushes',
    name: 'Brushes & Rollers',
    iconType: 'brush',
    items: [
      { name: '4-inch Flat Brush', price: '₹90', hue: 20 },
      { name: '2-inch Angular Brush', price: '₹60', hue: 200 },
      { name: 'Foam Roller, 9-inch', price: '₹120', hue: 150 },
      { name: 'Fabric Roller Set', price: '₹180', hue: 280 },
      { name: 'Texture Roller', price: '₹150', hue: 40 },
      { name: 'Ceiling Brush', price: '₹75', hue: 100 },
    ],
  },
  hardware: {
    id: 'hardware',
    name: 'Hardware & Tools',
    iconType: 'tools',
    items: [
      { name: 'Door Hinges (Pair)', price: '₹45', hue: 210 },
      { name: 'Cycle Chain', price: '₹220', hue: 0 },
      { name: 'Heavy Duty Padlock', price: '₹180', hue: 50 },
      { name: 'Measuring Tape, 5m', price: '₹90', hue: 120 },
      { name: 'Screwdriver Set', price: '₹250', hue: 20 },
      { name: 'Fevicol Adhesive, 200g', price: '₹65', hue: 260 },
    ],
  },
  wallpaper: {
    id: 'wallpaper',
    name: 'Wallpaper',
    iconType: 'wallpaper',
    items: [
      { name: 'Floral Pattern Wallpaper, roll', price: '₹850', hue: 320 },
      { name: 'Textured Stone Wallpaper, roll', price: '₹950', hue: 30 },
      { name: '3D Brick Wallpaper, roll', price: '₹1050', hue: 10 },
      { name: 'Geometric Wallpaper, roll', price: '₹780', hue: 200 },
    ],
  },
  festival: {
    id: 'festival',
    name: 'Festival Colours',
    iconType: 'festival',
    items: [
      { name: 'Holi Gulal Pack, assorted', price: '₹40', hue: 330 },
      { name: 'Holi Water Colour Pouch', price: '₹25', hue: 200 },
      { name: 'Rangoli Colour Powder Set', price: '₹60', hue: 40 },
      { name: 'Diwali Diya Set, 12 pc', price: '₹120', hue: 20 },
      { name: 'Diwali Lighting String', price: '₹150', hue: 250 },
    ],
  },
};
