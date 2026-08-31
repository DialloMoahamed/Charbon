const webpush = require("web-push");
const db = require("./db");

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const CONTACT_EMAIL = process.env.VAPID_CONTACT_EMAIL || "contact@wuta.example";

const configured = Boolean(PUBLIC_KEY && PRIVATE_KEY);
if (configured) {
  webpush.setVapidDetails(`mailto:${CONTACT_EMAIL}`, PUBLIC_KEY, PRIVATE_KEY);
}

/**
 * Envoie une notification push à toutes les souscriptions d'un scope donné
 * ('admin' ou 'client') pour un ownerId donné. Les souscriptions expirées ou
 * révoquées (410/404) sont supprimées silencieusement.
 */
async function notify(scope, ownerId, payload) {
  if (!configured) return; // Clés VAPID non configurées : on n'envoie rien (voir .env.example).

  const subs = db
    .prepare("SELECT * FROM push_subscriptions WHERE scope = ? AND ownerId = ?")
    .all(scope, ownerId);
  return sendToSubs(subs, payload);
}

/** Diffuse à toutes les souscriptions d'un scope, quel que soit le propriétaire
 * (utilisé pour prévenir toute l'équipe admin d'un nouveau message client). */
async function notifyAll(scope, payload) {
  if (!configured) return;
  const subs = db.prepare("SELECT * FROM push_subscriptions WHERE scope = ?").all(scope);
  return sendToSubs(subs, payload);
}

async function sendToSubs(subs, payload) {
  if (subs.length === 0) return;
  const json = JSON.stringify(payload);
  const remove = db.prepare("DELETE FROM push_subscriptions WHERE id = ?");

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          json
        );
      } catch (err) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          remove.run(sub.id);
        }
      }
    })
  );
}

module.exports = { notify, notifyAll, pushConfigured: configured };
