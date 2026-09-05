import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [120, 'Item name cannot exceed 120 characters'],
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
      min: [0, 'Points cannot be negative'],
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: '',
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

// Indexes for searching and filtering
itemSchema.index({ name: 1, brand: 1 });
itemSchema.index({ category: 1 });

// Transform output to map _id to id
itemSchema.methods.toJSON = function () {
  const item = this.toObject();
  item.id = String(item._id);
  return item;
};

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

export default Item;
