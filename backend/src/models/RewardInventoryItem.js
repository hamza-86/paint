import mongoose from 'mongoose';

const rewardInventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Reward item name is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    sourceCompanyRewardEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyRewardEntry',
      default: null,
    },
    totalQty: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Total quantity cannot be negative'],
    },
    remainingQty: {
      type: Number,
      required: [true, 'Remaining quantity is required'],
      min: [0, 'Remaining quantity cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

rewardInventoryItemSchema.index({ remainingQty: 1 });

const RewardInventoryItem =
  mongoose.models.RewardInventoryItem ||
  mongoose.model('RewardInventoryItem', rewardInventoryItemSchema);

export default RewardInventoryItem;
