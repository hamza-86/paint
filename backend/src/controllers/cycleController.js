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
 * GET /api/cycles
 * List all cycles with pagination. Returns the active cycle separately.
 * Admin only.
 */
export const getCycles = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [cycles, total, activeCycle] = await Promise.all([
      Cycle.find()
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Cycle.countDocuments(),
      Cycle.findOne({ isActive: true }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: cycles.map((c) => c.toJSON()),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      activeCycle: activeCycle ? activeCycle.toJSON() : null,
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
      data: cycle.toJSON(),
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
 */
export const createCycle = async (req, res, next) => {
  try {
    const { startDate: rawStart, endDate: rawEnd, isActive = false } = req.body;

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
      return res.status(409).json({
        success: false,
        message: `The requested date range overlaps with an existing cycle (${overlapping.startDate.toISOString().slice(0, 10)} → ${overlapping.endDate.toISOString().slice(0, 10)}). Cycles must not have overlapping date ranges.`,
      });
    }

    // ── Active conflict check ─────────────────────────────────────────────────
    if (isActive) {
      const activeCycle = await Cycle.findOne({ isActive: true });
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
      data: cycle.toJSON(),
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
 * - No other cycle may currently be active.
 */
export const activateCycle = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid cycle ID format.' });
    }

    const cycle = await Cycle.findById(id);

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Cycle not found.' });
    }

    if (cycle.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Cycle is already active.',
        data: cycle.toJSON(),
      });
    }

    // Check for another active cycle
    const activeCycle = await Cycle.findOne({ isActive: true });
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
      data: cycle.toJSON(),
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
 * This does NOT delete any historical data.
 * It only sets isActive = false.
 */
export const closeCycle = async (req, res, next) => {
  try {
    const { id } = req.params;

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
        data: cycle.toJSON(),
      });
    }

    cycle.isActive = false;
    await cycle.save();

    // Note: We do NOT clear Painter.currentCycleId here.
    // Painters retain their last cycle reference for historical reporting.
    // When a new cycle is activated, active painters will receive the new cycle ID.

    res.status(200).json({
      success: true,
      message: 'Cycle closed successfully. Historical sales and point records are preserved.',
      data: cycle.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};
