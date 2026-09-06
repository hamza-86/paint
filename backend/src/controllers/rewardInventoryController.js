import mongoose from 'mongoose';
import RewardInventoryItem from '../models/RewardInventoryItem.js';
import CompanyRewardEntry from '../models/CompanyRewardEntry.js';

/**
 * Escape regex special characters for safe search
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Safe serializer for inventory items
 */
function serializeInventoryItem(doc) {
  const obj = typeof doc.toJSON === 'function' ? doc.toJSON() : doc.toObject();

  // Populate source company details if populated
  if (obj.sourceCompanyRewardEntryId && typeof obj.sourceCompanyRewardEntryId === 'object') {
    const entry = obj.sourceCompanyRewardEntryId;
    let sourceRewardItem = null;

    if (entry.rewardItems && Array.isArray(entry.rewardItems) && obj.sourceCompanyRewardItemId) {
      const match = entry.rewardItems.find(
        (ri) => String(ri._id || ri.id) === String(obj.sourceCompanyRewardItemId)
      );
      if (match) {
        sourceRewardItem = {
          id: String(match._id || match.id),
          name: match.name,
          quantity: match.quantity,
          imageUrl: match.imageUrl || '',
        };
      }
    }

    let company = null;
    if (entry.companyId && typeof entry.companyId === 'object') {
      company = {
        id: String(entry.companyId._id || entry.companyId.id),
        name: entry.companyId.name,
        status: entry.companyId.status,
      };
    }

    obj.sourceReward = {
      id: String(entry._id || entry.id),
      company,
      dateFrom: entry.dateFrom,
      dateTo: entry.dateTo,
      rewardReceivedDescription: entry.rewardReceivedDescription,
      rewardItem: sourceRewardItem,
    };

    obj.sourceCompanyRewardEntryId = String(entry._id || entry.id);
  }

  // Calculated assigned quantity
  obj.assignedQty = Math.max(0, (obj.totalQty || 0) - (obj.remainingQty || 0));

  return obj;
}

/**
 * GET /api/reward-inventory
 * List reward inventory items with pagination, filters, and search.
 * Admin only.
 */
export const getRewardInventory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, status, companyId, availability } = req.query;

    const filter = {};

    // Status filter (active, deactivated, or all)
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Search by reward name
    if (search && search.trim()) {
      filter.name = new RegExp(escapeRegex(search.trim()), 'i');
    }

    // Availability filter
    if (availability === 'available') {
      filter.remainingQty = { $gt: 0 };
    } else if (availability === 'fullyAssigned') {
      filter.remainingQty = { $lte: 0 };
    }

    // Source Company filter
    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid companyId format.',
        });
      }
      const matchingEntries = await CompanyRewardEntry.find({
        companyId: new mongoose.Types.ObjectId(companyId),
      }).select('_id');
      const entryIds = matchingEntries.map((e) => e._id);
      filter.sourceCompanyRewardEntryId = { $in: entryIds };
    }

    // Parallel queries for data and summary metrics
    const [items, total, totalItems, totals] = await Promise.all([
      RewardInventoryItem.find(filter)
        .populate({
          path: 'sourceCompanyRewardEntryId',
          populate: { path: 'companyId', select: 'name status' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RewardInventoryItem.countDocuments(filter),
      RewardInventoryItem.countDocuments(),
      RewardInventoryItem.aggregate([
        {
          $group: {
            _id: null,
            totalQty: { $sum: '$totalQty' },
            totalRemaining: { $sum: '$remainingQty' },
          },
        },
      ]),
    ]);

    const totalQuantity = totals[0]?.totalQty || 0;
    const totalRemainingQuantity = totals[0]?.totalRemaining || 0;
    const totalAssignedQuantity = Math.max(0, totalQuantity - totalRemainingQuantity);
    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: items.map(serializeInventoryItem),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalInventoryItems: totalItems,
        totalQuantity,
        totalRemainingQuantity,
        totalAssignedQuantity,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reward-inventory/:id
 * Retrieve a single reward inventory item.
 * Admin only.
 */
export const getRewardInventoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward inventory item ID format.',
      });
    }

    const item = await RewardInventoryItem.findById(id).populate({
      path: 'sourceCompanyRewardEntryId',
      populate: { path: 'companyId', select: 'name status' },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Reward inventory item not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeInventoryItem(item),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/reward-inventory
 * Create a new reward inventory item from a source company reward entry item.
 * Admin only.
 */
export const createRewardInventory = async (req, res, next) => {
  try {
    const {
      sourceCompanyRewardEntryId,
      sourceCompanyRewardItemId,
      name,
      imageUrl,
      totalQty,
      remainingQty,
    } = req.body;

    // 1. Validate sourceCompanyRewardEntryId
    if (!sourceCompanyRewardEntryId) {
      return res.status(400).json({
        success: false,
        message: 'sourceCompanyRewardEntryId is required.',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(sourceCompanyRewardEntryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sourceCompanyRewardEntryId format.',
      });
    }

    const sourceEntry = await CompanyRewardEntry.findById(sourceCompanyRewardEntryId).populate(
      'companyId',
      'name status'
    );
    if (!sourceEntry) {
      return res.status(404).json({
        success: false,
        message: 'Source company reward entry not found.',
      });
    }

    // 2. Validate sourceCompanyRewardItemId
    if (!sourceCompanyRewardItemId) {
      return res.status(400).json({
        success: false,
        message: 'sourceCompanyRewardItemId is required.',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(sourceCompanyRewardItemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sourceCompanyRewardItemId format.',
      });
    }

    const sourceRewardItem = sourceEntry.rewardItems?.id(sourceCompanyRewardItemId);
    if (!sourceRewardItem) {
      return res.status(400).json({
        success: false,
        message: 'Referenced reward item not found in the source company reward entry.',
      });
    }

    // 3. Validate totalQty
    if (totalQty === undefined || totalQty === null || totalQty === '') {
      return res.status(400).json({
        success: false,
        message: 'Total quantity is required.',
      });
    }
    const parsedTotalQty = Number(totalQty);
    if (isNaN(parsedTotalQty) || !Number.isInteger(parsedTotalQty) || parsedTotalQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Total quantity must be a positive integer (minimum 1).',
      });
    }

    // 4. Validate remainingQty
    let parsedRemainingQty = parsedTotalQty;
    if (remainingQty !== undefined && remainingQty !== null && remainingQty !== '') {
      parsedRemainingQty = Number(remainingQty);
      if (
        isNaN(parsedRemainingQty) ||
        !Number.isInteger(parsedRemainingQty) ||
        parsedRemainingQty < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Remaining quantity must be a non-negative integer.',
        });
      }
      if (parsedRemainingQty > parsedTotalQty) {
        return res.status(400).json({
          success: false,
          message: 'Remaining quantity cannot exceed total quantity.',
        });
      }
    }

    // 5. Validate name
    const finalName = (name !== undefined ? String(name).trim() : sourceRewardItem.name).trim();
    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Reward item name cannot be blank.',
      });
    }
    if (finalName.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Reward item name cannot exceed 120 characters.',
      });
    }

    // 6. Over-allocation check against source reward item quantity
    const existingAllocations = await RewardInventoryItem.find({
      sourceCompanyRewardEntryId,
      sourceCompanyRewardItemId,
    });
    const alreadyAllocated = existingAllocations.reduce((sum, item) => sum + item.totalQty, 0);
    const availableSourceQty = sourceRewardItem.quantity - alreadyAllocated;

    if (parsedTotalQty > availableSourceQty) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${parsedTotalQty}) exceeds available source reward quantity (${availableSourceQty}). Original received: ${sourceRewardItem.quantity}, already in inventory: ${alreadyAllocated}.`,
      });
    }

    // 7. Create inventory item
    const newItem = await RewardInventoryItem.create({
      name: finalName,
      imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : sourceRewardItem.imageUrl || '',
      sourceCompanyRewardEntryId,
      sourceCompanyRewardItemId,
      totalQty: parsedTotalQty,
      remainingQty: parsedRemainingQty,
      status: 'active',
    });

    const populated = await RewardInventoryItem.findById(newItem._id).populate({
      path: 'sourceCompanyRewardEntryId',
      populate: { path: 'companyId', select: 'name status' },
    });

    return res.status(201).json({
      success: true,
      message: 'Reward inventory item created successfully.',
      data: serializeInventoryItem(populated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/reward-inventory/:id
 * Update metadata and safe quantities of a reward inventory item.
 * Admin only.
 */
export const updateRewardInventory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward inventory item ID format.',
      });
    }

    const item = await RewardInventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Reward inventory item not found.',
      });
    }

    const { name, imageUrl, totalQty, remainingQty } = req.body;

    // Metadata: name
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Reward item name cannot be blank.',
        });
      }
      if (trimmedName.length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Reward item name cannot exceed 120 characters.',
        });
      }
      item.name = trimmedName;
    }

    // Metadata: imageUrl
    if (imageUrl !== undefined) {
      item.imageUrl = String(imageUrl).trim();
    }

    const currentAssignedQty = Math.max(0, item.totalQty - item.remainingQty);

    // Quantity update: totalQty
    if (totalQty !== undefined) {
      const parsedTotal = Number(totalQty);
      if (isNaN(parsedTotal) || !Number.isInteger(parsedTotal) || parsedTotal < 1) {
        return res.status(400).json({
          success: false,
          message: 'Total quantity must be a positive integer (minimum 1).',
        });
      }

      // Cannot reduce totalQty below already assigned quantity
      if (parsedTotal < currentAssignedQty) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total quantity (${parsedTotal}) below already assigned quantity (${currentAssignedQty}).`,
        });
      }

      // Check against source reward item quantity
      const sourceEntry = await CompanyRewardEntry.findById(item.sourceCompanyRewardEntryId);
      if (sourceEntry) {
        const sourceRewardItem = sourceEntry.rewardItems?.id(item.sourceCompanyRewardItemId);
        if (sourceRewardItem) {
          const otherAllocations = await RewardInventoryItem.find({
            sourceCompanyRewardEntryId: item.sourceCompanyRewardEntryId,
            sourceCompanyRewardItemId: item.sourceCompanyRewardItemId,
            _id: { $ne: item._id },
          });
          const otherAllocated = otherAllocations.reduce((sum, it) => sum + it.totalQty, 0);
          if (otherAllocated + parsedTotal > sourceRewardItem.quantity) {
            const availableForThis = sourceRewardItem.quantity - otherAllocated;
            return res.status(400).json({
              success: false,
              message: `New total quantity (${parsedTotal}) exceeds available source reward limit (${availableForThis}).`,
            });
          }
        }
      }

      // Adjust remainingQty preserving current assigned quantity
      item.remainingQty = parsedTotal - currentAssignedQty;
      item.totalQty = parsedTotal;
    }

    // Remaining quantity update (if explicitly provided)
    if (remainingQty !== undefined && totalQty === undefined) {
      const parsedRemaining = Number(remainingQty);
      if (
        isNaN(parsedRemaining) ||
        !Number.isInteger(parsedRemaining) ||
        parsedRemaining < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Remaining quantity must be a non-negative integer.',
        });
      }
      if (parsedRemaining > item.totalQty) {
        return res.status(400).json({
          success: false,
          message: 'Remaining quantity cannot exceed total quantity.',
        });
      }
      item.remainingQty = parsedRemaining;
    }

    await item.save();

    const populated = await RewardInventoryItem.findById(item._id).populate({
      path: 'sourceCompanyRewardEntryId',
      populate: { path: 'companyId', select: 'name status' },
    });

    return res.status(200).json({
      success: true,
      message: 'Reward inventory item updated successfully.',
      data: serializeInventoryItem(populated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/reward-inventory/:id/deactivate
 * Deactivate a reward inventory item.
 * Admin only.
 */
export const deactivateRewardInventory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward inventory item ID format.',
      });
    }

    const item = await RewardInventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Reward inventory item not found.',
      });
    }

    item.status = 'deactivated';
    await item.save();

    const populated = await RewardInventoryItem.findById(item._id).populate({
      path: 'sourceCompanyRewardEntryId',
      populate: { path: 'companyId', select: 'name status' },
    });

    return res.status(200).json({
      success: true,
      message: 'Reward inventory item deactivated successfully.',
      data: serializeInventoryItem(populated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/reward-inventory/:id/activate
 * Reactivate a reward inventory item.
 * Admin only.
 */
export const activateRewardInventory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward inventory item ID format.',
      });
    }

    const item = await RewardInventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Reward inventory item not found.',
      });
    }

    item.status = 'active';
    await item.save();

    const populated = await RewardInventoryItem.findById(item._id).populate({
      path: 'sourceCompanyRewardEntryId',
      populate: { path: 'companyId', select: 'name status' },
    });

    return res.status(200).json({
      success: true,
      message: 'Reward inventory item activated successfully.',
      data: serializeInventoryItem(populated),
    });
  } catch (err) {
    next(err);
  }
};
