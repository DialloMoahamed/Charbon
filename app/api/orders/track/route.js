import { NextResponse } from "next/server";
const db = require("../../../../lib/db");
const { normalizePhone } = require("../../../../lib/messaging");

// GET /api/orders/track?phone=... — commandes d'un client, retrouvées par
// numéro de téléphone (même logique invité que la messagerie : pas de compte).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const id = normalizePhone(phone);
  if (!id) return NextResponse.json({ error: "Numéro de téléphone requis." }, { status: 400 });

  const all = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all();
  const matched = all.filter((o) => normalizePhone(o.customerPhone) === id);

  const itemsStmt = db.prepare("SELECT name, qty, price FROM order_items WHERE orderId = ?");
  const orders = matched.map((o) => ({ ...o, items: itemsStmt.all(o.id) }));

  return NextResponse.json(orders);
}
