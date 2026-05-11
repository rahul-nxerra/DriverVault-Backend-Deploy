const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const driverRoutes = require("../modules/driver/routes/driver.route");
const carrierRoutes = require("../modules/carrier/routes/carrier.route");
const { apiLimiter } = require("../middlewares/rateLimit.middleware");

router.use("/auth", authRoutes);
router.use("/driver", apiLimiter, driverRoutes);
router.use("/carrier", apiLimiter, carrierRoutes);

module.exports = router;
