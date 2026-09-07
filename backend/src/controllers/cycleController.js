import mongoose from 'mongoose';
import Cycle from '../models/Cycle.js';
import Painter from '../models/Painter.js';

/**
 * Parse and validate a date string/value.
 * Returns a Date object or null if invalid.
 */
const parseDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  // Invalid Date check
  if (isNaN(d.getTime())) return null;
  return d;
};

/**
 * Check if two date ranges overlap.
 * Range A: [startA, endA]
 * Range B: [startB, endB]
 * Ranges overlap if startA < endB AND startB < endA (strict, exclusive boundaries).
 */
const dateRangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

/**
 * Helper to add computed_status to cycle representation
 */
export const enrichCycle = (cycleDoc) => {
  if (!cycleDoc) return null;
  const json = typeof cycleDoc.toJSON === 'function' ? cycleDoc.toJSON() : cycleDoc;
  const now = new Date();
  const end = new Date(json.endDate);
  const start = new Date(json.startDate);

  let computed_status = 'ended';
  if (json.isActive && end > now) {
    computed_status = 'active';
  } else if (start > now) {
    // Starts in the future, not yet active
    computed_status = 'upcoming';
  } else {
    // Past end date or manually closed
    computed_status = 'ended';
  }

  return {
    ...json,
    computed_status,
  };
};

/**
 * GET /api/cycles
 * List all cycles with pagination. Returns the active cycle separately.
 * Admin only.
 */
export const getCycles = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const now = new Date();

    // Auto-finalize any active cycles that have passed their endDate
    await Cycle.updateMany(
      { isActive: true, endDate: { $lte: now } },
      { $set: { isActive: false } }
    );

    const [cycles, total, activeCycle] = await Promise.all([
      Cycle.find()
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Cycle.countDocuments(),
      Cycle.findOne({ isActive: true, endDate: { $gt: now } }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: cycles.map(enrichCycle),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      activeCycle: activeCycle ? enrichCycle(activeCycle) : null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/cycles/:id
 * Retrieve a single cycle by ID.
 * Admin only.
 */
export const getCycleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cycle ID format.',
      });
    }

    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: 'Cycle not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: enrichCycle(cycle),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cycles
 * Create a new reward cycle.
 * Admin only.
 *
 * Rules:
 * - startDate and endDate are required.
 * - startDate must be strictly before endDate.
 * - Date ranges must not overlap any existing cycle.
 * - If isActive = true, no other active cycle may exist.
 * - Expired active cycles are automatically finalized and do not block new cycle creation.
 */
export const createCycle = async (req, res, next) => {
  try {
    const { startDate: rawStart, endDate: rawEnd, isActive = false } = req.body;
    const now = new Date();

    // Auto-finalize any active cycles that have passed their endDate
    await Cycle.updateMany(
      { isActive: true, endDate: { $lte: now } },
      { $set: { isActive: false } }
    );

    // ── Date presence validation ──────────────────────────────────────────────
    if (!rawStart) {
      return res.status(400).json({ success: false, message: 'startDate is required.' });
    }
    if (!rawEnd) {
      return res.status(400).json({ success: false, message: 'endDate is required.' });
    }

    const startDate = parseDate(rawStart);
    const endDate = parseDate(rawEnd);

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'startDate is not a valid date.' });
    }
    if (!endDate) {
      return res.status(400).json({ success: false, message: 'endDate is not a valid date.' });
    }

    // ── Date logic validation ─────────────────────────────────────────────────
    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate must be strictly before endDate.',
      });
    }

    // ── Overlap check ─────────────────────────────────────────────────────────
    const existingCycles = await Cycle.find({});
    const overlapping = existingCycles.find((c) =>
      dateRangesOverlap(startDate, endDate, c.startDate, c.endDate)
    );

    if (overlapping) {
      const formatBound = (d) => {
        const iso = d.toISOString();
        return iso.includes('T00:00:00') ? iso.slice(0, 10) : iso.replace('T', ' ').slice(0, 16);
      };
      return res.status(409).json({
        success: false,
        message: `The requested date range overlaps with an existing cycle (${formatBound(overlapping.startDate)} → ${formatBound(overlapping.endDate)}). Cycles must not have overlapping date ranges.`,
      });
    }

    // ── Active conflict check ─────────────────────────────────────────────────
    if (isActive) {
      if (endDate <= now) {
        return res.status(400).json({
          success: false,
          message: 'Cannot activate a cycle whose end date has already passed.',
        });
      }

      const activeCycle = await Cycle.findOne({ isActive: true, endDate: { $gt: now } });
      if (activeCycle) {
        return res.status(409).json({
          success: false,
          message: `Another cycle is already active (ID: ${activeCycle._id}). Please close the current active cycle before creating or activating a new one.`,
        });
      }
    }

    // ── Create cycle ──────────────────────────────────────────────────────────
    const cycle = await Cycle.create({
      startDate,
      endDate,
      isActive: Boolean(isActive),
    });

    // If created as active, update active painters' currentCycleId
    if (isActive) {
      await Painter.updateMany({ status: 'active' }, { currentCycleId: cycle._id });
    }

    res.status(201).json({
      success: true,
      message: 'Cycle created successfully.',
      data: enrichCycle(cycle),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/cycles/:id/activate
 * Activate a cycle.
 * Admin only.
 *
 * Rules:
 * - Cycle must exist.
 * - End date must not be in the past.
 * - Any expired active cycles are auto-closed.
 * - No other unexpired cycle may currently be active.
 */
export const activateCycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = new Date();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid cycle ID format.' });
    }

    // Auto-finalize any expired active cycles
    await Cycle.updateMany(
      { isActive: true, endDate: { $lte: now } },
      { $set: { isActive: false } }
    );

    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Cycle not found.' });
    }

    if (cycle.isActive && new Date(cycle.endDate) > now) {
      return res.status(200).json({
        success: true,
        message: 'Cycle is already active.',
        data: enrichCycle(cycle),
      });
    }

    if (new Date(cycle.endDate) <= now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate a cycle whose end date has already passed.',
      });
    }

    // Check for another unexpired active cycle
    const activeCycle = await Cycle.findOne({ _id: { $ne: cycle._id }, isActive: true, endDate: { $gt: now } });
    if (activeCycle) {
      return res.status(409).json({
        success: false,
        message: `Another cycle is already active (ID: ${activeCycle._id}). Please close the current active cycle before activating this one.`,
      });
    }

    cycle.isActive = true;
    await cycle.save();

    // Update active painters to reference this cycle
    await Painter.updateMany({ status: 'active' }, { currentCycleId: cycle._id });

    res.status(200).json({
      success: true,
      message: 'Cycle activated successfully.',
      data: enrichCycle(cycle),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/cycles/:id/close
 * Close (deactivate) a cycle.
 * Admin only.
 *
 * Manual Close Behavior:
 * - Sets isActive = false.
 * - Sets effective endDate to actual close timestamp (now) if closed before original endDate.
 * - Preserves original historical cycle record, sales, and point assignments.
 */
export const closeCycle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const now = new Date();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid cycle ID format.' });
    }

    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Cycle not found.' });
    }

    if (!cycle.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Cycle is already closed.',
        data: enrichCycle(cycle),
      });
    }

    cycle.isActive = false;
    // If closed before original endDate, set effective endDate to now
    if (new Date(cycle.endDate) > now) {
      cycle.endDate = now;
      if (new Date(cycle.startDate) >= now) {
        cycle.startDate = new Date(now.getTime() - 1000);
      }
    }
    await cycle.save();

    res.status(200).json({
      success: true,
      message: 'Cycle closed successfully. Historical sales and point records are preserved.',
      data: enrichCycle(cycle),
    });
  } catch (err) {
    next(err);
  }
};
