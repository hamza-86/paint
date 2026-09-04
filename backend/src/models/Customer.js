import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Customer mobile number is required'],
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to help search and avoid duplicates
customerSchema.index({ name: 1, mobile: 1 });

const Customer =
  mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
