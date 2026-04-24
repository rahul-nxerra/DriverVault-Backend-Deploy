const express = require("express");
const router = express.Router();

const validate = require("../../../middlewares/validate.middleware");
const {
  requestAccessSchema,
} = require("../../common/validators/accessRequest.validator");

const asyncHandler = require("express-async-handler");
const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");

const { requestAccess } = require("../controllers/accessRequest.controller");

// ================= CARRIER =================

// Request access to driver data
router.post(
  "/",
  protect,
  authorizeRoles("carrier"),
  validate(requestAccessSchema),
  asyncHandler(requestAccess)
);

module.exports = router;