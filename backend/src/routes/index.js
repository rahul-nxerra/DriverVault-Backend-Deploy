const express = require("express");
const router = express.Router();

const authRoutes = require("../modules/auth/auth.routes");
const driverRoutes = require("../modules/driver/routes/driver.route");
router.use("/driver", driverRoutes);

router.use("/auth", authRoutes);

module.exports = router;
