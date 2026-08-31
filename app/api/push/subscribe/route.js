import { NextResponse } from "next/server";
const crypto = require("crypto");
const db = require("../../../../lib/db");
const { getAdminSession } = require("../../../../lib/requireAdmin");
const { normalizePhone } = require("../../../../lib/messaging");

// POST { subscription, scope: 'admin' | 'client', phone? }
// - scope 'admin' : l'ownerId est dérivé de la session (jamais du client, pour éviter l'usurpation).
// - scope 'client' : identifié par le numéro de téléphone, comme le reste du parcours invité.
export async function POST(request) {
  const { subscription, scope, phone } = await request.json();
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return NextResponse.json({ error: "Souscription invalide." }, { status: 400 });
  }

  let ownerId;
  if (scope === "admin") {
    const session = getAdminSession();
    if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    ownerId = session.sub;
  } else if (scope === "client") {
    ownerId = normalizePhone(phone);
    if (!ownerId) return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Scope invalide." }, { status: 400 });
  }

  db.prepare(
    `INSERT INTO push_subscriptions (id, scope, ownerId, endpoint, p256dh, auth)
     VALUES (@id, @scope, @ownerId, @endpoint, @p256dh, @auth)
     ON CONFLICT(endpoint) DO UPDATE SET scope = @scope, ownerId = @ownerId, p256dh = @p256dh, auth = @auth`
  ).run({
    id: crypto.randomUUID(),
    scope,
    ownerId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: "endpoint requis." }, { status: 400 });
  db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
  return NextResponse.json({ ok: true });
}
