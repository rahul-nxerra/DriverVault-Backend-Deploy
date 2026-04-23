const Joi = require("joi");

exports.createDisputeSchema = Joi.object({
  title: Joi.string().trim().min(3).required(),

  description: Joi.string().trim().min(5).required(),

  category: Joi.string()
    .valid(
      "safety",
      "reliability",
      "training",
      "employment",
      "credential",
      "other"
    )
    .required(),

  relatedRecord: Joi.string()
    .when("category", {
      is: Joi.valid("other"),
      then: Joi.optional().allow(null),
      otherwise: Joi.required(),
    }),
});