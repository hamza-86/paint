import mongoose from 'mongoose';
import Painter from '../models/Painter.js';
import Sale from '../models/Sale.js';
import Cycle from '../models/Cycle.js';
import RewardTier from '../models/RewardTier.js';
import PainterRewardAssignment from '../models/PainterRewardAssignment.js';
import Customer from '../models/Customer.js';
import RewardInventoryItem from '../models/RewardInventoryItem.js';

/**
 * Utility to validate MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Standard error factory
 */
function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Aggregate sales for a painter in a specific cycle.
 * Calculates totalPoints, totalAmount, and totalSales count.
 */
async function getPainterCycleStats(painterId, cycleId) {
  if (!cycleId) return { totalPoints: 0, totalAmount: 0, totalSales: 0 };

  const agg = await Sale.aggregate([
    {
      $match: {
        painterId: new mongoose.Types.ObjectId(painterId),
        cycleId: new mongoose.Types.ObjectId(cycleId),
      },
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$totalPoints' },
        totalAmount: { $sum: '$totalAmount' },
        totalSales: { $sum: 1 },
      },
    },
  ]);

  return agg.length > 0
    ? {
        totalPoints: agg[0].totalPoints || 0,
        totalAmount: agg[0].totalAmount || 0,
        totalSales: agg[0].totalSales || 0,
      }
    : { totalPoints: 0, totalAmount: 0, totalSales: 0 };
}

/**
 * Find the best matching active RewardTier for a given point total.
 */
async function findMatchingTier(points) {
  if (typeof points !== 'number' || points < 0) return null;
  const tier = await RewardTier.findOne({
    status: 'active',
    minPoints: { $lte: points },
    maxPoints: { $gte: points },
  }).sort({ minPoints: -1 });

  return tier || null;
}

/**
 * Find the next tier above current points to calculate points needed.
 */
async function findNextTier(points) {
  const nextTier = await RewardTier.findOne({
    status: 'active',
    minPoints: { $gt: points },
  }).sort({ minPoints: 1 });

  return nextTier || null;
}

// ── GET /api/painter-portal/me ────────────────────────────────────────────────

export async function getMe(req, res, next) {
  try {
    const painter = req.painter;
    if (!painter) return next(createError('Painter not found', 404));

    // Resolve current cycle safely
    let currentCycle = null;
    if (painter.currentCycleId) {
      const cycleDoc = await Cycle.findById(painter.currentCycleId);
      if (cycleDoc) {
        currentCycle = {
          id: String(cycleDoc._id),
          startDate: cycleDoc.startDate,
          endDate: cycleDoc.endDate,
          isActive: cycleDoc.isActive,
        };
      }
    }

    if (!currentCycle) {
      const activeCycle = await Cycle.findOne({ isActive: true });
      if (activeCycle) {
        currentCycle = {
          id: String(activeCycle._id),
          startDate: activeCycle.startDate,
          endDate: activeCycle.endDate,
          isActive: activeCycle.isActive,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: String(painter._id),
        firstName: painter.firstName,
        mobile: painter.mobile,
        email: painter.email,
        photoUrl: painter.photoUrl || '',
        status: painter.status,
        currentCycle,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-portal/dashboard ─────────────────────────────────────────

export async function getDashboard(req, res, next) {
  try {
    const painter = req.painter;
    const painterId = painter._id;

    // 1. Resolve active cycle
    const activeCycle = await Cycle.findOne({ isActive: true });

    let currentCycleData = null;
    let currentPoints = 0;
    let totalSalesInCycle = 0;
    let totalSalesValueInCycle = 0;

    if (activeCycle) {
      const stats = await getPainterCycleStats(painterId, activeCycle._id);
      currentPoints = stats.totalPoints;
      totalSalesInCycle = stats.totalSales;
      totalSalesValueInCycle = stats.totalAmount;

      currentCycleData = {
        id: String(activeCycle._id),
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
        isActive: activeCycle.isActive,
        points: currentPoints,
      };
    }

    // 2. Reward Eligibility
    const qualifyingTier = await findMatchingTier(currentPoints);
    const nextTier = await findNextTier(currentPoints);

    const rewardEligibility = {
      eligible: Boolean(qualifyingTier),
      points: currentPoints,
      tier: qualifyingTier
        ? {
            id: String(qualifyingTier._id),
            minPoints: qualifyingTier.minPoints,
            maxPoints: qualifyingTier.maxPoints,
            suggestedRewardName: qualifyingTier.suggestedRewardName,
          }
        : null,
      suggestedRewardName: qualifyingTier ? qualifyingTier.suggestedRewardName : null,
      nextTier: nextTier
        ? {
            minPoints: nextTier.minPoints,
            pointsNeeded: Math.max(0, nextTier.minPoints - currentPoints),
            suggestedRewardName: nextTier.suggestedRewardName,
          }
        : null,
    };

    // 3. Total rewards received (physical assignments) across all time
    const [totalRewardsCount, recentSalesDocs, recentAssignmentsDocs] = await Promise.all([
      PainterRewardAssignment.countDocuments({ painterId }),
      Sale.find({ painterId })
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .populate('customerId', 'name mobile')
        .populate('cycleId', 'startDate endDate isActive'),
      PainterRewardAssignment.find({ painterId })
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .populate('cycleId', 'startDate endDate isActive')
        .populate('rewardInventoryItemId', 'imageUrl'),
    ]);

    // Format recent sales
    const recentSales = recentSalesDocs.map((s) => ({
      id: String(s._id),
      date: s.date,
      customer: s.customerId
        ? {
            id: String(s.customerId._id || s.customerId),
            name: s.customerId.name || 'Customer',
            mobile: s.customerId.mobile || '',
          }
        : null,
      lineItems: (s.lineItems || []).map((li) => ({
        itemId: String(li.itemId),
        itemName: li.itemName,
        quantity: li.quantity,
        pricePerUnit: li.pricePerUnit,
        pointsPerUnit: li.pointsPerUnit,
        pointsEarned: li.pointsEarned,
        lineTotal: li.lineTotal,
      })),
      totalAmount: s.totalAmount,
      totalPoints: s.totalPoints,
      billImageUrl: s.billImageUrl || '',
      cycle: s.cycleId
        ? {
            id: String(s.cycleId._id || s.cycleId),
            startDate: s.cycleId.startDate,
            endDate: s.cycleId.endDate,
            isActive: s.cycleId.isActive,
          }
        : null,
    }));

    // Format recent rewards
    const recentRewards = recentAssignmentsDocs.map((a) => ({
      id: String(a._id),
      rewardName: a.rewardName,
      qty: a.qty,
      date: a.date,
      pointsAtAssignment: a.pointsAtAssignment,
      suggestedTierName: a.suggestedTierName || '',
      notes: a.notes || '',
      imageUrl: a.rewardInventoryItemId?.imageUrl || '',
      cycle: a.cycleId
        ? {
            id: String(a.cycleId._id || a.cycleId),
            startDate: a.cycleId.startDate,
            endDate: a.cycleId.endDate,
            isActive: a.cycleId.isActive,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        painter: {
          id: String(painter._id),
          firstName: painter.firstName,
          mobile: painter.mobile,
          email: painter.email,
          photoUrl: painter.photoUrl || '',
          status: painter.status,
        },
        currentCycle: currentCycleData,
        currentPoints,
        totalSales: totalSalesInCycle,
        totalSalesValue: totalSalesValueInCycle,
        rewardEligibility,
        suggestedReward: qualifyingTier ? qualifyingTier.suggestedRewardName : null,
        totalRewardsReceived: totalRewardsCount,
        recentSales,
        recentRewards,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-portal/sales ─────────────────────────────────────────────

export async function getSales(req, res, next) {
  try {
    const painterId = req.painter._id;
    const { page = 1, limit = 20, cycleId, startDate, endDate } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // CRITICAL: Painter ID is strictly locked to authenticated user
    const filter = { painterId };

    // Optional cycle filtering
    if (cycleId) {
      if (!isValidObjectId(cycleId)) {
        return next(createError('Invalid cycleId format', 400));
      }
      filter.cycleId = new mongoose.Types.ObjectId(cycleId);
    }

    // Optional date range filtering
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        const sDate = new Date(startDate);
        if (isNaN(sDate.getTime())) return next(createError('Invalid startDate format', 400));
        filter.date.$gte = sDate;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        if (isNaN(eDate.getTime())) return next(createError('Invalid endDate format', 400));
        filter.date.$lte = eDate;
      }
    }

    const [sales, total] = await Promise.all([
      Sale.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('customerId', 'name mobile')
        .populate('cycleId', 'startDate endDate isActive'),
      Sale.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    const safeSales = sales.map((s) => ({
      id: String(s._id),
      date: s.date,
      customer: s.customerId
        ? {
            id: String(s.customerId._id || s.customerId),
            name: s.customerId.name || 'Customer',
            mobile: s.customerId.mobile || '',
          }
        : null,
      lineItems: (s.lineItems || []).map((li) => ({
        itemId: String(li.itemId),
        itemName: li.itemName,
        quantity: li.quantity,
        pricePerUnit: li.pricePerUnit,
        pointsPerUnit: li.pointsPerUnit,
        pointsEarned: li.pointsEarned,
        lineTotal: li.lineTotal,
      })),
      totalAmount: s.totalAmount,
      totalPoints: s.totalPoints,
      billImageUrl: s.billImageUrl || '',
      cycle: s.cycleId
        ? {
            id: String(s.cycleId._id || s.cycleId),
            startDate: s.cycleId.startDate,
            endDate: s.cycleId.endDate,
            isActive: s.cycleId.isActive,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        sales: safeSales,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-portal/eligibility ────────────────────────────────────────

export async function getEligibility(req, res, next) {
  try {
    const painterId = req.painter._id;

    // 1. Resolve active cycle
    const activeCycle = await Cycle.findOne({ isActive: true });
    if (!activeCycle) {
      return res.status(200).json({
        success: true,
        data: {
          currentPoints: 0,
          eligible: false,
          tier: null,
          suggestedRewardName: null,
          currentCycle: null,
          message: 'No active reward cycle currently running.',
        },
      });
    }

    // 2. Compute current cycle points
    const stats = await getPainterCycleStats(painterId, activeCycle._id);
    const currentPoints = stats.totalPoints;

    // 3. Find matching tier & next tier
    const matchingTier = await findMatchingTier(currentPoints);
    const nextTier = await findNextTier(currentPoints);

    res.status(200).json({
      success: true,
      data: {
        currentPoints,
        eligible: Boolean(matchingTier),
        tier: matchingTier
          ? {
              id: String(matchingTier._id),
              minPoints: matchingTier.minPoints,
              maxPoints: matchingTier.maxPoints,
              suggestedRewardName: matchingTier.suggestedRewardName,
            }
          : null,
        suggestedRewardName: matchingTier ? matchingTier.suggestedRewardName : null,
        nextTier: nextTier
          ? {
              id: String(nextTier._id),
              minPoints: nextTier.minPoints,
              maxPoints: nextTier.maxPoints,
              suggestedRewardName: nextTier.suggestedRewardName,
              pointsNeeded: Math.max(0, nextTier.minPoints - currentPoints),
            }
          : null,
        currentCycle: {
          id: String(activeCycle._id),
          startDate: activeCycle.startDate,
          endDate: activeCycle.endDate,
          isActive: activeCycle.isActive,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-portal/rewards ───────────────────────────────────────────

export async function getRewards(req, res, next) {
  try {
    const painterId = req.painter._id;
    const { page = 1, limit = 20, cycleId } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Filter locked to this painter
    const filter = { painterId };

    if (cycleId) {
      if (!isValidObjectId(cycleId)) {
        return next(createError('Invalid cycleId format', 400));
      }
      filter.cycleId = new mongoose.Types.ObjectId(cycleId);
    }

    const [assignments, total] = await Promise.all([
      PainterRewardAssignment.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('cycleId', 'startDate endDate isActive')
        .populate('rewardInventoryItemId', 'imageUrl name status'),
      PainterRewardAssignment.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    const safeRewards = assignments.map((a) => ({
      id: String(a._id),
      rewardName: a.rewardName,
      qty: a.qty,
      date: a.date,
      pointsAtAssignment: a.pointsAtAssignment,
      suggestedTierName: a.suggestedTierName || '',
      notes: a.notes || '',
      imageUrl: a.rewardInventoryItemId?.imageUrl || '',
      cycle: a.cycleId
        ? {
            id: String(a.cycleId._id || a.cycleId),
            startDate: a.cycleId.startDate,
            endDate: a.cycleId.endDate,
            isActive: a.cycleId.isActive,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        rewards: safeRewards,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-portal/rewards/:id ───────────────────────────────────────

export async function getRewardById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(createError('Invalid reward assignment ID format', 400));
    }

    const assignment = await PainterRewardAssignment.findById(id)
      .populate('cycleId', 'startDate endDate isActive')
      .populate('rewardInventoryItemId', 'imageUrl name status');

    if (!assignment) {
      return next(createError('Reward assignment not found', 404));
    }

    // CRITICAL ISOLATION CHECK: Must belong to authenticated painter
    if (String(assignment.painterId) !== String(req.painter._id)) {
      return next(createError('Reward assignment not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        id: String(assignment._id),
        rewardName: assignment.rewardName,
        qty: assignment.qty,
        date: assignment.date,
        pointsAtAssignment: assignment.pointsAtAssignment,
        suggestedTierName: assignment.suggestedTierName || '',
        notes: assignment.notes || '',
        imageUrl: assignment.rewardInventoryItemId?.imageUrl || '',
        cycle: assignment.cycleId
          ? {
              id: String(assignment.cycleId._id || assignment.cycleId),
              startDate: assignment.cycleId.startDate,
              endDate: assignment.cycleId.endDate,
              isActive: assignment.cycleId.isActive,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-portal/cycles ────────────────────────────────────────────

export async function getCycles(req, res, next) {
  try {
    const painterId = req.painter._id;

    // Find all distinct cycles where this painter has Sales
    const salesCycles = await Sale.distinct('cycleId', { painterId });

    // Find all distinct cycles where this painter received Rewards
    const rewardCycles = await PainterRewardAssignment.distinct('cycleId', { painterId });

    // Also include active cycle even if no activity yet
    const activeCycle = await Cycle.findOne({ isActive: true });

    // Union of all cycle IDs
    const cycleIdSet = new Set([
      ...salesCycles.map(String),
      ...rewardCycles.map(String),
      ...(activeCycle ? [String(activeCycle._id)] : []),
    ]);

    const cycleIds = Array.from(cycleIdSet).filter(isValidObjectId);

    // Fetch cycle documents
    const cycles = await Cycle.find({ _id: { $in: cycleIds } }).sort({ startDate: -1 });

    // For each cycle, aggregate painter sales and reward assignments
    const cycleSummaries = await Promise.all(
      cycles.map(async (cycle) => {
        const [salesStats, rewardsAssigned] = await Promise.all([
          getPainterCycleStats(painterId, cycle._id),
          PainterRewardAssignment.find({ painterId, cycleId: cycle._id })
            .select('rewardName qty date suggestedTierName pointsAtAssignment')
            .lean(),
        ]);

        return {
          cycle: {
            id: String(cycle._id),
            startDate: cycle.startDate,
            endDate: cycle.endDate,
            isActive: cycle.isActive,
          },
          isCurrentCycle: Boolean(cycle.isActive),
          salesCount: salesStats.totalSales,
          totalSalesValue: salesStats.totalAmount,
          totalPoints: salesStats.totalPoints,
          rewardsCount: rewardsAssigned.length,
          rewards: rewardsAssigned.map((r) => ({
            id: String(r._id),
            rewardName: r.rewardName,
            qty: r.qty,
            date: r.date,
            suggestedTierName: r.suggestedTierName || '',
            pointsAtAssignment: r.pointsAtAssignment,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: cycleSummaries,
    });
  } catch (err) {
    next(err);
  }
}
