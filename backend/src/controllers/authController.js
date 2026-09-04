import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Painter from '../models/Painter.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sign a JWT containing the minimum required payload.
 * @param {string} userId
 * @param {'admin'|'painter'} role
 */
const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

/**
 * Attach the JWT as an httpOnly cookie and send a JSON response.
 * Using cookies avoids exposing the token to JavaScript on the client.
 */
const sendTokenResponse = (res, statusCode, user, role) => {
  const token = signToken(String(user._id), role);

  const isProduction = process.env.NODE_ENV === 'production';
  const expiresInMs =
    parseInt(process.env.JWT_COOKIE_EXPIRES_DAYS || '1', 10) *
    24 *
    60 *
    60 *
    1000;

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: expiresInMs,
    path: '/',
  });

  const safeUser = {
    id: String(user._id),
    email: user.email,
    role,
    ...(role === 'painter' && user.firstName && { firstName: user.firstName }),
  };

  res.status(statusCode).json({
    success: true,
    message: 'Login successful',
    token,          // also returned in body for Bearer header clients
    user: safeUser,
  });
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Accepts both Admin and Painter credentials.
 * Returns a generic error for any authentication failure to prevent user enumeration.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Basic input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check Admin first (Admin table is small — always check)
    const admin = await Admin.findOne({ email: normalizedEmail }).select(
      '+password'
    );
    if (admin) {
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        // Generic error — do not reveal that the account exists
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }
      return sendTokenResponse(res, 200, admin, 'admin');
    }

    // 3. Check Painter
    const painter = await Painter.findOne({ email: normalizedEmail }).select(
      '+password'
    );
    if (painter) {
      // 3a. Reject deactivated painters before checking password
      if (painter.status === 'deactivated') {
        return res.status(403).json({
          success: false,
          message:
            'Your account has been deactivated. Please contact the shop owner.',
        });
      }

      const isMatch = await painter.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }
      return sendTokenResponse(res, 200, painter, 'painter');
    }

    // 4. No matching account found — use generic message
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's safe profile.
 * Requires the protect() middleware to run first.
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect() middleware
    const { userId, role } = req.user;

    let user;
    if (role === 'admin') {
      user = await Admin.findById(userId);
    } else {
      user = await Painter.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const safeUser = {
      id: String(user._id),
      email: user.email,
      role,
      ...(role === 'painter' && {
        firstName: user.firstName,
        photoUrl: user.photoUrl,
        status: user.status,
      }),
      ...(role === 'admin' && {
        hasChangedDefaultCredentials: user.hasChangedDefaultCredentials,
      }),
    };

    res.status(200).json({ success: true, user: safeUser });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clears the auth_token cookie and confirms logout.
 */
export const logout = async (req, res) => {
  res.cookie('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 0,
    path: '/',
  });

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
