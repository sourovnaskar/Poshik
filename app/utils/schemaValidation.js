const Joi = require("joi");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(passwordRegex).required().messages({
    "string.pattern.base":
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
  }),
  confirmPassword: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Password must be same ",
    "any.required": "Please confirm Your password",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const PetSchema = Joi.object({
  

  name: Joi.string().trim().max(100).required().messages({
    "string.empty": "Pet name is required",
    "string.max": "Pet name cannot exceed 100 characters",
    "any.required": "Pet name is required",
  }),

  species: Joi.string()
    .valid("Dog", "Cat", "Bird", "Rabbit", "Other")
    .required()
    .messages({
      "any.only": "Species must be Dog, Cat, Bird, Rabbit, or Other",
      "any.required": "Species is required",
    }),

  breed: Joi.string().trim().optional(),

  gender: Joi.string().valid("Male", "Female").optional().messages({
    "any.only": "Gender must be Male or Female",
  }),

  age: Joi.number().min(0).optional().messages({
    "number.base": "Age must be a number",
    "number.min": "Age cannot be negative",
  }),

  weight: Joi.number().min(0).optional().messages({
    "number.base": "Weight must be a number",
    "number.min": "Weight cannot be negative",
  }),

  color: Joi.string().trim().optional(),

  image: Joi.string().uri().allow(null, "").optional().messages({
    "string.uri": "Image must be a valid URL",
  }),

  bio: Joi.string().max(500).optional().messages({
    "string.max": "Bio cannot exceed 500 characters",
  }),

  vaccinationDetails: Joi.string().optional(),

  medicalHistory: Joi.string().optional(),
});
module.exports = { registerSchema, loginSchema, PetSchema };
