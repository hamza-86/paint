/**
 * AdminOtp.js
 * ───────────
 * Stores pending OTPs for admin account-change operations.
 *
 * Security design:
 *   - OTP is stored as a bcrypt hash — never plaintext.
 *   - TTL index automatically removes expired documents.
 *   - `used` flag prevents OTP reuse after successful verification.
 *   - `attempts` field caps brute-force guesses at MAX_ATTEMPTS.
 */

import mongoose from 'mongoose';

const MAX_ATTEMPTS = 5;

const adminOtpSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['email_change', 'password_change'],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false, // Never returned in normal queries
    },
    /**
     * For email_change: stores the requested new email so we can apply it
     * after verification without re-submitting through the client.
     * Not used for password_change.
     */
    newEmail: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL: remove when expiresAt passes
    },
    attempts: {
      type: Number,
      default: 0,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

adminOtpSchema.statics.MAX_ATTEMPTS = MAX_ATTEMPTS;

const AdminOtp =
  mongoose.models.AdminOtp || mongoose.model('AdminOtp', adminOtpSchema);

export default AdminOtp;
