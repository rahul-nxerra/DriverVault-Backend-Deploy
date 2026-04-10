const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to request
      req.user = decoded;

      return next(); // ✅ important: return
    } catch (error) {
      return res.status(401).json({
        msg: "Not authorized, token failed"
      });
    }
  }

  // No token
  return res.status(401).json({
    msg: "No token, authorization denied"
  });
};