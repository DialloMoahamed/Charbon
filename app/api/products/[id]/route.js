import { NextResponse } from "next/server";
const db = require("../../../../lib/db");
const { getAdminSession } = require("../../../../lib/requireAdmin");

export async function PUT(request, { params }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(params.id);
  if (!existing) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

  const body = await request.json();

  // Ajustement rapide du stock (+1 / -1) depuis le tableau de bord.
  if (typeof body.stockDelta === "number") {
    const nextStock = Math.max(0, existing.stock + body.stockDelta);
    db.prepare("UPDATE products SET stock = ?, updatedAt = datetime('now') WHERE id = ?").run(
      nextStock,
      params.id
    );
    return NextResponse.json(db.prepare("SELECT * FROM products WHERE id = ?").get(params.id));
  }

  const {
    name = existing.name,
    category = existing.category,
    weightKg = existing.weightKg,
    price = existing.price,
    stock = existing.stock,
    capacity = existing.capacity,
    burnTime = existing.burnTime,
    description = existing.description,
    icon = existing.icon,
    imageUrl = existing.imageUrl,
  } = body;

  db.prepare(`
    UPDATE products SET
      name = @name, category = @category, weightKg = @weightKg, price = @price,
      stock = @stock, capacity = @capacity, burnTime = @burnTime,
      description = @description, icon = @icon, imageUrl = @imageUrl, updatedAt = datetime('now')
    WHERE id = @id
  `).run({
    id: params.id,
    name,
    category,
    weightKg: Number(weightKg),
    price: Number(price),
    stock: Number(stock),
    capacity: Number(capacity) || 1,
    burnTime,
    description,
    icon,
    imageUrl: imageUrl || "",
  });

  return NextResponse.json(db.prepare("SELECT * FROM products WHERE id = ?").get(params.id));
}

export async function DELETE(request, { params }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  db.prepare("DELETE FROM products WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
