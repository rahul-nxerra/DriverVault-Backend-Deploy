const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");

// Protected route (any logged-in user)
router.get("/profile", protect, (req, res) => {
  res.json({
    msg: "Profile accessed",
    user: req.user,
  });
});

// Only driver
router.get("/driver", protect, authorizeRoles("driver"), (req, res) => {
  res.json({ msg: "Driver route accessed" });
});

module.exports = router;
