const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");

// 🔓 Public test
router.get("/public", (req, res) => {
  res.json({ msg: "Public route working" });
});

// 🔐 Protected route (any logged-in user)
router.get("/profile", protect, (req, res) => {
  res.json({
    msg: "Protected route working",
    user: req.user,
  });
});

// 🔒 Role-based route (only driver)
router.get("/driver", protect, authorizeRoles("driver"), (req, res) => {
  res.json({ msg: "Driver route working" });
});

// 🔒 Role-based route (only carrier)
router.get("/carrier", protect, authorizeRoles("carrier"), (req, res) => {
  res.json({ msg: "Carrier route working" });
});

module.exports = router;
