import mongoose from 'mongoose';
import Company from '../models/Company.js';

/**
 * Helper to escape regex special characters
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET /api/companies
 * List companies with pagination, search by name, status filter, and name ascending sort.
 * Admin only.
 */
export const getCompanies = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const { search, status } = req.query;

    const filter = {};

    // Status filter: 'active', 'deactivated', or 'all'
    // Default to 'active' if omitted, matching requirement
    if (status) {
      if (status !== 'all' && ['active', 'deactivated'].includes(status)) {
        filter.status = status;
      }
    } else {
      filter.status = 'active';
    }

    // Search by company name (case-insensitive)
    if (search && search.trim()) {
      const sanitizedSearch = escapeRegex(search.trim());
      filter.name = { $regex: new RegExp(sanitizedSearch, 'i') };
    }

    // Parallel retrieval of paginated data and counts for top stats
    const [companies, totalMatching, totalCompanies, activeCompanies, deactivatedCompanies] =
      await Promise.all([
        Company.find(filter)
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit),
        Company.countDocuments(filter),
        Company.countDocuments(),
        Company.countDocuments({ status: 'active' }),
        Company.countDocuments({ status: 'deactivated' }),
      ]);

    const totalPages = Math.ceil(totalMatching / limit) || 1;

    return res.status(200).json({
      success: true,
      data: companies.map((c) => c.toJSON()),
      pagination: {
        page,
        limit,
        total: totalMatching,
        totalPages,
      },
      counts: {
        total: totalCompanies,
        active: activeCompanies,
        deactivated: deactivatedCompanies,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/companies/:id
 * Retrieve a single company by ID.
 * Admin only.
 */
export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: company.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/companies
 * Create a new company master record.
 * Admin only.
 */
export const createCompany = async (req, res, next) => {
  try {
    const { name, details } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required and cannot be blank.',
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Company name cannot exceed 120 characters.',
      });
    }

    const trimmedDetails = details !== undefined ? String(details).trim() : '';
    if (trimmedDetails.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Company details cannot exceed 500 characters.',
      });
    }

    // Check for duplicate ACTIVE company name (case-insensitive)
    const existingActive = await Company.findOne({
      status: 'active',
      name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: 'A company with this name already exists.',
      });
    }

    const company = await Company.create({
      name: trimmedName,
      details: trimmedDetails,
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      message: 'Company created successfully.',
      data: company.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/companies/:id
 * Update company name and details.
 * Admin only.
 */
export const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    const { name, details } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Company name cannot be blank.',
        });
      }

      const trimmedName = name.trim();
      if (trimmedName.length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Company name cannot exceed 120 characters.',
        });
      }

      // Check if another ACTIVE company has this name (case-insensitive)
      const existingActive = await Company.findOne({
        _id: { $ne: company._id },
        status: 'active',
        name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') },
      });

      if (existingActive) {
        return res.status(400).json({
          success: false,
          message: 'A company with this name already exists.',
        });
      }

      company.name = trimmedName;
    }

    if (details !== undefined) {
      const trimmedDetails = String(details).trim();
      if (trimmedDetails.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Company details cannot exceed 500 characters.',
        });
      }
      company.details = trimmedDetails;
    }

    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully.',
      data: company.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/companies/:id/deactivate
 * Deactivate an existing company master record.
 * Admin only.
 */
export const deactivateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    company.status = 'deactivated';
    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company deactivated successfully.',
      data: company.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/companies/:id/activate
 * Reactivate a deactivated company master record.
 * Admin only.
 */
export const activateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID format.',
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    // Check if another ACTIVE company already has the same name (case-insensitive)
    const existingActive = await Company.findOne({
      _id: { $ne: company._id },
      status: 'active',
      name: { $regex: new RegExp(`^${escapeRegex(company.name)}$`, 'i') },
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate company. An active company with this name already exists.',
      });
    }

    company.status = 'active';
    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company activated successfully.',
      data: company.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};
