const Joi = require("joi");

const userValidationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  bio: Joi.string().allow("").max(255),
  location: Joi.string().allow("").max(100),
});

module.exports = userValidationSchema;
