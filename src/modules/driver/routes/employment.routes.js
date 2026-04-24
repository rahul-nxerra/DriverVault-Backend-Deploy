const express = require("express");
const router = express.Router();
const checkDriverAccess = require("../../../middlewares/checkDriverAccess");

const {
  createEmployment,
  getEmployment,
  updateEmployment,
  deleteEmployment,
  getDriverEmploymentById,
} = require("../controllers/employment.controller");

const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");

// ================= DRIVER ROUTES =================
router.post("/", protect, authorizeRoles("driver"), createEmployment);

router.get("/", protect, authorizeRoles("driver"), getEmployment);

router.put("/:id", protect, authorizeRoles("driver"), updateEmployment);

router.delete("/:id", protect, authorizeRoles("driver"), deleteEmployment);

// ================= CARRIER / ADMIN ROUTE =================
router.get(
  "/view/:driverId",
  protect,
  authorizeRoles("carrier", "admin"),
  checkDriverAccess("employment"), // ✅ Plan B
  getDriverEmploymentById
);

module.exports = router;