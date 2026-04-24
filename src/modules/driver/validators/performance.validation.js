const Joi = require("joi");

/* ===============================
   PARAM VALIDATION
=============================== */

exports.driverIdParamSchema = Joi.object({
  driverId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid driver ID",
      "any.required": "driverId is required",
    }),
});


/* ===============================
   QUERY VALIDATION (FILTERS)
=============================== */

exports.performanceQuerySchema = Joi.object({
  category: Joi.string()
    .valid("safety", "reliability", "training")
    .optional(),

  status: Joi.string()
    .valid("verified", "pending", "rejected", "disputed")
    .optional(),

  startDate: Joi.date().iso().optional(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref("startDate"))
    .optional()
    .messages({
      "date.min": "endDate must be after startDate",
    }),
})
  .options({ allowUnknown: false });


/* ===============================
   CREATE PERFORMANCE (ADMIN/CARRIER)
=============================== */

exports.createPerformanceSchema = Joi.object({
  driver: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid driver ID",
    }),

  type: Joi.string()
    .valid(
      "clean_inspection",
      "training_completed",
      "late_delivery",
      "incident",
      "attendance"
    )
    .required(),

  category: Joi.string()
    .valid("safety", "reliability", "training")
    .required(),

  impact: Joi.number()
    .integer()
    .min(-20)
    .max(20)
    .required(),

  date: Joi.date().iso().optional(),

  description: Joi.string()
    .trim()
    .max(300)
    .allow("")
    .optional(),
})
  .options({ allowUnknown: false });


/* ===============================
   OPTIONAL: TYPE-CATEGORY CONSISTENCY (HELPER)
=============================== */

exports.validateTypeCategory = (type, category) => {
  const map = {
    clean_inspection: "safety",
    incident: "safety",
    late_delivery: "reliability",
    attendance: "reliability",
    training_completed: "training",
  };

  return map[type] === category;
};