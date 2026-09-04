import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: [true, 'Cycle start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'Cycle end date is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Cycle = mongoose.models.Cycle || mongoose.model('Cycle', cycleSchema);

export default Cycle;
