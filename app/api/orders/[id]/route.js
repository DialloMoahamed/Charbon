import { NextResponse } from "next/server";
const db = require("../../../../lib/db");
const { getAdminSession } = require("../../../../lib/requireAdmin");

const VALID_STATUSES = ["En attente", "Livrée", "Annulée"];

export async function PATCH(request, { params }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { status } = await request.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, params.id);
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(params.id);
  const items = db.prepare("SELECT * FROM order_items WHERE orderId = ?").all(params.id);
  return NextResponse.json({ ...order, items });
}
