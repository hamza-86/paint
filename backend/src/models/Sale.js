import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    pointsEarned: {
      type: Number,
      required: [true, 'Points earned is required'],
      min: [0, 'Points cannot be negative'],
    },
  },
  { _id: true }
);

const saleSchema = new mongoose.Schema(
  {
    painterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Painter',
      required: [true, 'Painter ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required'],
      index: true,
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
    billImageUrl: {
      type: String,
      default: '',
    },
    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: 'Sale must have at least one line item',
      },
    },
    totalPoints: {
      type: Number,
      required: [true, 'Total points are required'],
      min: [0, 'Total points cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
saleSchema.index({ painterId: 1, cycleId: 1 });
saleSchema.index({ cycleId: 1, date: -1 });

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);

export default Sale;
