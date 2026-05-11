const Joi = require("joi");

// ================= REGISTER =================
const registerSchema = Joi.object({
  email: Joi.string().email().required(),

  password: Joi.string().min(6).required(),

  role: Joi.string()
    .valid("driver", "carrier")
    .required(),

  // ================= DRIVER =================
  firstName: Joi.string().trim().when("role", {
    is: "driver",
    then: Joi.required(),
    otherwise: Joi.forbidden(), // ❌ prevent carrier from sending
  }),

  lastName: Joi.string().trim().when("role", {
    is: "driver",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  licenseType: Joi.string()
    .valid("cdl-a", "cdl-b", "non-cdl")
    .when("role", {
      is: "driver",
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),

  // ================= CARRIER =================
  dotNumber: Joi.string().when("role", {
    is: "carrier",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  companyName: Joi.string().trim().when("role", {
    is: "carrier",
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
})
  .required()
  .options({ abortEarly: false }); // 🔥 show all errors

// ================= LOGIN =================
const loginSchema = Joi.object({
  expectedRole: Joi.string().valid("driver", "carrier", "admin").required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})
  .required()
  .options({ abortEarly: false });

module.exports = { registerSchema, loginSchema };
