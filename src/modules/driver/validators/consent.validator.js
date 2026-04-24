const Joi = require("joi");

exports.updateConsentSchema = Joi.object({
  personalInfo: Joi.boolean().optional(),
  cdl: Joi.boolean().optional(),
  safety: Joi.boolean().optional(),
  employment: Joi.boolean().optional(),
  performance: Joi.boolean().optional(),
  medical: Joi.boolean().optional(),
  financial: Joi.boolean().optional(),
})
  .min(1) // 🔥 at least one field required
  .messages({
    "object.min": "At least one preference must be provided",
  });