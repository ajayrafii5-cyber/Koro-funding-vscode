/**
 * Koro Funding — Shared Lib
 * validators.js | logger.js | slack.js | email.js | seed.js
 */

// ─── validators.js ────────────────────────────────────────
import Joi from 'joi';

export const registerSchema = Joi.object({
  email:        Joi.string().email().required().messages({ 'string.email': 'Format email tidak valid.' }),
  password:     Joi.string().min(8).required().messages({ 'string.min': 'Password minimal 8 karakter.' }),
  fullName:     Joi.string().min(2).max(100).required(),
  country:      Joi.string().max(100).optional(),
  referralCode: Joi.string().optional().allow(''),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});
