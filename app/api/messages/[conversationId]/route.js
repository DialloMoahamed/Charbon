import { NextResponse } from "next/server";
const db = require("../../../../lib/db");
const { getAdminSession } = require("../../../../lib/requireAdmin");
const { addMessage } = require("../../../../lib/messaging");
const { notify } = require("../../../../lib/push");

export async function GET(request, { params }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { conversationId } = params;
  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId);
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });

  const messages = db
    .prepare("SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC")
    .all(conversationId);

  // L'admin vient de lire le fil : on remet son compteur à zéro.
  db.prepare("UPDATE conversations SET unreadForAdmin = 0 WHERE id = ?").run(conversationId);

  return NextResponse.json({ conversation, messages });
}

export async function POST(request, { params }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { conversationId } = params;
  const conversation = db.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId);
  if (!conversation) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });

  const { body } = await request.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  const message = addMessage(conversationId, "admin", session.email || "Support WUTA", body.trim());

  notify("client", conversationId, {
    title: "WUTA — nouvelle réponse",
    body: body.trim().slice(0, 120),
    url: "/messages",
  }).catch(() => {});

  return NextResponse.json({ message }, { status: 201 });
}
