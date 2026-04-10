const Joi = require("joi");

const registerSchema = Joi.object({
  email: Joi.string().email().required(),

  password: Joi.string().min(6).required(),

  role: Joi.string()
    .valid("driver", "carrier") // later add: broker, admin
    .required(),

  // DRIVER fields
  firstName: Joi.string().when("role", {
    is: "driver",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  lastName: Joi.string().when("role", {
    is: "driver",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  licenseType: Joi.string().valid("cdl-a", "cdl-b", "non-cdl").when("role", {
    is: "driver",
    then: Joi.required(),
  }),

  // CARRIER fields
  dotNumber: Joi.string().when("role", {
    is: "carrier",
    then: Joi.required(),
  }),

  companyName: Joi.string().when("role", {
    is: "carrier",
    then: Joi.required(),
  }),
});

// Login Validation

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
