import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [120, 'Company name cannot exceed 120 characters'],
    },
    details: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Company details cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'deactivated'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for searching and sorting
companySchema.index({ name: 1 });

// Transform output to map _id to id
companySchema.methods.toJSON = function () {
  const company = this.toObject();
  company.id = String(company._id);
  delete company.__v;
  return company;
};

const Company =
  mongoose.models.Company || mongoose.model('Company', companySchema);

export default Company;

