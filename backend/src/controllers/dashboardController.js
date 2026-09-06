import mongoose from 'mongoose';
import Painter from '../models/Painter.js';
import Cycle from '../models/Cycle.js';
import Sale from '../models/Sale.js';
import RewardInventoryItem from '../models/RewardInventoryItem.js';
import PainterRewardAssignment from '../models/PainterRewardAssignment.js';
import CompanyRewardEntry from '../models/CompanyRewardEntry.js';
import Company from '../models/Company.js';

/**
 * GET /api/dashboard/summary
 * High-level business overview statistics.
 */
export const getSummary = async (req, res, next) => {
  try {
    // 1. Painters counts
    const [totalPainters, activePainters, deactivatedPainters] = await Promise.all([
      Painter.countDocuments(),
      Painter.countDocuments({ status: 'active' }),
      Painter.countDocuments({ status: 'deactivated' }),
    ]);

    // 2. Active cycle & sales in active cycle
    const activeCycle = await Cycle.findOne({ isActive: true });
    let currentCycle = null;

    if (activeCycle) {
      const now = new Date();
      const endDate = new Date(activeCycle.endDate);
      const msDiff = endDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

      const cycleSalesAgg = await Sale.aggregate([
        { $match: { cycleId: activeCycle._id } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalSalesValue: { $sum: '$totalAmount' },
            totalPoints: { $sum: '$totalPoints' },
          },
        },
      ]);

      const cycleSales = cycleSalesAgg[0] || {
        totalSales: 0,
        totalSalesValue: 0,
        totalPoints: 0,
      };

      currentCycle = {
        id: activeCycle._id.toString(),
        startDate: activeCycle.startDate,
        endDate: activeCycle.endDate,
        isActive: activeCycle.isActive,
        daysRemaining,
        totalSales: cycleSales.totalSales,
        totalSalesValue: Math.round(cycleSales.totalSalesValue * 100) / 100,
        totalPoints: Math.round(cycleSales.totalPoints * 100) / 100,
      };
    }

    // 3. Rewards & Inventory counts
    const [totalItems, activeItems, inventoryAgg, totalAssignments] = await Promise.all([
      RewardInventoryItem.countDocuments(),
      RewardInventoryItem.countDocuments({ status: 'active' }),
      RewardInventoryItem.aggregate([
        {
          $group: {
            _id: null,
            totalQty: { $sum: '$totalQty' },
            remainingQty: { $sum: '$remainingQty' },
          },
        },
      ]),
      PainterRewardAssignment.countDocuments(),
    ]);

    const totalQty = inventoryAgg[0]?.totalQty || 0;
    const remainingQty = inventoryAgg[0]?.remainingQty || 0;
    const assignedQty = Math.max(0, totalQty - remainingQty);

    // 4. Company Rewards summary
    const companyRewardsAgg = await CompanyRewardEntry.aggregate([
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalSaleValue: { $sum: '$saleValue' },
          totalQuantitySold: { $sum: '$quantitySold' },
        },
      },
    ]);

    const companyTotals = companyRewardsAgg[0] || {
      totalEntries: 0,
      totalSaleValue: 0,
      totalQuantitySold: 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        painters: {
          total: totalPainters,
          active: activePainters,
          deactivated: deactivatedPainters,
        },
        currentCycle,
        rewards: {
          totalItems,
          activeItems,
          totalQty,
          remainingQty,
          assignedQty,
          totalAssignments,
        },
        companyRewards: {
          totalEntries: companyTotals.totalEntries,
          totalSaleValue: Math.round(companyTotals.totalSaleValue * 100) / 100,
          totalQuantitySold: companyTotals.totalQuantitySold,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/top-painters
 * Top-performing painters in the current active cycle.
 * Query: limit (default 5, max 20)
 */
export const getTopPainters = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));

    const activeCycle = await Cycle.findOne({ isActive: true });
    if (!activeCycle) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const topAgg = await Sale.aggregate([
      { $match: { cycleId: activeCycle._id } },
      {
        $group: {
          _id: '$painterId',
          salesCount: { $sum: 1 },
          salesValue: { $sum: '$totalAmount' },
          points: { $sum: '$totalPoints' },
        },
      },
      { $sort: { points: -1, salesValue: -1 } },
      { $limit: limit },
    ]);

    if (topAgg.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const painterIds = topAgg.map((item) => item._id);
    const painters = await Painter.find({ _id: { $in: painterIds } })
      .select('firstName lastName phone photoUrl status')
      .lean();

    const painterMap = new Map();
    painters.forEach((p) => {
      painterMap.set(p._id.toString(), p);
    });

    const result = topAgg.map((item, index) => {
      const painter = painterMap.get(item._id.toString());
      return {
        rank: index + 1,
        painterId: item._id.toString(),
        firstName: painter?.firstName || 'Unknown',
        lastName: painter?.lastName || '',
        phone: painter?.phone || '',
        photoUrl: painter?.photoUrl || '',
        status: painter?.status || 'unknown',
        salesCount: item.salesCount,
        salesValue: Math.round(item.salesValue * 100) / 100,
        points: Math.round(item.points * 100) / 100,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/sales-trend
 * Daily sales count, amount, and points for a cycle (defaults to current active cycle).
 * Query: cycleId (optional)
 */
export const getSalesTrend = async (req, res, next) => {
  try {
    let targetCycleId = req.query.cycleId;

    if (!targetCycleId) {
      const activeCycle = await Cycle.findOne({ isActive: true });
      if (!activeCycle) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }
      targetCycleId = activeCycle._id;
    } else if (!mongoose.Types.ObjectId.isValid(targetCycleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cycleId format.',
      });
    } else {
      targetCycleId = new mongoose.Types.ObjectId(targetCycleId);
    }

    const trendAgg = await Sale.aggregate([
      { $match: { cycleId: targetCycleId } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$date',
            },
          },
          salesCount: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPoints: { $sum: '$totalPoints' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const result = trendAgg.map((item) => ({
      date: item._id,
      salesCount: item.salesCount,
      totalAmount: Math.round(item.totalAmount * 100) / 100,
      totalPoints: Math.round(item.totalPoints * 100) / 100,
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent-sales
 * Most recent sales with populated painter and customer details.
 * Query: limit (default 5, max 20)
 */
export const getRecentSales = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));

    const sales = await Sale.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .populate('painterId', 'firstName lastName phone photoUrl status')
      .populate('customerId', 'name mobile')
      .lean();

    const result = sales.map((sale) => ({
      id: sale._id.toString(),
      date: sale.date,
      totalAmount: Math.round(sale.totalAmount * 100) / 100,
      totalPoints: Math.round(sale.totalPoints * 100) / 100,
      lineItemsCount: sale.lineItems?.length || 0,
      lineItems: sale.lineItems || [],
      billImageUrl: sale.billImageUrl || '',
      painter: sale.painterId
        ? {
            id: sale.painterId._id.toString(),
            firstName: sale.painterId.firstName,
            lastName: sale.painterId.lastName,
            phone: sale.painterId.phone,
            photoUrl: sale.painterId.photoUrl,
            status: sale.painterId.status,
          }
        : null,
      customer: sale.customerId
        ? {
            id: sale.customerId._id.toString(),
            name: sale.customerId.name,
            mobile: sale.customerId.mobile,
          }
        : null,
      createdAt: sale.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent-rewards
 * Most recent physical reward assignments with snapshots.
 * Query: limit (default 5, max 20)
 */
export const getRecentRewards = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));

    const assignments = await PainterRewardAssignment.find()
      .sort({ assignedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate('painterId', 'firstName lastName photoUrl phone')
      .populate('rewardInventoryItemId', 'name imageUrl remainingQty totalQty status')
      .lean();

    const result = assignments.map((a) => ({
      id: a._id.toString(),
      painterId: a.painterId?._id?.toString() || a.painterId?.toString(),
      painterName: a.painterName,
      painterPhotoUrl: a.painterId?.photoUrl || '',
      rewardInventoryItemId:
        a.rewardInventoryItemId?._id?.toString() || a.rewardInventoryItemId?.toString(),
      rewardName: a.rewardName,
      rewardImageUrl: a.rewardInventoryItemId?.imageUrl || '',
      qty: a.qty,
      pointsAtAssignment: a.pointsAtAssignment,
      tierNameSnapshot: a.tierNameSnapshot || null,
      assignedAt: a.assignedAt,
      notes: a.notes || '',
      createdAt: a.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/inventory-summary
 * Summary of physical reward inventory and low-stock alerts.
 */
export const getInventorySummary = async (req, res, next) => {
  try {
    const [totalItems, activeItems, deactivatedItems, inventoryAgg, lowStockDocs] =
      await Promise.all([
        RewardInventoryItem.countDocuments(),
        RewardInventoryItem.countDocuments({ status: 'active' }),
        RewardInventoryItem.countDocuments({ status: 'deactivated' }),
        RewardInventoryItem.aggregate([
          {
            $group: {
              _id: null,
              totalQty: { $sum: '$totalQty' },
              remainingQty: { $sum: '$remainingQty' },
            },
          },
        ]),
        RewardInventoryItem.find({
          status: 'active',
          remainingQty: { $lte: 2 },
        })
          .sort({ remainingQty: 1, name: 1 })
          .limit(10)
          .lean(),
      ]);

    const totalQty = inventoryAgg[0]?.totalQty || 0;
    const remainingQty = inventoryAgg[0]?.remainingQty || 0;
    const assignedQty = Math.max(0, totalQty - remainingQty);

    const lowStockItems = lowStockDocs.map((item) => ({
      id: item._id.toString(),
      name: item.name,
      imageUrl: item.imageUrl || '',
      remainingQty: item.remainingQty,
      totalQty: item.totalQty,
      status: item.status,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        activeItems,
        deactivatedItems,
        totalQty,
        remainingQty,
        assignedQty,
        lowStockCount: lowStockItems.length,
        lowStockItems,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/company-rewards-summary
 * Summary of rewards received from manufacturers/companies.
 */
export const getCompanyRewardsSummary = async (req, res, next) => {
  try {
    const [companyAgg, allCompanies] = await Promise.all([
      CompanyRewardEntry.aggregate([
        {
          $group: {
            _id: '$companyId',
            entriesCount: { $sum: 1 },
            totalSaleValue: { $sum: '$saleValue' },
            totalQuantitySold: { $sum: '$quantitySold' },
            totalRewardItemsCount: { $sum: { $size: '$rewardItems' } },
          },
        },
        { $sort: { totalSaleValue: -1 } },
      ]),
      Company.find().select('name contactPerson phone email isActive').lean(),
    ]);

    const companyMap = new Map();
    allCompanies.forEach((c) => {
      companyMap.set(c._id.toString(), c);
    });

    let globalSaleValue = 0;
    let globalQuantitySold = 0;
    let globalEntries = 0;

    const byCompany = companyAgg.map((item) => {
      const company = companyMap.get(item._id.toString());
      globalSaleValue += item.totalSaleValue;
      globalQuantitySold += item.totalQuantitySold;
      globalEntries += item.entriesCount;

      return {
        companyId: item._id.toString(),
        companyName: company?.name || 'Unknown Company',
        contactPerson: company?.contactPerson || '',
        phone: company?.phone || '',
        isActive: company?.isActive ?? true,
        entriesCount: item.entriesCount,
        totalSaleValue: Math.round(item.totalSaleValue * 100) / 100,
        totalQuantitySold: item.totalQuantitySold,
        totalRewardItemsCount: item.totalRewardItemsCount,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          totalEntries: globalEntries,
          totalSaleValue: Math.round(globalSaleValue * 100) / 100,
          totalQuantitySold: globalQuantitySold,
        },
        byCompany,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/activity
 * Unified recent activity feed (sales, painter reward assignments, company rewards).
 * Query: limit (default 10, max 30)
 */
export const getActivity = async (req, res, next) => {
  try {
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const [recentSales, recentAssignments, recentCompanyRewards] = await Promise.all([
      Sale.find()
        .sort({ date: -1, createdAt: -1 })
        .limit(limit)
        .populate('painterId', 'firstName lastName')
        .populate('customerId', 'name')
        .lean(),
      PainterRewardAssignment.find()
        .sort({ assignedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      CompanyRewardEntry.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('companyId', 'name')
        .lean(),
    ]);

    const activities = [];

    // Map sales
    recentSales.forEach((sale) => {
      const pName = sale.painterId
        ? `${sale.painterId.firstName || ''} ${sale.painterId.lastName || ''}`.trim() || 'Painter'
        : 'Painter';
      activities.push({
        id: `sale-${sale._id}`,
        type: 'sale',
        timestamp: sale.date || sale.createdAt,
        title: 'Sale Recorded',
        description: `${pName} logged sale of ₹${sale.totalAmount.toLocaleString()} (${sale.totalPoints} pts)`,
        meta: {
          saleId: sale._id.toString(),
          painterName: pName,
          amount: sale.totalAmount,
          points: sale.totalPoints,
          customerName: sale.customerId?.name || '',
        },
      });
    });

    // Map reward assignments
    recentAssignments.forEach((a) => {
      activities.push({
        id: `reward-${a._id}`,
        type: 'reward_assignment',
        timestamp: a.assignedAt || a.createdAt,
        title: 'Reward Assigned',
        description: `${a.qty}x ${a.rewardName} assigned to ${a.painterName}`,
        meta: {
          assignmentId: a._id.toString(),
          painterName: a.painterName,
          rewardName: a.rewardName,
          qty: a.qty,
          pointsAtAssignment: a.pointsAtAssignment,
        },
      });
    });

    // Map company rewards
    recentCompanyRewards.forEach((entry) => {
      const cName = entry.companyId?.name || 'Company';
      const itemsCount = entry.rewardItems?.length || 0;
      activities.push({
        id: `company-${entry._id}`,
        type: 'company_reward',
        timestamp: entry.createdAt,
        title: 'Company Reward Received',
        description: `Logged entry from ${cName} with ${itemsCount} reward item types`,
        meta: {
          entryId: entry._id.toString(),
          companyName: cName,
          saleValue: entry.saleValue,
          quantitySold: entry.quantitySold,
          rewardItemsCount: itemsCount,
        },
      });
    });

    // Sort descending by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      success: true,
      data: activities.slice(0, limit),
    });
  } catch (err) {
    next(err);
  }
};
