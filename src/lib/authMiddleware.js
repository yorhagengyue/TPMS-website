/**
 * Authentication Middleware
 * 
 * This module provides Express middleware for JWT authentication
 */

const { verifyToken, hasRole } = require('./auth');

/**
 * Express middleware to authenticate requests using JWT token
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
const authenticate = async (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authorization token is required' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify token
  const decoded = await verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
  
  // Attach user to request
  req.user = decoded;
  next();
};

/**
 * Express middleware to authorize requests based on user role
 * @param {String|Array} roles Allowed role(s)
 * @returns {Function} Express middleware
 */
const authorize = (roles) => {
  return (req, res, next) => {
    // authenticate middleware should be used before this middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    if (!hasRole(req.user, roles)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

/**
 * Express middleware to authorize requests if they belong to the user
 * Parameter to check should be in req.params.userId
 * @returns {Function} Express middleware
 */
const authorizeOwner = () => {
  return (req, res, next) => {
    // authenticate middleware should be used before this middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user ID matches the requested resource owner
    const paramUserId = parseInt(req.params.userId);
    
    if (isNaN(paramUserId) || req.user.id !== paramUserId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access your own resources' 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwner
}; 