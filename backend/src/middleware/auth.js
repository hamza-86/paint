/**
 * JWT Authentication & Role Authorization Middleware — /src/middleware/auth.js
 *
 * Single-Shop Architecture:
 * - Roles: 'admin' (Shop Owner) and 'painter' (Painter)
 * - JWT payload contains: { userId, role } (no shopId/tenantId)
 *
 * Rules:
 * - 'admin' has full management permissions.
 * - 'painter' has read-only access to their own profile, points, sales, and rewards.
 * - A painter must NEVER be allowed to execute admin APIs.
 */

// TODO: Implement protect() middleware using jsonwebtoken to verify Bearer token
// and attach { userId, role } to req.user

/**
 * Middleware placeholder to verify JWT token.
 */
const protect = (req, res, next) => {
  // TODO: Extract and verify JWT token; attach decoded { userId, role } to req.user
  next();
};

/**
 * Middleware placeholder to restrict access by role ('admin' | 'painter').
 * @param {...('admin' | 'painter')} roles - Allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
  // TODO: Verify req.user.role is in allowed roles; return 403 Forbidden if not authorized
  next();
};

export { protect, authorize };
