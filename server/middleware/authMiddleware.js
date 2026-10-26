const { verifyToken, extractTokenFromHeader } = require('../../shared/auth');

function authenticateToken(req, res, next) {
  const token = extractTokenFromHeader(req.headers['authorization']);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication token required.'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }

  req.user = decoded;
  next();
}

function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires '${requiredRole}' role.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
