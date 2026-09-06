import mongoose from 'mongoose';

const rewardTierSchema = new mongoose.Schema(
  {
    minPoints: {
      type: Number,
      required: [true, 'Minimum points are required'],
      min: [0, 'Minimum points cannot be negative'],
    },
    maxPoints: {
      type: Number,
      required: [true, 'Maximum points are required'],
      min: [0, 'Maximum points cannot be negative'],
    },
    suggestedInventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RewardInventoryItem',
      default: null,
    },
    suggestedRewardName: {
      type: String,
      required: [true, 'Suggested reward name is required'],
      trim: true,
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

rewardTierSchema.index({ minPoints: 1, maxPoints: 1 });

// Transform output to map _id to id
rewardTierSchema.methods.toJSON = function () {
  const tier = this.toObject();
  tier.id = String(tier._id);
  return tier;
};

const RewardTier =
  mongoose.models.RewardTier || mongoose.model('RewardTier', rewardTierSchema);

export default RewardTier;
