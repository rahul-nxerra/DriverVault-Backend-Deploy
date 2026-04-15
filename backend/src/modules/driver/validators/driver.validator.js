const Joi = require("joi");

exports.updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  bio: Joi.string().optional(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  licenseType: Joi.string()
    .valid("cdl", "medical", "hazmat", "training", "twic", "safety", "other")
    .optional(),

  experienceYears: Joi.number().min(0).optional(),
  availability: Joi.string().optional(),

  "location.city": Joi.string().optional(),
  "location.state": Joi.string().optional(),
  "location.zipCode": Joi.string().optional(),
});
