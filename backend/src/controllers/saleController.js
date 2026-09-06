import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import Painter from '../models/Painter.js';
import Item from '../models/Item.js';
import Cycle from '../models/Cycle.js';
import { uploadToCloudinary } from '../middleware/upload.js';

/**
 * Round to 2 decimal places to avoid floating-point drift.
 */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Parse a date value; returns a Date or null.
 */
const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// ── POST /api/sales ──────────────────────────────────────────────────────────

/**
 * Create a sale.
 *
 * Supports both JSON and multipart/form-data (with optional billFile PDF).
 * Supports both catalog items (from DB) and manual items with custom points/prices.
 */
export const createSale = async (req, res, next) => {
  try {
    let { painterId, customer, lineItems, date: rawDate, billImageUrl } = req.body;

    // Handle stringified JSON from FormData
    if (typeof customer === 'string') {
      try {
        customer = JSON.parse(customer);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid customer JSON string.' });
      }
    }
    if (typeof lineItems === 'string') {
      try {
        lineItems = JSON.parse(lineItems);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid lineItems JSON string.' });
      }
    }

    // ── 1. Find active cycle ─────────────────────────────────────────────────
    const now = new Date();
    // Auto-finalize any active cycles that have passed their endDate
    await Cycle.updateMany(
      { isActive: true, endDate: { $lte: now } },
      { $set: { isActive: false } }
    );

    const activeCycle = await Cycle.findOne({ isActive: true, endDate: { $gt: now } });
    if (!activeCycle) {
      return res.status(409).json({
        success: false,
        message:
          'No active reward cycle exists. Please create or activate a cycle before recording sales.',
      });
    }

    // ── 2. Painter validation ────────────────────────────────────────────────
    if (!painterId) {
      return res.status(400).json({ success: false, message: 'painterId is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(painterId)) {
      return res.status(400).json({ success: false, message: 'Invalid painterId format.' });
    }
    const painter = await Painter.findById(painterId);
    if (!painter) {
      return res.status(404).json({ success: false, message: 'Painter not found.' });
    }
    if (painter.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Sales cannot be recorded for a deactivated painter.',
      });
    }

    // ── 3. Customer validation ───────────────────────────────────────────────
    if (!customer || typeof customer !== 'object') {
      return res.status(400).json({ success: false, message: 'customer object is required.' });
    }
    const { name: customerName, mobile: customerMobile } = customer;
    if (!customerName || String(customerName).trim() === '') {
      return res.status(400).json({ success: false, message: 'customer.name is required.' });
    }
    if (!customerMobile || String(customerMobile).trim() === '') {
      return res.status(400).json({ success: false, message: 'customer.mobile is required.' });
    }

    // ── 4. Line items validation (catalog + manual) ──────────────────────────
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'lineItems must be a non-empty array.',
      });
    }

    const seenItemIds = new Set();
    const computedLineItems = [];
    let totalPoints = 0;
    let totalAmount = 0;

    for (let i = 0; i < lineItems.length; i++) {
      const li = lineItems[i];
      const isManual = Boolean(li.isManual || !li.itemId);

      // Quantity validation: must be a positive integer
      const qty = Number(li.quantity);
      if (
        li.quantity === undefined ||
        li.quantity === null ||
        isNaN(qty) ||
        !Number.isInteger(qty) ||
        qty < 1
      ) {
        return res.status(400).json({
          success: false,
          message: `Line item #${i + 1} quantity must be a positive integer.`,
        });
      }

      if (isManual) {
        // Manual item validation
        const itemName = li.itemName ? String(li.itemName).trim() : '';
        if (!itemName) {
          return res.status(400).json({
            success: false,
            message: `Line item #${i + 1} item name is required for manual items.`,
          });
        }

        const pricePerUnit = Number(li.pricePerUnit);
        if (
          li.pricePerUnit === undefined ||
          li.pricePerUnit === null ||
          isNaN(pricePerUnit) ||
          pricePerUnit < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `Line item #${i + 1} ("${itemName}") price per unit must be a non-negative number.`,
          });
        }

        const pointsPerUnit = Number(li.pointsPerUnit);
        if (
          li.pointsPerUnit === undefined ||
          li.pointsPerUnit === null ||
          isNaN(pointsPerUnit) ||
          pointsPerUnit < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `Line item #${i + 1} ("${itemName}") points per unit must be a non-negative number.`,
          });
        }

        const lineTotal = round2(qty * pricePerUnit);
        const pointsEarned = round2(qty * pointsPerUnit);

        totalAmount = round2(totalAmount + lineTotal);
        totalPoints = round2(totalPoints + pointsEarned);

        computedLineItems.push({
          itemId: null,
          itemName,
          isManual: true,
          quantity: qty,
          pricePerUnit,
          pointsPerUnit,
          pointsEarned,
          lineTotal,
        });
      } else {
        // Catalog item validation
        if (!mongoose.Types.ObjectId.isValid(li.itemId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid itemId format: ${li.itemId}`,
          });
        }
        if (seenItemIds.has(String(li.itemId))) {
          return res.status(400).json({
            success: false,
            message: `Duplicate itemId in line items: ${li.itemId}. Each item may only appear once per sale.`,
          });
        }
        seenItemIds.add(String(li.itemId));

        const item = await Item.findById(li.itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            message: `Item not found: ${li.itemId}`,
          });
        }
        if (item.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: `Item "${item.name}" is deactivated and cannot be added to a sale.`,
          });
        }

        const pricePerUnit = item.price;
        const pointsPerUnit = item.points;
        const lineTotal = round2(qty * pricePerUnit);
        const pointsEarned = round2(qty * pointsPerUnit);

        totalAmount = round2(totalAmount + lineTotal);
        totalPoints = round2(totalPoints + pointsEarned);

        computedLineItems.push({
          itemId: item._id,
          itemName: item.name,
          isManual: false,
          quantity: qty,
          pricePerUnit,
          pointsPerUnit,
          pointsEarned,
          lineTotal,
        });
      }
    }

    // ── 5. Sale date validation ──────────────────────────────────────────────
    let saleDate;
    if (rawDate) {
      saleDate = parseDate(rawDate);
      if (!saleDate) {
        return res.status(400).json({ success: false, message: 'Invalid sale date format.' });
      }
    } else {
      saleDate = new Date();
    }

    // Validate date is within the active cycle range (start inclusive, end inclusive)
    const cycleStart = new Date(activeCycle.startDate);
    const cycleEnd = new Date(activeCycle.endDate);
    const saleDateOnly = new Date(saleDate.getFullYear(), saleDate.getMonth(), saleDate.getDate());
    const cycleStartOnly = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate());
    const cycleEndOnly = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), cycleEnd.getDate());

    if (saleDateOnly < cycleStartOnly || saleDateOnly > cycleEndOnly) {
      return res.status(400).json({
        success: false,
        message: `Sale date (${saleDateOnly.toISOString().slice(0, 10)}) is outside the active cycle range (${cycleStartOnly.toISOString().slice(0, 10)} → ${cycleEndOnly.toISOString().slice(0, 10)}).`,
      });
    }

    // ── 6. Bill upload / URL handling ─────────────────────────────────────────
    let finalBillUrl = billImageUrl ? String(billImageUrl).trim() : '';
    if (req.file) {
      const isPdf = req.file.mimetype === 'application/pdf';
      const resourceType = isPdf ? 'raw' : 'auto';
      finalBillUrl = await uploadToCloudinary(
        req.file.buffer,
        'paint_shop/bills',
        resourceType,
        req.file.mimetype
      );
    } else if (finalBillUrl) {
      try {
        new URL(finalBillUrl);
      } catch {
        return res.status(400).json({ success: false, message: 'billImageUrl must be a valid URL.' });
      }
    }

    // ── 7. Find or create Customer ────────────────────────────────────────────
    let customerDoc = await Customer.findOne({ mobile: String(customerMobile).trim() });
    if (!customerDoc) {
      customerDoc = await Customer.create({
        name: String(customerName).trim(),
        mobile: String(customerMobile).trim(),
      });
    }

    // ── 8. Create Sale ────────────────────────────────────────────────────────
    const sale = await Sale.create({
      painterId: painter._id,
      customerId: customerDoc._id,
      cycleId: activeCycle._id,
      date: saleDate,
      billImageUrl: finalBillUrl,
      lineItems: computedLineItems,
      totalPoints,
      totalAmount,
    });

    return res.status(201).json({
      success: true,
      message: 'Sale recorded successfully.',
      data: sale.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/sales ───────────────────────────────────────────────────────────

/**
 * List sales with pagination and filters.
 *
 * Query params:
 *   page, limit, painterId, cycleId, search (customer name/mobile)
 */
export const getSales = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { painterId, cycleId, search } = req.query;
    const filter = {};

    if (painterId && mongoose.Types.ObjectId.isValid(painterId)) {
      filter.painterId = new mongoose.Types.ObjectId(painterId);
    }
    if (cycleId && mongoose.Types.ObjectId.isValid(cycleId)) {
      filter.cycleId = new mongoose.Types.ObjectId(cycleId);
    }

    // If a search term is given, match by customer mobile or name
    let customerIds;
    if (search && String(search).trim()) {
      const s = String(search).trim();
      const matchedCustomers = await Customer.find({
        $or: [
          { name: { $regex: s, $options: 'i' } },
          { mobile: { $regex: s, $options: 'i' } },
        ],
      }).select('_id');
      customerIds = matchedCustomers.map((c) => c._id);
      filter.customerId = { $in: customerIds };
    }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('painterId', 'firstName mobile email')
        .populate('customerId', 'name mobile')
        .populate('cycleId', 'startDate endDate isActive')
        .lean(),
      Sale.countDocuments(filter),
    ]);

    // Map _id to id in populated docs
    const mappedSales = sales.map((s) => ({
      ...s,
      id: String(s._id),
      painter: s.painterId ? { id: String(s.painterId._id), ...s.painterId, _id: undefined } : null,
      customer: s.customerId ? { id: String(s.customerId._id), ...s.customerId, _id: undefined } : null,
      cycle: s.cycleId ? { id: String(s.cycleId._id), ...s.cycleId, _id: undefined } : null,
      painterId: s.painterId?._id ? String(s.painterId._id) : (s.painterId ? String(s.painterId) : undefined),
      customerId: s.customerId?._id ? String(s.customerId._id) : (s.customerId ? String(s.customerId) : undefined),
      cycleId: s.cycleId?._id ? String(s.cycleId._id) : (s.cycleId ? String(s.cycleId) : undefined),
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    // Calculate summary totals across all matching sales (not just current page)
    const [summaryResult] = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSalesAmount: { $sum: '$totalAmount' },
          totalSalesPoints: { $sum: '$totalPoints' },
          totalSalesCount: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: mappedSales,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalAmount: summaryResult?.totalSalesAmount || 0,
        totalPoints: summaryResult?.totalSalesPoints || 0,
        totalCount: summaryResult?.totalSalesCount || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/sales/:id ───────────────────────────────────────────────────────

export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid sale ID format.' });
    }

    const sale = await Sale.findById(id)
      .populate('painterId', 'firstName mobile email photoUrl')
      .populate('customerId', 'name mobile')
      .populate('cycleId', 'startDate endDate isActive')
      .populate('lineItems.itemId', 'name brand category imageUrl status')
      .lean();

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found.' });
    }

    const mapped = {
      ...sale,
      id: String(sale._id),
      painter: sale.painterId ? { id: String(sale.painterId._id), ...sale.painterId, _id: undefined } : null,
      customer: sale.customerId ? { id: String(sale.customerId._id), ...sale.customerId, _id: undefined } : null,
      cycle: sale.cycleId ? { id: String(sale.cycleId._id), ...sale.cycleId, _id: undefined } : null,
      painterId: sale.painterId?._id ? String(sale.painterId._id) : (sale.painterId ? String(sale.painterId) : undefined),
      customerId: sale.customerId?._id ? String(sale.customerId._id) : (sale.customerId ? String(sale.customerId) : undefined),
      cycleId: sale.cycleId?._id ? String(sale.cycleId._id) : (sale.cycleId ? String(sale.cycleId) : undefined),
      lineItems: (sale.lineItems || []).map((li) => ({
        ...li,
        item: li.itemId ? { id: String(li.itemId._id), ...li.itemId, _id: undefined } : null,
        itemId: li.itemId?._id ? String(li.itemId._id) : (li.itemId ? String(li.itemId) : undefined),
      })),
    };

    res.status(200).json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};
