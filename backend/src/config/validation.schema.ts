import * as Joi from "joi";

// Fails fast at boot if required configuration is missing or malformed, instead of
// surfacing as a confusing runtime error the first time a route needs it.
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().uri({ scheme: ["postgresql", "postgres"] }).required(),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_TTL: Joi.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: Joi.number().default(30),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173,http://127.0.0.1:5173"),
  THROTTLE_TTL_MS: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
});
