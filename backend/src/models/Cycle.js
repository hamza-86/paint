import mongoose from 'mongoose';

const cycleSchema = new mongoose.Schema(
  {
    startDate: {
      type: Date,
      required: [true, 'Cycle start date is required'],
      index: true,
    },
    endDate: {
      type: Date,
      required: [true, 'Cycle end date is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Transform output to map _id to id
cycleSchema.methods.toJSON = function () {
  const cycle = this.toObject();
  cycle.id = String(cycle._id);
  return cycle;
};

const Cycle = mongoose.models.Cycle || mongoose.model('Cycle', cycleSchema);

export default Cycle;
