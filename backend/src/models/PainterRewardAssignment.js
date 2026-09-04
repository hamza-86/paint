import mongoose from 'mongoose';

const painterRewardAssignmentSchema = new mongoose.Schema(
  {
    painterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Painter',
      required: [true, 'Painter ID is required'],
      index: true,
    },
    rewardInventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RewardInventoryItem',
      required: [true, 'Reward inventory item ID is required'],
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      required: [true, 'Cycle ID is required'],
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

painterRewardAssignmentSchema.index({ painterId: 1, cycleId: 1 });

const PainterRewardAssignment =
  mongoose.models.PainterRewardAssignment ||
  mongoose.model('PainterRewardAssignment', painterRewardAssignmentSchema);

export default PainterRewardAssignment;
