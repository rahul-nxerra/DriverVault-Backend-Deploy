const Joi = require("joi");

// ================= REQUEST ACCESS =================
const requestAccessSchema = Joi.object({
  driverId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid driver ID",
      "any.required": "Driver ID is required",
    }),

  accessType: Joi.string()
    .valid("view", "download")
    .optional(),

  requestedData: Joi.object({
    personalInfo: Joi.boolean(),
    cdl: Joi.boolean(),
    safety: Joi.boolean(),
    employment: Joi.boolean(),
    performance: Joi.boolean(),
    medical: Joi.boolean(),
    financial: Joi.boolean(),
  })
    .required()
    .custom((value, helpers) => {
      if (!Object.values(value).some((v) => v === true)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .messages({
      "any.required": "requestedData is required",
      "any.invalid": "At least one data type must be selected",
    }),

  reason: Joi.string()
    .trim()
    .max(200)
    .optional(),
});

// ================= HANDLE REQUEST =================
const handleAccessSchema = Joi.object({
  action: Joi.string()
    .valid("approve", "revoke")
    .required()
    .messages({
      "any.only": "Action must be approve or revoke",
      "any.required": "Action is required",
    }),

  notes: Joi.string()
    .allow("")
    .optional()
    .max(500),
});

module.exports = {
  requestAccessSchema,
  handleAccessSchema,
};