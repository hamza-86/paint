import jwt from 'jsonwebtoken';

/**
 * protect()
 * ─────────
 * Verifies a JWT from either:
 *   1. Authorization: Bearer <token>  (REST clients, Postman, future mobile)
 *   2. auth_token httpOnly cookie     (browser sessions)
 *
 * On success, attaches { userId, role } to req.user and calls next().
 * On failure, returns 401 Unauthorized.
 */
const protect = (req, res, next) => {
  try {
    let token;

    // 1. Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fall back to httpOnly cookie
    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // 3. Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
};

/**
 * authorize(...roles)
 * ───────────────────
 * Role-based access control middleware.
 * Must be used AFTER protect().
 *
 * Example usage:
 *   router.delete('/painters/:id', protect, authorize('admin'), deleteHandler);
 *   router.get('/me', protect, authorize('admin', 'painter'), getHandler);
 *
 * A painter calling an admin-only endpoint will receive 403 Forbidden.
 * This enforces authorization at the API level — not just the UI.
 *
 * @param {...('admin'|'painter')} roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}.`,
    });
  }
  next();
};

export { protect, authorize };
