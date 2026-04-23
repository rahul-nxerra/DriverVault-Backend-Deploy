const express = require("express");
const router = express.Router();
const upload = require("../../../middlewares/upload.middleware");

const disputeController = require("../controllers/dispute.controller");

const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const asyncHandler = require("express-async-handler");

// 🔥 ADD VALIDATION
const validate = require("../../../middlewares/validate.middleware");
const { createDisputeSchema } = require("../validators/dispute.validator");

// ================= ROUTES =================

// ✅ CREATE + GET ALL
router
  .route("/")
  .post(
    protect,
    authorizeRoles("driver"),
    upload.single("evidence"),
    validate(createDisputeSchema),
    asyncHandler(disputeController.createDispute),
  )
  .get(
    protect,
    authorizeRoles("driver"),
    asyncHandler(disputeController.getMyDisputes),
  );

// ✅ SINGLE + DELETE
router
  .route("/:id")
  .get(
    protect,
    authorizeRoles("driver"),
    asyncHandler(disputeController.getDisputeById),
  )
  .delete(
    protect,
    authorizeRoles("driver"),
    asyncHandler(disputeController.deleteDispute),
  );

module.exports = router;
