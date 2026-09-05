import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Transform output to map _id to id
customerSchema.methods.toJSON = function () {
  const c = this.toObject();
  c.id = String(c._id);
  return c;
};

const Customer =
  mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
