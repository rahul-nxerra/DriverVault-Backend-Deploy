exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: `Role (${req.user.role}) not allowed`,
      });
    }

    next();
  };
};
