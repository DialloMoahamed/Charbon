const { cookies } = require("next/headers");
const { COOKIE_NAME, verifySession } = require("./auth");

/**
 * Renvoie la session admin si le cookie est valide, sinon null.
 * À appeler au début de toute route API réservée à l'administrateur.
 */
function getAdminSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * true si la session correspond à un compte "super_admin" (seul rôle
 * autorisé à créer, modifier ou supprimer d'autres comptes admin).
 */
function isSuperAdmin(session) {
  return !!session && session.role === "super_admin";
}

module.exports = { getAdminSession, isSuperAdmin };
