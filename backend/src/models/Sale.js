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
    // Price snapshot at time of sale — immutable historical record
    pricePerUnit: {
      type: Number,
      required: true,
      min: [0, 'Price per unit cannot be negative'],
    },
    // Points snapshot at time of sale — immutable historical record
    pointsPerUnit: {
      type: Number,
      required: true,
      min: [0, 'Points per unit cannot be negative'],
    },
    pointsEarned: {
      type: Number,
      required: true,
      min: [0, 'Points earned cannot be negative'],
    },
    lineTotal: {
      type: Number,
      required: true,
      min: [0, 'Line total cannot be negative'],
    },
    // Item name snapshot for display without relying on Item document
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    painterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Painter',
      required: [true, 'Painter is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true,
    },
    cycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      required: [true, 'Cycle is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Sale date is required'],
      index: true,
    },
    billImageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    lineItems: {
      type: [lineItemSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A sale must have at least one line item.',
      },
    },
    totalPoints: {
      type: Number,
      required: true,
      min: [0, 'Total points cannot be negative'],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Transform output to map _id to id
saleSchema.methods.toJSON = function () {
  const sale = this.toObject();
  sale.id = String(sale._id);
  return sale;
};

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema);

export default Sale;
