const express = require("express");
const router = express.Router();
const validate = require("../../middlewares/validate.middleware");
const { registerSchema, loginSchema } = require("../../validators/auth.validator");

const asyncHandler = require("express-async-handler");
const authController = require("./auth.controller");

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login),
);

module.exports = router;
