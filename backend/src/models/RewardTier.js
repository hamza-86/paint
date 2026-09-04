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
    suggestedRewardName: {
      type: String,
      required: [true, 'Suggested reward name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

rewardTierSchema.index({ minPoints: 1, maxPoints: 1 });

const RewardTier =
  mongoose.models.RewardTier || mongoose.model('RewardTier', rewardTierSchema);

export default RewardTier;
