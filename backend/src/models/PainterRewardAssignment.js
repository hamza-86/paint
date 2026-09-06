import mongoose from 'mongoose';

/**
 * PainterRewardAssignment — Part 12
 *
 * Records each physical reward assigned to a painter by an admin.
 * Snapshot fields (painterName, rewardName) preserve historical accuracy
 * even if the source painter or inventory item is later renamed/deactivated.
 *
 * Zero-deletion policy: records are never deleted.
 * Inventory decrement is atomic with assignment creation (see controller).
 */
const painterRewardAssignmentSchema = new mongoose.Schema(
  {
    // ── Core References ──────────────────────────────────────────────────────
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
      index: true,
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      required: [true, 'Cycle ID is required'],
      index: true,
    },

    // ── Quantity ─────────────────────────────────────────────────────────────
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },

    // ── Snapshot fields (historical integrity) ────────────────────────────────
    painterName: {
      type: String,
      required: [true, 'Painter name snapshot is required'],
      trim: true,
    },
    rewardName: {
      type: String,
      required: [true, 'Reward name snapshot is required'],
      trim: true,
    },
    // Points the painter had at the time of assignment (audit trail)
    pointsAtAssignment: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Tier suggested at time of assignment (may be null if no tier matched)
    suggestedTierName: {
      type: String,
      default: '',
    },

    // ── Admin metadata ────────────────────────────────────────────────────────
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
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

// Compound indexes for common query patterns
painterRewardAssignmentSchema.index({ painterId: 1, cycleId: 1 });
painterRewardAssignmentSchema.index({ cycleId: 1, createdAt: -1 });
painterRewardAssignmentSchema.index({ rewardInventoryItemId: 1, createdAt: -1 });

// Transform output
painterRewardAssignmentSchema.methods.toJSON = function () {
  const doc = this.toObject();
  doc.id = String(doc._id);
  delete doc.__v;
  return doc;
};

const PainterRewardAssignment =
  mongoose.models.PainterRewardAssignment ||
  mongoose.model('PainterRewardAssignment', painterRewardAssignmentSchema);

export default PainterRewardAssignment;
