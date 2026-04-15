const Joi = require("joi");

exports.createCredentialSchema = Joi.object({
  title: Joi.string().trim().min(2).required(),

  type: Joi.string()
    .lowercase()
    .valid("cdl", "medical", "hazmat", "training", "twic", "safety", "other")
    .required(),

  issuedBy: Joi.string().trim().optional(),

  expiryDate: Joi.date().iso().optional(),
});
