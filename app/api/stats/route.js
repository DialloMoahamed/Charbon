import { NextResponse } from "next/server";
const db = require("../../../lib/db");
const { getAdminSession } = require("../../../lib/requireAdmin");

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  // Les commandes annulées ne comptent ni dans le chiffre d'affaires ni
  // dans les quantités vendues.
  const dailyRevenueRaw = db
    .prepare(
      `SELECT strftime('%Y-%m-%d', createdAt) AS day,
              SUM(total) AS revenue,
              COUNT(*) AS orders
       FROM orders
       WHERE status != 'Annulée' AND createdAt >= date('now', '-7 days')
       GROUP BY day
       ORDER BY day ASC`
    )
    .all();

  // On complète les jours sans commande avec des valeurs à zéro, pour que le
  // graphique "7 derniers jours" affiche toujours 8 points continus.
  const dailyByDate = Object.fromEntries(dailyRevenueRaw.map((d) => [d.day, d]));
  const dailyRevenue = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const row = dailyByDate[key];
    dailyRevenue.push({ day: key, revenue: row ? row.revenue : 0, orders: row ? row.orders : 0 });
  }

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
    dailyRevenue,
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
