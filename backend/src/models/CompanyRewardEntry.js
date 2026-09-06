import mongoose from 'mongoose';

const rewardItemEntrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Reward item name is required'],
      trim: true,
      maxlength: [120, 'Reward item name cannot exceed 120 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Reward quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const companyRewardEntrySchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    dateFrom: {
      type: Date,
      required: [true, 'Start date (dateFrom) is required'],
    },
    dateTo: {
      type: Date,
      required: [true, 'End date (dateTo) is required'],
    },
    quantitySold: {
      type: Number,
      required: [true, 'Quantity sold is required'],
      default: 0,
      min: [0, 'Quantity sold cannot be negative'],
    },
    saleValue: {
      type: Number,
      required: [true, 'Sale value is required'],
      default: 0,
      min: [0, 'Sale value cannot be negative'],
    },
    rewardReceivedDescription: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, 'Reward description cannot exceed 500 characters'],
      default: '',
    },
    rewardItems: {
      type: [rewardItemEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for overlap detection per company
companyRewardEntrySchema.index({ companyId: 1, dateFrom: 1, dateTo: 1 });

// Transform output to map _id to id
companyRewardEntrySchema.methods.toJSON = function () {
  const entry = this.toObject();
  entry.id = String(entry._id);
  delete entry.__v;
  return entry;
};

const CompanyRewardEntry =
  mongoose.models.CompanyRewardEntry ||
  mongoose.model('CompanyRewardEntry', companyRewardEntrySchema);

export default CompanyRewardEntry;
