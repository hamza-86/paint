import mongoose from 'mongoose';

const rewardItemEntrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Reward item name is required'],
      trim: true,
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
      default: 0,
      min: 0,
    },
    saleValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardReceivedDescription: {
      type: String,
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

const CompanyRewardEntry =
  mongoose.models.CompanyRewardEntry ||
  mongoose.model('CompanyRewardEntry', companyRewardEntrySchema);

export default CompanyRewardEntry;
