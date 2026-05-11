const express = require("express");
const router = express.Router();
const validate = require("../../middlewares/validate.middleware");
const { registerSchema, loginSchema } = require("./auth.validator");

const asyncHandler = require("express-async-handler");
const authController = require("./auth.controller");
const { authLimiter } = require("../../middlewares/rateLimit.middleware");

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login),
);

module.exports = router;
