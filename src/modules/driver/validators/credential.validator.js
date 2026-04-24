const Joi = require("joi");

exports.createCredentialSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "Title is required",
    }),

  type: Joi.string()
    .lowercase()
    .valid("cdl", "medical", "hazmat", "training", "twic", "safety", "other")
    .required()
    .messages({
      "any.only": "Invalid credential type",
    }),

  issuedBy: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow(null, ""), // 🔥 allow empty safely

  expiryDate: Joi.date()
    .iso()
    .greater("now")
    .optional()
    .messages({
      "date.greater": "Expiry date must be in the future",
    }),

  renewedFrom: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid renewedFrom ID",
    }),
})
  .options({ allowUnknown: false }); // 🔥 block extra fields