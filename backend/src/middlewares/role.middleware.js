exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {

    // Extra safety check
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        msg: "User not authenticated"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: `Role (${req.user.role}) not allowed`
      });
    }

    next();
  };
};