const rateLimit = require("express-rate-limit");

/**
 * 🔑 Key Generator for Authentication
 * Shared between middleware and controller (for resets).
 */
const authKeyGenerator = (req) => {
  // Composite key: IP + Lowercased Email
  // This prevents shared network lockouts (e.g., Driver A doesn't block Driver B)
  const email = req.body?.email?.toLowerCase() || "anonymous";
  return `${req.ip}_${email}`;
};

/**
 * 🔒 STRICT: Authentication Rate Limiter
 * Used for login, registration, and future password resets.
 * Prevents brute-force attacks by using a composite key (IP + Email).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each (IP + Email) pair to 5 requests per window
  message: {
    msg: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts (status >= 400)
  keyGenerator: authKeyGenerator,
});

/**
 * 🔍 MODERATE: Search & Public Profile Limiter
 * Used for driver search and public profile views.
 * Reduces scraping and enumeration risk.
 */
const searchLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // Limit each IP to 30 requests per 10 minutes
  message: {
    msg: "Search limit exceeded. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 📊 MODERATE: Analytics & Reports Limiter
 * Used for carrier analytics and dashboard data.
 * Prevents excessive API flooding.
 */
const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, 
  message: {
    msg: "Analytics request limit reached. Please try again in a few minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 🌐 GENERAL: Authenticated API Traffic
 * Standard limit for general dashboard navigation and CRUD.
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    msg: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  authKeyGenerator,
  searchLimiter,
  analyticsLimiter,
  apiLimiter,
};
