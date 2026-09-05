import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';

// ── GET /api/customers ───────────────────────────────────────────────────────

export const getCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search } = req.query;
    const filter = {};

    if (search && String(search).trim()) {
      const s = String(search).trim();
      filter.$or = [
        { name: { $regex: s, $options: 'i' } },
        { mobile: { $regex: s, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
    ]);

    // Fetch sale counts per customer on this page
    const customerIds = customers.map((c) => c._id);
    const saleCounts = await Sale.aggregate([
      { $match: { customerId: { $in: customerIds } } },
      { $group: { _id: '$customerId', count: { $sum: 1 }, lastSale: { $max: '$date' } } },
    ]);
    const saleCountMap = {};
    for (const sc of saleCounts) {
      saleCountMap[String(sc._id)] = { count: sc.count, lastSale: sc.lastSale };
    }

    const mapped = customers.map((c) => {
      const cid = String(c._id);
      return {
        ...c,
        id: cid,
        _id: undefined,
        salesCount: saleCountMap[cid]?.count || 0,
        lastSaleDate: saleCountMap[cid]?.lastSale || null,
      };
    });

    res.status(200).json({
      success: true,
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/customers/:id ───────────────────────────────────────────────────

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID format.' });
    }

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Fetch sales count
    const salesCount = await Sale.countDocuments({ customerId: customer._id });

    res.status(200).json({
      success: true,
      data: {
        ...customer,
        id: String(customer._id),
        _id: undefined,
        salesCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
