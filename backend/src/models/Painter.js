import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const painterSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [80, 'First name cannot exceed 80 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    photoUrl: {
      type: String,
      default: '',
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
    currentCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cycle',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password with bcrypt before saving
painterSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
painterSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Strip password from output and map _id to id
painterSchema.methods.toJSON = function () {
  const painter = this.toObject();
  painter.id = String(painter._id);
  delete painter.password;
  return painter;
};

const Painter =
  mongoose.models.Painter || mongoose.model('Painter', painterSchema);

export default Painter;
