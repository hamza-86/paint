import mongoose from 'mongoose';

const rewardInventoryItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Reward item name is required'],
      trim: true,
      maxlength: [120, 'Reward item name cannot exceed 120 characters'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    sourceCompanyRewardEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyRewardEntry',
      required: [true, 'Source company reward entry ID is required'],
      index: true,
    },
    sourceCompanyRewardItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Source company reward item ID is required'],
      index: true,
    },
    totalQty: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [1, 'Total quantity must be at least 1'],
    },
    remainingQty: {
      type: Number,
      required: [true, 'Remaining quantity is required'],
      min: [0, 'Remaining quantity cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'deactivated'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound and lookup indexes
rewardInventoryItemSchema.index({ sourceCompanyRewardEntryId: 1, sourceCompanyRewardItemId: 1 });
rewardInventoryItemSchema.index({ status: 1, remainingQty: 1 });

// Transform output to expose id and remove __v
rewardInventoryItemSchema.methods.toJSON = function () {
  const item = this.toObject();
  item.id = String(item._id);
  delete item.__v;
  return item;
};

const RewardInventoryItem =
  mongoose.models.RewardInventoryItem ||
  mongoose.model('RewardInventoryItem', rewardInventoryItemSchema);

export default RewardInventoryItem;
