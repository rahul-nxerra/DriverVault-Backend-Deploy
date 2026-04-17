const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const driverRoutes = require("../modules/driver/routes/driver.route");
const carrierRoutes = require("../modules/carrier/routes/carrier.route");

router.use("/auth", authRoutes);
router.use("/driver", driverRoutes);
router.use("/api/carrier", carrierRoutes);


module.exports = router;
