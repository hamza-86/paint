/**
 * painterRewardAssignmentController.js — Part 12
 *
 * Handles all Painter Reward Assignment operations:
 *  - GET  /api/painter-reward-assignments          → paginated list
 *  - GET  /api/painter-reward-assignments/:id      → single assignment
 *  - GET  /api/painter-reward-assignments/eligibility/:painterId → eligibility lookup
 *  - POST /api/painter-reward-assignments          → create (atomic)
 *
 * ATOMIC SAFETY:
 *   Assignment creation uses findOneAndUpdate with $inc to atomically decrement
 *   remainingQty on RewardInventoryItem in a single round-trip, preventing
 *   over-allocation even under concurrent requests.
 *
 * ZERO-DELETION POLICY: No DELETE endpoint is exposed.
 */

import mongoose from 'mongoose';
import PainterRewardAssignment from '../models/PainterRewardAssignment.js';
import RewardInventoryItem from '../models/RewardInventoryItem.js';
import Painter from '../models/Painter.js';
import Cycle from '../models/Cycle.js';
import Sale from '../models/Sale.js';
import RewardTier from '../models/RewardTier.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function createError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Compute total points earned by a painter in a specific cycle.
 */
async function getPainterCyclePoints(painterId, cycleId) {
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
      },
    },
  ]);
  return agg.length > 0 ? (agg[0].totalPoints || 0) : 0;
}

/**
 * Find the best matching active RewardTier for a given points value.
 * Returns null if no tier matches.
 */
async function findMatchingTier(points) {
  const tier = await RewardTier.findOne({
    status: 'active',
    minPoints: { $lte: points },
    maxPoints: { $gte: points },
  }).sort({ minPoints: -1 });
  return tier || null;
}

// ── GET /api/painter-reward-assignments ───────────────────────────────────────

export async function getAssignments(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      painterId,
      cycleId,
      rewardInventoryItemId,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};
    if (painterId) {
      if (!isValidObjectId(painterId))
        return next(createError('Invalid painterId format', 400));
      filter.painterId = new mongoose.Types.ObjectId(painterId);
    }
    if (cycleId) {
      if (!isValidObjectId(cycleId))
        return next(createError('Invalid cycleId format', 400));
      filter.cycleId = new mongoose.Types.ObjectId(cycleId);
    }
    if (rewardInventoryItemId) {
      if (!isValidObjectId(rewardInventoryItemId))
        return next(createError('Invalid rewardInventoryItemId format', 400));
      filter.rewardInventoryItemId = new mongoose.Types.ObjectId(rewardInventoryItemId);
    }
    // Search by painter name or reward name snapshot
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ painterName: regex }, { rewardName: regex }];
    }

    const [assignments, total] = await Promise.all([
      PainterRewardAssignment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('painterId', 'firstName mobile email photoUrl status')
        .populate('rewardInventoryItemId', 'name imageUrl remainingQty totalQty status')
        .populate('cycleId', 'startDate endDate isActive')
        .lean(),
      PainterRewardAssignment.countDocuments(filter),
    ]);

    // Summary metrics for the filtered set
    const summaryAgg = await PainterRewardAssignment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAssignments: { $sum: 1 },
          totalQtyAssigned: { $sum: '$qty' },
          uniquePainters: { $addToSet: '$painterId' },
        },
      },
    ]);
    const summary = summaryAgg[0] || { totalAssignments: 0, totalQtyAssigned: 0, uniquePainters: [] };

    return res.status(200).json({
      status: 'success',
      data: {
        assignments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
        summary: {
          totalAssignments: summary.totalAssignments,
          totalQtyAssigned: summary.totalQtyAssigned,
          uniquePaintersCount: summary.uniquePainters.length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-reward-assignments/:id ───────────────────────────────────

export async function getAssignmentById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return next(createError('Invalid assignment ID format', 400));

    const assignment = await PainterRewardAssignment.findById(id)
      .populate('painterId', 'firstName mobile email photoUrl status')
      .populate('rewardInventoryItemId', 'name imageUrl remainingQty totalQty status')
      .populate('cycleId', 'startDate endDate isActive');

    if (!assignment)
      return next(createError('Assignment not found', 404));

    return res.status(200).json({ status: 'success', data: { assignment } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/painter-reward-assignments/eligibility/:painterId ────────────────

export async function getPainterEligibility(req, res, next) {
  try {
    const { painterId } = req.params;
    if (!isValidObjectId(painterId))
      return next(createError('Invalid painter ID format', 400));

    // 1. Resolve painter
    const painter = await Painter.findById(painterId);
    if (!painter) return next(createError('Painter not found', 404));

    // 2. Find active cycle
    const activeCycle = await Cycle.findOne({ isActive: true });
    if (!activeCycle) {
      return res.status(200).json({
        status: 'success',
        data: {
          painter: { id: painter.id, name: painter.firstName, status: painter.status },
          activeCycle: null,
          points: 0,
          suggestedTier: null,
          suggestedInventoryItems: [],
          previousAssignments: [],
          message: 'No active cycle found',
        },
      });
    }

    // Check if active cycle has expired
    const now = new Date();
    if (activeCycle.endDate && now > new Date(activeCycle.endDate)) {
      activeCycle.isActive = false;
      await activeCycle.save();
      return res.status(200).json({
        status: 'success',
        data: {
          painter: { id: painter.id, name: painter.firstName, status: painter.status },
          activeCycle: null,
          points: 0,
          suggestedTier: null,
          suggestedInventoryItems: [],
          previousAssignments: [],
          message: 'No active cycle found. Previous cycle has expired.',
        },
      });
    }

    // 3. Compute points in current cycle
    const points = await getPainterCyclePoints(painter._id, activeCycle._id);

    // 4. Find matching tier
    const suggestedTier = await findMatchingTier(points);

    // 5. List active inventory items with remaining stock
    const inventoryItems = await RewardInventoryItem.find({
      status: 'active',
      remainingQty: { $gt: 0 },
    })
      .sort({ name: 1 })
      .populate({
        path: 'sourceCompanyRewardEntryId',
        populate: { path: 'companyId', select: 'name' },
      })
      .select('name imageUrl totalQty remainingQty sourceCompanyRewardEntryId')
      .lean();

    // 6. Previous assignments for this painter in this cycle
    const previousAssignments = await PainterRewardAssignment.find({
      painterId: painter._id,
      cycleId: activeCycle._id,
    })
      .sort({ createdAt: -1 })
      .select('rewardName rewardImageUrl qty date notes createdAt')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        painter: {
          id: painter.id,
          name: painter.firstName,
          mobile: painter.mobile,
          email: painter.email,
          photoUrl: painter.photoUrl,
          status: painter.status,
        },
        activeCycle: {
          id: String(activeCycle._id),
          startDate: activeCycle.startDate,
          endDate: activeCycle.endDate,
          isActive: activeCycle.isActive,
        },
        points,
        suggestedTier: suggestedTier
          ? {
              id: suggestedTier.id,
              minPoints: suggestedTier.minPoints,
              maxPoints: suggestedTier.maxPoints,
              suggestedRewardName: suggestedTier.suggestedRewardName,
              suggestedInventoryItemId: suggestedTier.suggestedInventoryItemId
                ? String(suggestedTier.suggestedInventoryItemId)
                : null,
            }
          : null,
        suggestedInventoryItems: inventoryItems,
        previousAssignments,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/painter-reward-assignments ──────────────────────────────────────

export async function createAssignment(req, res, next) {
  try {
    const { painterId, rewardInventoryItemId, cycleId, qty = 1, notes = '' } = req.body;

    // ── Validate required fields ────────────────────────────────────────────
    if (!painterId) return next(createError('painterId is required'));
    if (!rewardInventoryItemId) return next(createError('rewardInventoryItemId is required'));
    if (!isValidObjectId(painterId)) return next(createError('Invalid painterId format'));
    if (!isValidObjectId(rewardInventoryItemId))
      return next(createError('Invalid rewardInventoryItemId format'));

    const qtyNum = parseInt(qty, 10);
    if (!Number.isInteger(qtyNum) || qtyNum < 1)
      return next(createError('qty must be a positive integer (>= 1)'));

    // ── Resolve painter ─────────────────────────────────────────────────────
    const painter = await Painter.findById(painterId);
    if (!painter) return next(createError('Painter not found', 404));

    // ── Resolve cycle ───────────────────────────────────────────────────────
    let cycle;
    if (cycleId) {
      if (!isValidObjectId(cycleId)) return next(createError('Invalid cycleId format'));
      cycle = await Cycle.findById(cycleId);
      if (!cycle) return next(createError('Cycle not found', 404));
    } else {
      cycle = await Cycle.findOne({ isActive: true });
      if (!cycle) return next(createError('No active cycle found. Provide cycleId explicitly.', 400));
    }

    // Check if cycle is active and unexpired
    const nowCheck = new Date();
    if (!cycle.isActive || (cycle.endDate && nowCheck > new Date(cycle.endDate))) {
      return next(createError('Cannot assign reward: cycle has expired or is inactive', 400));
    }

    // ── Compute eligibility (for snapshot metadata) ─────────────────────────
    const points = await getPainterCyclePoints(painter._id, cycle._id);
    const suggestedTier = await findMatchingTier(points);

    // ── ATOMIC inventory decrement ──────────────────────────────────────────
    // findOneAndUpdate with $inc and a guard condition ensures we never
    // go below 0, even under concurrent requests.
    const updatedInventory = await RewardInventoryItem.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(rewardInventoryItemId),
        status: 'active',
        remainingQty: { $gte: qtyNum }, // Guard: must have enough stock
      },
      {
        $inc: { remainingQty: -qtyNum },
      },
      { new: true }
    );

    if (!updatedInventory) {
      // Check why — item not found, deactivated, or insufficient stock
      const invItem = await RewardInventoryItem.findById(rewardInventoryItemId);
      if (!invItem) return next(createError('Reward inventory item not found', 404));
      if (invItem.status === 'deactivated')
        return next(createError('Reward inventory item is deactivated and cannot be assigned', 400));
      // Insufficient stock
      return next(
        createError(
          `Insufficient stock. Requested: ${qtyNum}, Available: ${invItem.remainingQty}`,
          400
        )
      );
    }

    // ── Create assignment record ────────────────────────────────────
    const assignment = await PainterRewardAssignment.create({
      painterId: painter._id,
      rewardInventoryItemId: updatedInventory._id,
      cycleId: cycle._id,
      qty: qtyNum,
      painterName: painter.firstName,
      rewardName: updatedInventory.name,
      rewardImageUrl: updatedInventory.imageUrl || '',
      pointsAtAssignment: points,
      suggestedTierName: suggestedTier ? suggestedTier.suggestedRewardName : '',
      notes: notes ? String(notes).trim().slice(0, 500) : '',
      date: new Date(),
    });

    // Populate for response
    await assignment.populate([
      { path: 'painterId', select: 'firstName mobile email photoUrl status' },
      { path: 'rewardInventoryItemId', select: 'name imageUrl remainingQty totalQty status' },
      { path: 'cycleId', select: 'startDate endDate isActive' },
    ]);

    return res.status(201).json({
      status: 'success',
      message: 'Reward assigned successfully',
      data: {
        assignment,
        inventoryAfter: {
          id: String(updatedInventory._id),
          name: updatedInventory.name,
          remainingQty: updatedInventory.remainingQty,
          totalQty: updatedInventory.totalQty,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
