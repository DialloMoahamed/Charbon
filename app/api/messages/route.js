import { NextResponse } from "next/server";
const db = require("../../../lib/db");
const { normalizePhone, getOrCreateConversation, addMessage } = require("../../../lib/messaging");
const { notify, notifyAll } = require("../../../lib/push");

// GET /api/messages?phone=... — historique de la conversation d'un client.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const id = normalizePhone(phone);
  if (!id) return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });

  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id);
  if (!conversation) return NextResponse.json({ conversation: null, messages: [] });

  const messages = db
    .prepare("SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC")
    .all(id);

  // Le client vient de consulter le fil : on remet son compteur à zéro.
  db.prepare("UPDATE conversations SET unreadForCustomer = 0 WHERE id = ?").run(id);

  return NextResponse.json({ conversation, messages });
}

// POST /api/messages { phone, name, body } — le client envoie un message.
export async function POST(request) {
  const { phone, name, body, audioUrl } = await request.json();
  const id = normalizePhone(phone);
  const isAudio = !!audioUrl;
  if (!id || (!isAudio && (!body || !body.trim()))) {
    return NextResponse.json({ error: "Numéro de téléphone et message requis." }, { status: 400 });
  }

  const conversation = getOrCreateConversation(phone, name);
  const message = addMessage(
    conversation.id,
    "client",
    name || conversation.customerName,
    isAudio ? "" : body.trim(),
    isAudio ? { type: "audio", audioUrl } : undefined
  );

  notifyAll("admin", {
    title: `Nouveau message — ${name || conversation.customerName || conversation.customerPhone}`,
    body: body.trim().slice(0, 120),
    url: "/admin",
  }).catch(() => {});

  return NextResponse.json({ conversation, message }, { status: 201 });
}
