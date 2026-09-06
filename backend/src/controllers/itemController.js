import mongoose from 'mongoose';
import Item from '../models/Item.js';
import Sale from '../models/Sale.js';
import { uploadToCloudinary } from '../middleware/upload.js';

/**
 * Helper to escape special characters for regex safety
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/items
 * List items with pagination, search, filters, and global shop summary counts.
 * Admin only.
 */
export const getItems = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, status, category, brand } = req.query;

    const filter = {};

    // Status filter: 'active', 'deactivated', or 'all' (omit filter if 'all')
    if (status && status !== 'all') {
      if (['active', 'deactivated'].includes(status)) {
        filter.status = status;
      }
    }

    // Category filter
    if (category && category !== 'all' && category.trim()) {
      filter.category = category.trim();
    }

    // Brand filter
    if (brand && brand !== 'all' && brand.trim()) {
      filter.brand = brand.trim();
    }

    // Search filter across name, brand, and category
    if (search && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
      ];
    }

    // Execute queries and counts in parallel
    const [items, totalMatching, totalItems, activeItems, deactivatedItems] =
      await Promise.all([
        Item.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Item.countDocuments(filter),
        Item.countDocuments(),
        Item.countDocuments({ status: 'active' }),
        Item.countDocuments({ status: 'deactivated' }),
      ]);

    const totalPages = Math.ceil(totalMatching / limit) || 1;

    res.status(200).json({
      success: true,
      items: items.map((item) => item.toJSON()),
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages,
      },
      counts: {
        total: totalItems,
        active: activeItems,
        deactivated: deactivatedItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/items/meta/brands
 * Get all distinct non-empty brand names from the catalog.
 * Admin only.
 */
export const getItemBrands = async (req, res, next) => {
  try {
    const brands = await Item.distinct('brand');
    const cleanBrands = brands
      .filter((b) => typeof b === 'string' && b.trim().length > 0)
      .map((b) => b.trim())
      .sort((a, b) => a.localeCompare(b));
    const uniqueBrands = [...new Set(cleanBrands)];

    res.status(200).json({
      success: true,
      brands: uniqueBrands,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/items/meta/categories
 * Get all distinct non-empty category names from the catalog.
 * Admin only.
 */
export const getItemCategories = async (req, res, next) => {
  try {
    const categories = await Item.distinct('category');
    const cleanCategories = categories
      .filter((c) => typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim())
      .sort((a, b) => a.localeCompare(b));
    const uniqueCategories = [...new Set(cleanCategories)];

    res.status(200).json({
      success: true,
      categories: uniqueCategories,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/items/:id/sales
 * Get paginated sales history that includes this item.
 * Admin only.
 */
export const getItemSalesHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format.',
      });
    }

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const itemObjectId = new mongoose.Types.ObjectId(id);
    const filter = { 'lineItems.itemId': itemObjectId };

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('painterId', 'firstName mobile email')
        .populate('customerId', 'name mobile')
        .lean(),
      Sale.countDocuments(filter),
    ]);

    const formattedSales = sales.map((sale) => {
      const lineItem = (sale.lineItems || []).find(
        (li) => li.itemId && li.itemId.toString() === id
      );
      return {
        _id: sale._id,
        saleId: sale._id,
        date: sale.date,
        createdAt: sale.createdAt,
        painter: sale.painterId || null,
        customer: sale.customerId || null,
        billImageUrl: sale.billImageUrl || '',
        quantity: lineItem ? lineItem.quantity : 0,
        pricePerUnit: lineItem ? lineItem.pricePerUnit : 0,
        pointsPerUnit: lineItem ? lineItem.pointsPerUnit : 0,
        pointsEarned: lineItem ? lineItem.pointsEarned : 0,
        lineTotal: lineItem ? lineItem.lineTotal : 0,
        saleTotalAmount: sale.totalAmount,
        saleTotalPoints: sale.totalPoints,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      sales: formattedSales,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/items/:id
 * Retrieve a single item by its ID.
 * Admin only.
 */
export const getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format.',
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    res.status(200).json({
      success: true,
      item: item.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/items
 * Create a new catalog item.
 * Supports JSON or multipart/form-data with image file.
 * Admin only.
 */
export const createItem = async (req, res, next) => {
  try {
    let { name, price, points, brand, category, imageUrl } = req.body;

    if (typeof price === 'string' && price.trim() !== '') {
      price = Number(price);
    }
    if (typeof points === 'string' && points.trim() !== '') {
      points = Number(points);
    }

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'items');
    }

    // Field validations
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Item name is required.',
      });
    }

    if (name.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Item name cannot exceed 120 characters.',
      });
    }

    if (
      price === undefined ||
      price === null ||
      typeof price !== 'number' ||
      Number.isNaN(price) ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid price (non-negative number) is required.',
      });
    }

    if (
      points === undefined ||
      points === null ||
      typeof points !== 'number' ||
      Number.isNaN(points) ||
      !Number.isFinite(points) ||
      points < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid points value (non-negative number) is required.',
      });
    }

    const item = await Item.create({
      name: name.trim(),
      price,
      points,
      brand: brand && typeof brand === 'string' ? brand.trim() : '',
      category: category && typeof category === 'string' ? category.trim() : '',
      imageUrl: imageUrl && typeof imageUrl === 'string' ? imageUrl.trim() : '',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully.',
      item: item.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/items/:id
 * Update an existing item's details.
 * Supports JSON or multipart/form-data with image file.
 * Admin only.
 */
export const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format.',
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    let { name, price, points, brand, category, imageUrl } = req.body;

    if (typeof price === 'string' && price.trim() !== '') {
      price = Number(price);
    }
    if (typeof points === 'string' && points.trim() !== '') {
      points = Number(points);
    }

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, 'items');
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Item name cannot be empty.',
        });
      }
      if (name.trim().length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Item name cannot exceed 120 characters.',
        });
      }
      item.name = name.trim();
    }

    if (price !== undefined) {
      if (
        typeof price !== 'number' ||
        Number.isNaN(price) ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a non-negative number.',
        });
      }
      item.price = price;
    }

    if (points !== undefined) {
      if (
        typeof points !== 'number' ||
        Number.isNaN(points) ||
        !Number.isFinite(points) ||
        points < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Points must be a non-negative number.',
        });
      }
      item.points = points;
    }

    if (brand !== undefined) {
      item.brand = typeof brand === 'string' ? brand.trim() : '';
    }

    if (category !== undefined) {
      item.category = typeof category === 'string' ? category.trim() : '';
    }

    if (imageUrl !== undefined) {
      item.imageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    }

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Item updated successfully.',
      item: item.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/items/:id/deactivate
 * Soft deactivate an item (removes from active use without touching historical records).
 * Admin only.
 */
export const deactivateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format.',
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    item.status = 'deactivated';
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Item deactivated successfully.',
      item: item.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/items/:id/activate
 * Reactivate a deactivated item.
 * Admin only.
 */
export const activateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item ID format.',
      });
    }

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found.',
      });
    }

    item.status = 'active';
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Item activated successfully.',
      item: item.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};
