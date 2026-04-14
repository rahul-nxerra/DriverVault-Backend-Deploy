const Joi = require("joi");

exports.createCredentialSchema = Joi.object({
  title: Joi.string().required(),

  type: Joi.string()
    .valid("license", "medical", "hazmat", "training", "twic", "safety", "other")
    .required(),

  issuedBy: Joi.string().optional(),

  expiryDate: Joi.date().optional(),
});