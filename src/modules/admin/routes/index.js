const express = require("express");
const router = express.Router();

const userRoutes = require("./user")
const credentialRoutes = require("./credential")

router.use("/user", userRoutes)
router.use("/credential", credentialRoutes)

module.exports = router;