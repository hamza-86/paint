import mongoose from 'mongoose';
import Painter from '../models/Painter.js';
import Sale from '../models/Sale.js';
import Cycle from '../models/Cycle.js';
import Customer from '../models/Customer.js';

/**
 * GET /api/painter-history/:painterId
 * ───────────────────────────────────
 * Admin-only: Retrieves lifetime summary and current cycle stats for a painter.
 * Deactivated painters are fully viewable.
 */
export async function getPainterHistory(req, res) {
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

    const pId = new mongoose.Types.ObjectId(painterId);

    // Aggregate lifetime sales statistics
    const [lifetimeAgg] = await Sale.aggregate([
      { $match: { painterId: pId } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalSalesValue: { $sum: '$totalAmount' },
          totalPoints: { $sum: '$totalPoints' },
        },
      },
    ]);

    const summary = {
      totalSales: lifetimeAgg?.totalSales || 0,
      totalSalesValue: lifetimeAgg?.totalSalesValue || 0,
      totalPoints: lifetimeAgg?.totalPoints || 0,
    };

    // Find active cycle if any
    const activeCycle = await Cycle.findOne({ isActive: true });
    let currentCycle = null;
    let currentCycleSummary = {
      currentCycleSales: 0,
      currentCycleSalesValue: 0,
      currentCyclePoints: 0,
    };

    if (activeCycle) {
      currentCycle = {
        id: String(activeCycle._id),
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
        isActive: true,
      };

      const [cycleAgg] = await Sale.aggregate([
        {
          $match: {
            painterId: pId,
            cycleId: activeCycle._id,
          },
        },
        {
          $group: {
            _id: null,
            currentCycleSales: { $sum: 1 },
            currentCycleSalesValue: { $sum: '$totalAmount' },
            currentCyclePoints: { $sum: '$totalPoints' },
          },
        },
      ]);

      if (cycleAgg) {
        currentCycleSummary = {
          currentCycleSales: cycleAgg.currentCycleSales || 0,
          currentCycleSalesValue: cycleAgg.currentCycleSalesValue || 0,
          currentCyclePoints: cycleAgg.currentCyclePoints || 0,
        };
      }
    }

    return res.status(200).json({
      success: true,
      painter: {
        id: String(painter._id),
        firstName: painter.firstName,
        mobile: painter.mobile,
        email: painter.email,
        status: painter.status,
        photoUrl: painter.photoUrl,
        currentCycleId: painter.currentCycleId,
        createdAt: painter.createdAt,
      },
      summary,
      currentCycle,
      currentCycleSummary,
    });
  } catch (error) {
    console.error('getPainterHistory error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve painter history.',
    });
  }
}

/**
 * GET /api/painter-history/:painterId/cycles
 * ──────────────────────────────────────────
 * Admin-only: Retrieves cycle-wise aggregated history for this painter.
 * Shows all cycles where the painter has recorded sales, sorted newest first.
 */
export async function getPainterHistoryCycles(req, res) {
  try {
    const { painterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(painterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid painter ID format.',
      });
    }

    const painter = await Painter.findById(painterId).select('_id');
    if (!painter) {
      return res.status(404).json({
        success: false,
        message: 'Painter not found.',
      });
    }

    const pId = new mongoose.Types.ObjectId(painterId);

    const cyclesAgg = await Sale.aggregate([
      { $match: { painterId: pId } },
      {
        $group: {
          _id: '$cycleId',
          salesCount: { $sum: 1 },
          totalSalesValue: { $sum: '$totalAmount' },
          totalPoints: { $sum: '$totalPoints' },
        },
      },
      {
        $lookup: {
          from: 'cycles',
          localField: '_id',
          foreignField: '_id',
          as: 'cycle',
        },
      },
      { $unwind: { path: '$cycle', preserveNullAndEmptyArrays: false } },
      { $sort: { 'cycle.startDate': -1 } },
      {
        $project: {
          _id: 0,
          cycleId: { $toString: '$_id' },
          startDate: '$cycle.startDate',
          endDate: '$cycle.endDate',
          isActive: '$cycle.isActive',
          salesCount: 1,
          totalSalesValue: 1,
          totalPoints: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      cycles: cyclesAgg,
    });
  } catch (error) {
    console.error('getPainterHistoryCycles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cycle history.',
    });
  }
}

/**
 * GET /api/painter-history/:painterId/sales
 * ─────────────────────────────────────────
 * Admin-only: Retrieves paginated sales belonging to the painter.
 * Supports cycleId filter and customer name/mobile search.
 * Sales are sorted newest first.
 */
export async function getPainterHistorySales(req, res) {
  try {
    const { painterId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(painterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid painter ID format.',
      });
    }

    const painter = await Painter.findById(painterId).select('_id');
    if (!painter) {
      return res.status(404).json({
        success: false,
        message: 'Painter not found.',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const { cycleId, search } = req.query;

    const filter = { painterId: new mongoose.Types.ObjectId(painterId) };

    if (cycleId && cycleId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(cycleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cycle ID format.',
        });
      }
      filter.cycleId = new mongoose.Types.ObjectId(cycleId);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingCustomers = await Customer.find({
        $or: [{ name: searchRegex }, { mobile: searchRegex }],
      }).select('_id');
      filter.customerId = { $in: matchingCustomers.map((c) => c._id) };
    }

    const total = await Sale.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;

    const sales = await Sale.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name mobile')
      .populate('cycleId', 'startDate endDate isActive');

    const mappedSales = sales.map((s) => ({
      id: String(s._id),
      date: s.date,
      customer: s.customerId
        ? {
            id: String(s.customerId._id),
            name: s.customerId.name,
            mobile: s.customerId.mobile,
          }
        : null,
      cycle: s.cycleId
        ? {
            id: String(s.cycleId._id),
            startDate: s.cycleId.startDate,
            endDate: s.cycleId.endDate,
            isActive: s.cycleId.isActive,
          }
        : null,
      totalAmount: s.totalAmount,
      totalPoints: s.totalPoints,
      itemCount: s.lineItems ? s.lineItems.length : 0,
      billImageUrl: s.billImageUrl || '',
      createdAt: s.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: mappedSales,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('getPainterHistorySales error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sales history.',
    });
  }
}
