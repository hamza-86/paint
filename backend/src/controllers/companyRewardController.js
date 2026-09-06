import mongoose from 'mongoose';
import CompanyRewardEntry from '../models/CompanyRewardEntry.js';
import Company from '../models/Company.js';

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Helper to format date to YYYY-MM-DD string for consistent comparisons
 */
const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Check for overlapping periods for a given company.
 * Returns the overlapping entry if found, null otherwise.
 * Excludes excludeId if provided (for updates).
 */
async function findOverlap(companyId, dateFrom, dateTo, excludeId = null) {
  const filter = {
    companyId,
    dateFrom: { $lte: dateTo },
    dateTo: { $gte: dateFrom },
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return CompanyRewardEntry.findOne(filter).populate('companyId', 'name');
}

/**
 * Validate and normalize reward items array
 */
function validateRewardItems(rewardItems) {
  if (!rewardItems || !Array.isArray(rewardItems)) return null;
  for (let i = 0; i < rewardItems.length; i++) {
    const item = rewardItems[i];
    if (!item.name || typeof item.name !== 'string' || !item.name.trim()) {
      return `Reward item #${i + 1} must have a non-empty name.`;
    }
    const qty = Number(item.quantity);
    if (isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
      return `Reward item #${i + 1} quantity must be a positive integer.`;
    }
  }
  return null;
}

/**
 * Safe JSON for a populated entry
 */
function serializeEntry(entry) {
  const obj = typeof entry.toJSON === 'function' ? entry.toJSON() : entry.toObject();
  // Normalize populated company
  if (obj.companyId && typeof obj.companyId === 'object') {
    obj.company = {
      id: String(obj.companyId._id || obj.companyId.id),
      name: obj.companyId.name,
      status: obj.companyId.status,
    };
    delete obj.companyId;
  }
  return obj;
}

/**
 * GET /api/company-rewards
 * List company reward history with pagination, filters, and search.
 * Admin only.
 */
export const getCompanyRewards = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { companyId, search, dateFrom, dateTo } = req.query;

    const filter = {};

    // Company filter
    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid companyId format.',
        });
      }
      filter.companyId = new mongoose.Types.ObjectId(companyId);
    }

    // Date range filter
    if (dateFrom) {
      const from = parseDate(dateFrom);
      if (!from) {
        return res.status(400).json({ success: false, message: 'Invalid dateFrom filter.' });
      }
      filter.dateFrom = { ...filter.dateFrom, $gte: from };
    }
    if (dateTo) {
      const to = parseDate(dateTo);
      if (!to) {
        return res.status(400).json({ success: false, message: 'Invalid dateTo filter.' });
      }
      filter.dateTo = { ...filter.dateTo, $lte: to };
    }

    // Search by reward description first, then overlay company search via $or + populate
    // Build company search regex
    let companyIdsFromSearch = null;
    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      // Find matching company IDs
      const matchingCompanies = await Company.find({ name: searchRegex }).select('_id');
      companyIdsFromSearch = matchingCompanies.map((c) => c._id);

      filter.$or = [
        { rewardReceivedDescription: searchRegex },
        { 'rewardItems.name': searchRegex },
        { companyId: { $in: companyIdsFromSearch } },
      ];
    }

    // Parallel count queries
    const [entries, total, totalEntries, totalSaleValue, totalQuantitySold] = await Promise.all([
      CompanyRewardEntry.find(filter)
        .populate('companyId', 'name status')
        .sort({ dateTo: -1, dateFrom: -1 })
        .skip(skip)
        .limit(limit),
      CompanyRewardEntry.countDocuments(filter),
      CompanyRewardEntry.countDocuments({}),
      CompanyRewardEntry.aggregate([{ $group: { _id: null, total: { $sum: '$saleValue' } } }]),
      CompanyRewardEntry.aggregate([{ $group: { _id: null, total: { $sum: '$quantitySold' } } }]),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: entries.map(serializeEntry),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalEntries,
        totalSaleValue: totalSaleValue.length > 0 ? totalSaleValue[0].total : 0,
        totalQuantitySold: totalQuantitySold.length > 0 ? totalQuantitySold[0].total : 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/company-rewards/:id
 * Retrieve a single company reward history entry by ID.
 * Admin only.
 */
export const getCompanyRewardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company reward entry ID format.',
      });
    }

    const entry = await CompanyRewardEntry.findById(id).populate('companyId', 'name status');
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Company reward entry not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeEntry(entry),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/company-rewards
 * Create a new company reward history entry.
 * Admin only.
 */
export const createCompanyReward = async (req, res, next) => {
  try {
    const {
      companyId,
      dateFrom,
      dateTo,
      quantitySold,
      saleValue,
      rewardReceivedDescription,
      rewardItems,
    } = req.body;

    // Validate companyId
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company is required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ success: false, message: 'Invalid company ID format.' });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }
    if (company.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot create a reward entry for a deactivated company. Please reactivate "${company.name}" first.`,
      });
    }

    // Validate dates
    const parsedFrom = parseDate(dateFrom);
    const parsedTo = parseDate(dateTo);

    if (!parsedFrom) {
      return res.status(400).json({ success: false, message: 'dateFrom is required and must be a valid date.' });
    }
    if (!parsedTo) {
      return res.status(400).json({ success: false, message: 'dateTo is required and must be a valid date.' });
    }
    if (parsedFrom > parsedTo) {
      return res.status(400).json({ success: false, message: 'dateFrom must be on or before dateTo.' });
    }

    // Validate quantitySold
    if (quantitySold === undefined || quantitySold === null || quantitySold === '') {
      return res.status(400).json({ success: false, message: 'Quantity sold is required.' });
    }
    const qty = Number(quantitySold);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity sold must be a non-negative number.' });
    }

    // Validate saleValue
    if (saleValue === undefined || saleValue === null || saleValue === '') {
      return res.status(400).json({ success: false, message: 'Sale value is required.' });
    }
    const sale = Number(saleValue);
    if (isNaN(sale) || sale < 0) {
      return res.status(400).json({ success: false, message: 'Sale value must be a non-negative number.' });
    }

    // Validate reward items (structured)
    if (!rewardItems || !Array.isArray(rewardItems) || rewardItems.length === 0) {
      if (!rewardReceivedDescription || !String(rewardReceivedDescription).trim()) {
        return res.status(400).json({
          success: false,
          message: 'At least one reward item is required.',
        });
      }
    } else {
      const itemError = validateRewardItems(rewardItems);
      if (itemError) {
        return res.status(400).json({ success: false, message: itemError });
      }
    }

    // Check for overlapping periods for this company
    const overlap = await findOverlap(companyId, parsedFrom, parsedTo);
    if (overlap) {
      const fromStr = overlap.dateFrom.toISOString().slice(0, 10);
      const toStr = overlap.dateTo.toISOString().slice(0, 10);
      return res.status(409).json({
        success: false,
        message: `An incentive record already exists for ${company.name} during this period (${fromStr} – ${toStr}).`,
      });
    }

    const normalizedItems = Array.isArray(rewardItems)
      ? rewardItems.map((item) => ({
          name: String(item.name).trim(),
          quantity: Number(item.quantity),
          imageUrl: item.imageUrl || '',
        }))
      : [];

    let trimmedDesc = rewardReceivedDescription ? String(rewardReceivedDescription).trim() : '';
    if (!trimmedDesc && normalizedItems.length > 0) {
      trimmedDesc = normalizedItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    }

    const entry = await CompanyRewardEntry.create({
      companyId,
      dateFrom: parsedFrom,
      dateTo: parsedTo,
      quantitySold: qty,
      saleValue: sale,
      rewardReceivedDescription: trimmedDesc,
      rewardItems: normalizedItems,
    });

    const populated = await CompanyRewardEntry.findById(entry._id).populate('companyId', 'name status');

    return res.status(201).json({
      success: true,
      message: 'Company reward entry created successfully.',
      data: serializeEntry(populated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/company-rewards/:id
 * Update a company reward history entry.
 * Admin only.
 */
export const updateCompanyReward = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company reward entry ID format.',
      });
    }

    const entry = await CompanyRewardEntry.findById(id);
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Company reward entry not found.',
      });
    }

    const {
      companyId,
      dateFrom,
      dateTo,
      quantitySold,
      saleValue,
      rewardReceivedDescription,
      rewardItems,
    } = req.body;

    // Company change
    let targetCompanyId = String(entry.companyId);
    if (companyId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({ success: false, message: 'Invalid company ID format.' });
      }
      if (String(companyId) !== String(entry.companyId)) {
        const company = await Company.findById(companyId);
        if (!company) {
          return res.status(404).json({ success: false, message: 'Company not found.' });
        }
        if (company.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: `Cannot change entry to deactivated company "${company.name}".`,
          });
        }
        targetCompanyId = String(company._id);
        entry.companyId = company._id;
      }
    }

    // Dates
    let parsedFrom = entry.dateFrom;
    let parsedTo = entry.dateTo;

    if (dateFrom !== undefined) {
      const d = parseDate(dateFrom);
      if (!d) return res.status(400).json({ success: false, message: 'dateFrom must be a valid date.' });
      parsedFrom = d;
    }
    if (dateTo !== undefined) {
      const d = parseDate(dateTo);
      if (!d) return res.status(400).json({ success: false, message: 'dateTo must be a valid date.' });
      parsedTo = d;
    }
    if (parsedFrom > parsedTo) {
      return res.status(400).json({ success: false, message: 'dateFrom must be on or before dateTo.' });
    }

    // Overlap check when company or dates changed
    const dateOrCompanyChanged =
      companyId !== undefined || dateFrom !== undefined || dateTo !== undefined;

    if (dateOrCompanyChanged) {
      const overlap = await findOverlap(targetCompanyId, parsedFrom, parsedTo, entry._id);
      if (overlap) {
        const fromStr = overlap.dateFrom.toISOString().slice(0, 10);
        const toStr = overlap.dateTo.toISOString().slice(0, 10);
        const overlapCompanyName = overlap.companyId?.name || 'this company';
        return res.status(409).json({
          success: false,
          message: `An incentive record already exists for ${overlapCompanyName} during this period (${fromStr} – ${toStr}).`,
        });
      }
    }

    entry.dateFrom = parsedFrom;
    entry.dateTo = parsedTo;

    // quantitySold
    if (quantitySold !== undefined) {
      const qty = Number(quantitySold);
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ success: false, message: 'Quantity sold must be a non-negative number.' });
      }
      entry.quantitySold = qty;
    }

    // saleValue
    if (saleValue !== undefined) {
      const sale = Number(saleValue);
      if (isNaN(sale) || sale < 0) {
        return res.status(400).json({ success: false, message: 'Sale value must be a non-negative number.' });
      }
      entry.saleValue = sale;
    }

    // rewardItems
    if (rewardItems !== undefined) {
      const itemError = validateRewardItems(rewardItems);
      if (itemError) {
        return res.status(400).json({ success: false, message: itemError });
      }
      entry.rewardItems = rewardItems.map((item) => ({
        name: String(item.name).trim(),
        quantity: Number(item.quantity),
        imageUrl: item.imageUrl || '',
      }));
    }

    await entry.save();

    const populated = await CompanyRewardEntry.findById(entry._id).populate('companyId', 'name status');

    return res.status(200).json({
      success: true,
      message: 'Company reward entry updated successfully.',
      data: serializeEntry(populated),
    });
  } catch (err) {
    next(err);
  }
};
