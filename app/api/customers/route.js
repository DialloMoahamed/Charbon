import { NextResponse } from "next/server";
const db = require("../../../lib/db");
const { getAdminSession } = require("../../../lib/requireAdmin");

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  // Il n'y a pas de compte client : on reconstitue la liste des clients à
  // partir de leur historique de commandes, regroupé par numéro de téléphone.
  const customers = db
    .prepare(
      `SELECT
         customerPhone,
         (SELECT o2.customerName FROM orders o2 WHERE o2.customerPhone = orders.customerPhone ORDER BY o2.createdAt DESC LIMIT 1) AS customerName,
         (SELECT o2.customerAddress FROM orders o2 WHERE o2.customerPhone = orders.customerPhone ORDER BY o2.createdAt DESC LIMIT 1) AS lastAddress,
         COUNT(*) AS ordersCount,
         SUM(CASE WHEN status != 'Annulée' THEN total ELSE 0 END) AS totalSpent,
         MAX(createdAt) AS lastOrderAt
       FROM orders
       GROUP BY customerPhone
       ORDER BY lastOrderAt DESC`
    )
    .all();

  return NextResponse.json(customers);
}
