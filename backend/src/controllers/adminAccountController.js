/**
 * adminAccountController.js
 * ─────────────────────────
 * Handles Admin email-change and password-change with OTP verification.
 *
 * All routes require:
 *   - protect()       — valid JWT (authenticated admin session)
 *   - authorize('admin') — role check
 *
 * Security invariants:
 *   - OTP is 6 cryptographically-random digits.
 *   - OTP is hashed with bcrypt (cost 10) before storage — never stored plaintext.
 *   - OTP is NEVER returned in any API response body.
 *   - OTP is NEVER logged (not even in dev mode).
 *   - Verification is capped at MAX_ATTEMPTS per OTP.
 *   - Resend is rate-limited to 3 OTPs per purpose per 15-minute window.
 *   - OTP is single-use (marked used:true on success).
 *   - Expired OTPs are automatically removed by MongoDB TTL index.
 *   - Passwords are NEVER returned in any API response.
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import AdminOtp from '../models/AdminOtp.js';
import { sendOtpEmail } from '../services/emailService.js';

const OTP_EXPIRES_MINUTES = 10;
const RESEND_WINDOW_MINUTES = 15;
const RESEND_MAX_PER_WINDOW = 3;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure 6-digit OTP string.
 * Uses crypto.randomInt for uniform distribution.
 */
function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // '100000'–'999999'
}

/**
 * Check whether the admin has exceeded the resend rate limit.
 * Returns true if they are allowed to request another OTP.
 */
async function checkResendAllowed(adminId, purpose) {
  const windowStart = new Date(
    Date.now() - RESEND_WINDOW_MINUTES * 60 * 1000
  );
  const recentCount = await AdminOtp.countDocuments({
    adminId,
    purpose,
    createdAt: { $gte: windowStart },
  });
  return recentCount < RESEND_MAX_PER_WINDOW;
}

/**
 * Find the most recent, non-expired, unused OTP for a given admin+purpose.
 * Selects otpHash (normally excluded).
 */
async function findActiveOtp(adminId, purpose) {
  return AdminOtp.findOne({
    adminId,
    purpose,
    used: false,
    expiresAt: { $gt: new Date() },
  })
    .select('+otpHash')
    .sort({ createdAt: -1 });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/account/request-email-change
 *
 * Body: { newEmail, currentPassword }
 *
 * 1. Verifies the admin's current password.
 * 2. Validates the new email is not already in use.
 * 3. Checks resend rate limit.
 * 4. Generates OTP, hashes it, stores the record.
 * 5. Sends OTP to the NEW email address.
 * 6. Responds with success (no OTP in response).
 */
export const requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail, currentPassword } = req.body;
    const adminId = req.user.userId;

    // 1. Input validation
    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'New email and current password are required.',
      });
    }

    const normalizedNewEmail = newEmail.toLowerCase().trim();

    // Basic email format check
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(normalizedNewEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // 2. Load admin with password
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    // 3. Verify current password
    const passwordMatch = await admin.comparePassword(currentPassword);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // 4. Ensure new email is different from current
    if (normalizedNewEmail === admin.email) {
      return res.status(400).json({
        success: false,
        message: 'New email must be different from the current email.',
      });
    }

    // 5. Check new email is not already used by another admin or painter
    const existingAdmin = await Admin.findOne({ email: normalizedNewEmail });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already in use.',
      });
    }

    // 6. Check resend rate limit
    const allowed = await checkResendAllowed(adminId, 'email_change');
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please wait ${RESEND_WINDOW_MINUTES} minutes before requesting another code.`,
      });
    }

    // 7. Generate OTP & hash it
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // 8. Attempt email delivery FIRST
    //    If delivery fails, do not leave a usable or rate-counted OTP in DB.
    await sendOtpEmail(normalizedNewEmail, otp, 'email_change');

    // 9. Persist the record ONLY after delivery succeeds
    await AdminOtp.create({
      adminId,
      purpose: 'email_change',
      otpHash,
      newEmail: normalizedNewEmail,
      expiresAt,
    });

    // 10. Respond — OTP is NOT included
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedNewEmail}. It expires in ${OTP_EXPIRES_MINUTES} minutes.`,
      sentTo: normalizedNewEmail,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /api/admin/account/verify-email-change
 *
 * Body: { otp }
 *
 * 1. Finds the active OTP for this admin + email_change purpose.
 * 2. Verifies the OTP (with attempt limiting).
 * 3. Updates the admin's email to newEmail stored in the OTP record.
 * 4. Marks OTP as used.
 */
export const verifyEmailChange = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const adminId = req.user.userId;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required.',
      });
    }

    // Find active OTP record
    const otpRecord = await findActiveOtp(adminId, 'email_change');
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No valid verification code found. Please request a new one.',
      });
    }

    // Check attempt limit
    if (otpRecord.attempts >= AdminOtp.MAX_ATTEMPTS) {
      otpRecord.used = true;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message:
          'Too many incorrect attempts. Please request a new verification code.',
      });
    }

    // Verify OTP hash
    const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = AdminOtp.MAX_ATTEMPTS - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // OTP is valid — update admin email
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    const newEmail = otpRecord.newEmail;
    admin.email = newEmail;
    await admin.save();

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Email address updated successfully.',
      newEmail,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/account/request-password-change
 *
 * Body: { currentPassword, newPassword, confirmNewPassword }
 *
 * 1. Verifies the admin's current password.
 * 2. Validates the new password matches confirmation.
 * 3. Checks resend rate limit.
 * 4. Generates OTP, hashes and stores it. Also hashes and stores the new
 *    password hash so it can be applied after OTP verification.
 * 5. Sends OTP to the admin's CURRENT (verified) email.
 * 6. Responds with success (no OTP, no password in response).
 */
export const requestPasswordChange = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const adminId = req.user.userId;

    // 1. Input validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message:
          'Current password, new password, and confirmation are required.',
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters.',
      });
    }

    // 2. Load admin with password
    const admin = await Admin.findById(adminId).select('+password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    // 3. Verify current password
    const passwordMatch = await admin.comparePassword(currentPassword);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    // 4. Ensure new password is different
    const isSamePassword = await admin.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from the current password.',
      });
    }

    // 5. Check resend rate limit
    const allowed = await checkResendAllowed(adminId, 'password_change');
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: `Too many requests. Please wait ${RESEND_WINDOW_MINUTES} minutes before requesting another code.`,
      });
    }

    // 6. Pre-hash the new password so we store it securely (bcrypt cost 10).
    //    We store the hash — not the plaintext — in the OTP record.
    //    This way, after OTP verification we can simply write the stored hash
    //    directly to Admin.password, bypassing the pre-save hook (which would
    //    double-hash). We mark the field modified=false for that save.
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 7. Generate OTP
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    // 8. Attempt email delivery to admin's current email FIRST
    //    If delivery fails, do not leave a usable or rate-counted OTP in DB.
    await sendOtpEmail(admin.email, otp, 'password_change');

    // 9. Persist the record ONLY after delivery succeeds
    //    Store the pre-hashed new password in the OTP record's newEmail field.
    await AdminOtp.create({
      adminId,
      purpose: 'password_change',
      otpHash,
      newEmail: newPasswordHash,
      expiresAt,
    });

    return res.status(200).json({
      success: true,
      message: `Verification code sent to your registered email. It expires in ${OTP_EXPIRES_MINUTES} minutes.`,
      sentTo: admin.email,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /api/admin/account/verify-password-change
 *
 * Body: { otp }
 *
 * 1. Finds the active OTP for this admin + password_change purpose.
 * 2. Verifies the OTP (with attempt limiting).
 * 3. Applies the pre-hashed new password directly to the Admin document.
 * 4. Marks OTP as used.
 */
export const verifyPasswordChange = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const adminId = req.user.userId;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required.',
      });
    }

    // Find active OTP record
    const otpRecord = await findActiveOtp(adminId, 'password_change');
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No valid verification code found. Please request a new one.',
      });
    }

    // Check attempt limit
    if (otpRecord.attempts >= AdminOtp.MAX_ATTEMPTS) {
      otpRecord.used = true;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message:
          'Too many incorrect attempts. Please request a new verification code.',
      });
    }

    // Verify OTP hash
    const isValid = await bcrypt.compare(String(otp).trim(), otpRecord.otpHash);
    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = AdminOtp.MAX_ATTEMPTS - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // OTP is valid — apply the pre-hashed password directly.
    // Using updateOne bypasses the pre-save bcrypt hook (which would double-hash).
    await Admin.updateOne(
      { _id: adminId },
      { $set: { password: otpRecord.newEmail, hasChangedDefaultCredentials: true } }
    );

    // Mark OTP as used
    otpRecord.used = true;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. Please log in again with your new password.',
    });
  } catch (err) {
    next(err);
  }
};
