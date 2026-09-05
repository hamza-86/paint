import mongoose from 'mongoose';
import Painter from '../models/Painter.js';

/**
 * Helper to escape special characters for regex safety
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/painters
 * List all painters with pagination, search, status filter, and overall counts.
 * Admin only.
 */
export const getPainters = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    const filter = {};

    // Status filter: 'active', 'deactivated', or 'all' (omit filter if 'all')
    if (status && status !== 'all') {
      if (['active', 'deactivated'].includes(status)) {
        filter.status = status;
      }
    }

    // Search filter across firstName, mobile, and email
    if (search && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
      ];
    }

    // Run query, count, and global stats in parallel
    const [painters, totalMatching, totalPainters, activePainters, deactivatedPainters] =
      await Promise.all([
        Painter.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Painter.countDocuments(filter),
        Painter.countDocuments(),
        Painter.countDocuments({ status: 'active' }),
        Painter.countDocuments({ status: 'deactivated' }),
      ]);

    const totalPages = Math.ceil(totalMatching / limit) || 1;

    res.status(200).json({
      success: true,
      painters: painters.map((p) => p.toJSON()),
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages,
      },
      counts: {
        total: totalPainters,
        active: activePainters,
        deactivated: deactivatedPainters,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/painters/:id
 * Retrieve a single painter's profile.
 * Admin only.
 */
export const getPainterById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid painter ID format.',
      });
    }

    const painter = await Painter.findById(id);

    if (!painter) {
      return res.status(404).json({
        success: false,
        message: 'Painter not found.',
      });
    }

    res.status(200).json({
      success: true,
      painter: painter.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/painters
 * Register a new painter account.
 * Admin only.
 */
export const createPainter = async (req, res, next) => {
  try {
    const { firstName, mobile, email, password, photoUrl } = req.body;

    // 1. Validation: First Name
    if (!firstName || !firstName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'First name is required.',
      });
    }
    if (firstName.trim().length > 80) {
      return res.status(400).json({
        success: false,
        message: 'First name cannot exceed 80 characters.',
      });
    }

    // 2. Validation: Mobile
    if (!mobile || !mobile.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required.',
      });
    }
    const mobileTrimmed = mobile.trim();
    const mobileRegex = /^[+]?[\d\s-]{7,15}$/;
    if (!mobileRegex.test(mobileTrimmed)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid mobile number.',
      });
    }

    // 3. Validation: Email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 4. Validation: Password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // 5. Check if email already exists
    const existingPainter = await Painter.findOne({ email: normalizedEmail });
    if (existingPainter) {
      return res.status(409).json({
        success: false,
        message: 'Painter with this email already exists.',
      });
    }

    // 6. Create Painter (password will be automatically hashed by pre-save hook)
    const painter = await Painter.create({
      firstName: firstName.trim(),
      mobile: mobileTrimmed,
      email: normalizedEmail,
      password,
      photoUrl: photoUrl ? photoUrl.trim() : '',
      status: 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Painter created successfully.',
      painter: painter.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/painters/:id/deactivate
 * Deactivate a painter account. Does NOT delete records.
 * Admin only.
 */
export const deactivatePainter = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid painter ID format.',
      });
    }

    const painter = await Painter.findById(id);

    if (!painter) {
      return res.status(404).json({
        success: false,
        message: 'Painter not found.',
      });
    }

    if (painter.status === 'deactivated') {
      return res.status(200).json({
        success: true,
        message: 'Painter is already deactivated.',
        painter: painter.toJSON(),
      });
    }

    painter.status = 'deactivated';
    await painter.save();

    res.status(200).json({
      success: true,
      message: 'Painter deactivated successfully.',
      painter: painter.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/painters/:id/activate
 * Reactivate a deactivated painter account.
 * Admin only.
 */
export const activatePainter = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid painter ID format.',
      });
    }

    const painter = await Painter.findById(id);

    if (!painter) {
      return res.status(404).json({
        success: false,
        message: 'Painter not found.',
      });
    }

    if (painter.status === 'active') {
      return res.status(200).json({
        success: true,
        message: 'Painter is already active.',
        painter: painter.toJSON(),
      });
    }

    painter.status = 'active';
    await painter.save();

    res.status(200).json({
      success: true,
      message: 'Painter activated successfully.',
      painter: painter.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};
