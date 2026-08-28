import { NextResponse } from "next/server";
const db = require("../../../lib/db");
const { getAdminSession } = require("../../../lib/requireAdmin");

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  // Les commandes annulées ne comptent ni dans le chiffre d'affaires ni
  // dans les quantités vendues.
  const monthlyRevenue = db
    .prepare(
      `SELECT strftime('%Y-%m', createdAt) AS month,
              SUM(total) AS revenue,
              COUNT(*) AS orders
       FROM orders
       WHERE status != 'Annulée'
       GROUP BY month
       ORDER BY month ASC`
    )
    .all();

  const topProducts = db
    .prepare(
      `SELECT oi.name AS name,
              SUM(oi.qty) AS qty,
              SUM(oi.qty * oi.price) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.orderId
       WHERE o.status != 'Annulée'
       GROUP BY oi.name
       ORDER BY qty DESC
       LIMIT 8`
    )
    .all();

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS ordersCount,
              COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE status != 'Annulée'`
    )
    .get();

  const statusBreakdown = db
    .prepare(`SELECT status, COUNT(*) AS n FROM orders GROUP BY status`)
    .all();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthRow = monthlyRevenue.find((m) => m.month === currentMonth);

  return NextResponse.json({
    monthlyRevenue,
    topProducts,
    statusBreakdown,
    totals: {
      revenue: totals.revenue,
      ordersCount: totals.ordersCount,
      avgOrder: totals.ordersCount ? Math.round(totals.revenue / totals.ordersCount) : 0,
      currentMonthRevenue: currentMonthRow ? currentMonthRow.revenue : 0,
    },
  });
}
