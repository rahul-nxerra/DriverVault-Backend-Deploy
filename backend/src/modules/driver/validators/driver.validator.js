const Joi = require("joi");

exports.updateProfileSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  bio: Joi.string().optional(),

  phone: Joi.string().optional(),
  licenseType: Joi.string().optional(),
  experienceYears: Joi.number().optional(),

  availability: Joi.string().optional(),

  location: Joi.object({
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
  }).optional(),
});