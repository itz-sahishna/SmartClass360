// Role-based access control middleware
const roleGuard = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
  }
  next();
};

module.exports = roleGuard;
