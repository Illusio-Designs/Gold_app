// Central JWT secret. Fail fast if it is not configured so the app never
// falls back to a hard-coded, publicly-known signing key.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it in your .env before starting the server."
  );
}

module.exports = { JWT_SECRET };
