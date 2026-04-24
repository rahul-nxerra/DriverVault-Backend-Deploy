const Joi = require("joi");

exports.updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  lastName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional(),

  bio: Joi.string()
    .trim()
    .max(500)
    .allow("")
    .optional(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow(null, "")
    .optional()
    .messages({
      "string.pattern.base": "Phone must be exactly 10 digits",
    }),

  licenseType: Joi.string()
    .valid("cdl-a", "cdl-b", "non-cdl")
    .optional(),

  experienceYears: Joi.number()
    .integer()
    .min(0)
    .max(50)
    .optional(),

  availability: Joi.string()
    .valid("available", "unavailable")
    .optional(),

  location: Joi.object({
    city: Joi.string().trim().max(50).allow("", null),
    state: Joi.string().trim().max(50).allow("", null),
    zipCode: Joi.string()
      .pattern(/^[0-9]{5,6}$/)
      .allow("", null)
      .messages({
        "string.pattern.base": "ZipCode must be 5 or 6 digits",
      }),
  }).optional(),
})
  .min(1) //  at least one field required
  .options({ allowUnknown: false }); //  block extra fields