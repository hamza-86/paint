import mongoose from 'mongoose';
import RewardTier from '../models/RewardTier.js';
import RewardInventoryItem from '../models/RewardInventoryItem.js';
import Painter from '../models/Painter.js';
import Cycle from '../models/Cycle.js';
import Sale from '../models/Sale.js';

/**
 * Helper to validate point values
 */
function validatePoints(minPoints, maxPoints) {
  if (minPoints === undefined || minPoints === null || minPoints === '') {
    return 'Minimum points are required.';
  }
  if (maxPoints === undefined || maxPoints === null || maxPoints === '') {
    return 'Maximum points are required.';
  }
  const min = Number(minPoints);
  const max = Number(maxPoints);
  if (isNaN(min) || typeof min !== 'number') {
    return 'Minimum points must be a valid number.';
  }
  if (isNaN(max) || typeof max !== 'number') {
    return 'Maximum points must be a valid number.';
  }
  if (min < 0) {
    return 'Minimum points cannot be negative.';
  }
  if (max < 0) {
    return 'Maximum points cannot be negative.';
  }
  if (min > max) {
    return 'Minimum points cannot be greater than maximum points.';
  }
  return null;
}

/**
 * GET /api/reward-tiers
 * List all configured reward tiers (Admin only).
 * Supports pagination, status filtering, and sorts by minPoints ascending.
 */
export async function getRewardTiers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const total = await RewardTier.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const tiers = await RewardTier.find(filter)
      .populate('suggestedInventoryItemId', 'name remainingQty totalQty imageUrl status')
      .sort({ minPoints: 1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: tiers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('getRewardTiers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reward tiers.',
    });
  }
}

/**
 * GET /api/reward-tiers/:id
 * Retrieve a single reward tier by ID (Admin only).
 */
export async function getRewardTierById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward tier ID format.',
      });
    }

    const tier = await RewardTier.findById(id).populate(
      'suggestedInventoryItemId',
      'name remainingQty totalQty imageUrl status'
    );
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: 'Reward tier not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: tier,
    });
  } catch (error) {
    console.error('getRewardTierById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve reward tier.',
    });
  }
}

/**
 * POST /api/reward-tiers
 * Create a new reward tier (Admin only).
 * Validates range boundaries, inventory reward, and prevents overlap with active tiers.
 * Does NOT decrement inventory.
 */
export async function createRewardTier(req, res) {
  try {
    const { minPoints, maxPoints, suggestedRewardName, suggestedInventoryItemId } = req.body;

    const validationError = validatePoints(minPoints, maxPoints);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    let resolvedRewardName = suggestedRewardName ? String(suggestedRewardName).trim() : '';
    let resolvedInventoryItemId = null;

    if (suggestedInventoryItemId) {
      if (!mongoose.Types.ObjectId.isValid(suggestedInventoryItemId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid suggestedInventoryItemId format.',
        });
      }
      const invItem = await RewardInventoryItem.findById(suggestedInventoryItemId);
      if (!invItem) {
        return res.status(404).json({
          success: false,
          message: 'Selected inventory reward item not found.',
        });
      }
      if (invItem.status === 'deactivated') {
        return res.status(400).json({
          success: false,
          message: `Cannot configure tier with deactivated reward "${invItem.name}".`,
        });
      }
      if (invItem.remainingQty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot configure tier with out-of-stock reward "${invItem.name}". Available: ${invItem.remainingQty}.`,
        });
      }
      resolvedRewardName = invItem.name;
      resolvedInventoryItemId = invItem._id;
    }

    if (!resolvedRewardName) {
      return res.status(400).json({
        success: false,
        message: 'Suggested reward is required.',
      });
    }

    const min = Number(minPoints);
    const max = Number(maxPoints);

    // Overlap validation: Range [min, max] overlaps [existing.minPoints, existing.maxPoints]
    const overlapping = await RewardTier.findOne({
      status: 'active',
      maxPoints: { $gte: min },
      minPoints: { $lte: max },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `Reward tier range (${min}–${max}) overlaps with existing active tier "${overlapping.suggestedRewardName}" (${overlapping.minPoints}–${overlapping.maxPoints}).`,
      });
    }

    const tier = await RewardTier.create({
      minPoints: min,
      maxPoints: max,
      suggestedInventoryItemId: resolvedInventoryItemId,
      suggestedRewardName: resolvedRewardName,
      status: 'active',
    });

    const populated = await RewardTier.findById(tier._id).populate(
      'suggestedInventoryItemId',
      'name remainingQty totalQty imageUrl status'
    );

    return res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error('createRewardTier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create reward tier.',
    });
  }
}

/**
 * PATCH /api/reward-tiers/:id
 * Update an existing reward tier (Admin only).
 * Re-validates points, name/inventory item, and prevents range overlap with other active tiers.
 */
export async function updateRewardTier(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward tier ID format.',
      });
    }

    const tier = await RewardTier.findById(id);
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: 'Reward tier not found.',
      });
    }

    const { minPoints, maxPoints, suggestedRewardName, suggestedInventoryItemId } = req.body;

    const newMin = minPoints !== undefined ? minPoints : tier.minPoints;
    const newMax = maxPoints !== undefined ? maxPoints : tier.maxPoints;

    const validationError = validatePoints(newMin, newMax);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const min = Number(newMin);
    const max = Number(newMax);

    if (suggestedInventoryItemId !== undefined) {
      if (suggestedInventoryItemId) {
        if (!mongoose.Types.ObjectId.isValid(suggestedInventoryItemId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid suggestedInventoryItemId format.',
          });
        }
        const invItem = await RewardInventoryItem.findById(suggestedInventoryItemId);
        if (!invItem) {
          return res.status(404).json({
            success: false,
            message: 'Selected inventory reward item not found.',
          });
        }
        tier.suggestedInventoryItemId = invItem._id;
        tier.suggestedRewardName = invItem.name;
      } else {
        tier.suggestedInventoryItemId = null;
      }
    }

    if (suggestedRewardName !== undefined) {
      if (!String(suggestedRewardName).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Suggested reward cannot be empty.',
        });
      }
      tier.suggestedRewardName = String(suggestedRewardName).trim();
    }

    // Overlap validation if updating active tier
    if (tier.status === 'active') {
      const overlapping = await RewardTier.findOne({
        _id: { $ne: tier._id },
        status: 'active',
        maxPoints: { $gte: min },
        minPoints: { $lte: max },
      });

      if (overlapping) {
        return res.status(400).json({
          success: false,
          message: `Updated range (${min}–${max}) overlaps with existing active tier "${overlapping.suggestedRewardName}" (${overlapping.minPoints}–${overlapping.maxPoints}).`,
        });
      }
    }

    tier.minPoints = min;
    tier.maxPoints = max;
    await tier.save();

    const populated = await RewardTier.findById(tier._id).populate(
      'suggestedInventoryItemId',
      'name remainingQty totalQty imageUrl status'
    );

    return res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    console.error('updateRewardTier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reward tier.',
    });
  }
}

/**
 * PATCH /api/reward-tiers/:id/deactivate
 * Deactivate an existing reward tier (Admin only).
 */
export async function deactivateRewardTier(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward tier ID format.',
      });
    }

    const tier = await RewardTier.findById(id);
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: 'Reward tier not found.',
      });
    }

    tier.status = 'deactivated';
    await tier.save();

    return res.status(200).json({
      success: true,
      message: 'Reward tier deactivated successfully.',
      data: tier,
    });
  } catch (error) {
    console.error('deactivateRewardTier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate reward tier.',
    });
  }
}

/**
 * PATCH /api/reward-tiers/:id/activate
 * Reactivate an inactive reward tier (Admin only).
 * Checks that activating this tier does not overlap any currently active tiers.
 */
export async function activateRewardTier(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward tier ID format.',
      });
    }

    const tier = await RewardTier.findById(id);
    if (!tier) {
      return res.status(404).json({
        success: false,
        message: 'Reward tier not found.',
      });
    }

    // Overlap validation against other active tiers
    const overlapping = await RewardTier.findOne({
      _id: { $ne: tier._id },
      status: 'active',
      maxPoints: { $gte: tier.minPoints },
      minPoints: { $lte: tier.maxPoints },
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `Cannot activate tier (${tier.minPoints}–${tier.maxPoints}) as it overlaps with existing active tier "${overlapping.suggestedRewardName}" (${overlapping.minPoints}–${overlapping.maxPoints}).`,
      });
    }

    tier.status = 'active';
    await tier.save();

    return res.status(200).json({
      success: true,
      message: 'Reward tier activated successfully.',
      data: tier,
    });
  } catch (error) {
    console.error('activateRewardTier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate reward tier.',
    });
  }
}

/**
 * GET /api/reward-tiers/painter/:painterId
 * Calculates the CURRENT reward tier for a painter based exclusively
 * on their CURRENT ACTIVE CYCLE points. (Admin only).
 */
export async function getPainterCurrentRewardTier(req, res) {
  try {
    const { painterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(painterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid painter ID format.',
      });
    }

    const painter = await Painter.findById(painterId).select('-password');
    if (!painter) {
      return res.status(404).json({
        success: false,
        message: 'Painter not found.',
      });
    }

    const activeCycle = await Cycle.findOne({ isActive: true });

    if (!activeCycle) {
      return res.status(200).json({
        success: true,
        data: {
          painter: {
            id: String(painter._id),
            name: painter.firstName,
            status: painter.status,
          },
          cycle: null,
          currentPoints: 0,
          tier: null,
          message: 'No active reward cycle is currently running.',
        },
      });
    }

    // Calculate current cycle points for this painter
    const [salesAgg] = await Sale.aggregate([
      {
        $match: {
          painterId: new mongoose.Types.ObjectId(painterId),
          cycleId: activeCycle._id,
        },
      },
      {
        $group: {
          _id: null,
          currentPoints: { $sum: '$totalPoints' },
        },
      },
    ]);

    const currentPoints = salesAgg?.currentPoints || 0;

    // Find active tier where minPoints <= currentPoints <= maxPoints
    const matchingTier = await RewardTier.findOne({
      status: 'active',
      minPoints: { $lte: currentPoints },
      maxPoints: { $gte: currentPoints },
    });

    return res.status(200).json({
      success: true,
      data: {
        painter: {
          id: String(painter._id),
          name: painter.firstName,
          status: painter.status,
        },
        cycle: {
          id: String(activeCycle._id),
          startDate: activeCycle.startDate,
          endDate: activeCycle.endDate,
          isActive: true,
        },
        currentPoints,
        tier: matchingTier
          ? {
              id: String(matchingTier._id),
              minPoints: matchingTier.minPoints,
              maxPoints: matchingTier.maxPoints,
              suggestedRewardName: matchingTier.suggestedRewardName,
              status: matchingTier.status,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('getPainterCurrentRewardTier error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate painter reward tier.',
    });
  }
}
