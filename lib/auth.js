const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const COOKIE_NAME = "wuta_session";
const SESSION_DURATION = "12h";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET n'est pas défini. Ajoutez-le dans votre fichier .env.local (voir .env.example)."
    );
  }
  return secret;
}

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 12);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function signSession(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_DURATION });
}

function verifySession(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (e) {
    return null;
  }
}

module.exports = {
  COOKIE_NAME,
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
};
