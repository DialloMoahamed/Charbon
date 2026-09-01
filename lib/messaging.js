const crypto = require("crypto");
const db = require("./db");

// On identifie une conversation par le numéro de téléphone du client, sans
// exiger de compte : on normalise pour que "+227 96 12 34 56" et
// "96123456" pointent vers la même conversation.
function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "").replace(/^227/, "");
}

function getOrCreateConversation(phone, name) {
  const id = normalizePhone(phone);
  if (!id) return null;

  const existing = db.prepare("SELECT * FROM conversations WHERE id = ?").get(id);
  if (existing) {
    if (name && name !== existing.customerName) {
      db.prepare("UPDATE conversations SET customerName = ? WHERE id = ?").run(name, id);
      existing.customerName = name;
    }
    return existing;
  }

  const conv = {
    id,
    customerName: name || "",
    customerPhone: phone,
    lastMessageAt: new Date().toISOString(),
    lastMessagePreview: "",
    unreadForAdmin: 0,
    unreadForCustomer: 0,
    createdAt: new Date().toISOString(),
  };
  db.prepare(
    `INSERT INTO conversations (id, customerName, customerPhone, lastMessageAt, lastMessagePreview, unreadForAdmin, unreadForCustomer)
     VALUES (@id, @customerName, @customerPhone, @lastMessageAt, @lastMessagePreview, @unreadForAdmin, @unreadForCustomer)`
  ).run(conv);
  return conv;
}

function addMessage(conversationId, sender, senderName, body, opts = {}) {
  const type = opts.type === "audio" ? "audio" : "text";
  const audioUrl = type === "audio" ? String(opts.audioUrl || "") : "";
  const message = {
    id: crypto.randomUUID(),
    conversationId,
    sender,
    senderName: senderName || "",
    body: type === "audio" ? "🎤 Message vocal" : String(body).slice(0, 2000),
    type,
    audioUrl,
  };
  db.prepare(
    `INSERT INTO messages (id, conversationId, sender, senderName, body, type, audioUrl)
     VALUES (@id, @conversationId, @sender, @senderName, @body, @type, @audioUrl)`
  ).run(message);

  const preview = message.body.slice(0, 140);
  if (sender === "client") {
    db.prepare(
      `UPDATE conversations SET lastMessageAt = datetime('now'), lastMessagePreview = ?, unreadForAdmin = unreadForAdmin + 1 WHERE id = ?`
    ).run(preview, conversationId);
  } else {
    db.prepare(
      `UPDATE conversations SET lastMessageAt = datetime('now'), lastMessagePreview = ?, unreadForCustomer = unreadForCustomer + 1 WHERE id = ?`
    ).run(preview, conversationId);
  }

  return db.prepare("SELECT * FROM messages WHERE id = ?").get(message.id);
}

module.exports = { normalizePhone, getOrCreateConversation, addMessage };
