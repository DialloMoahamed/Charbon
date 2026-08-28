import { NextResponse } from "next/server";
const crypto = require("crypto");
const db = require("../../../lib/db");
const { getAdminSession } = require("../../../lib/requireAdmin");

export async function GET() {
  const products = db.prepare("SELECT * FROM products ORDER BY createdAt ASC").all();
  return NextResponse.json(products);
}

export async function POST(request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const body = await request.json();
  const { name, category, weightKg, price, stock, capacity, burnTime, description, icon, imageUrl } = body;

  if (!name || !category || !weightKg || price == null || stock == null) {
    return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO products (id, name, category, weightKg, price, stock, capacity, burnTime, description, icon, imageUrl)
    VALUES (@id, @name, @category, @weightKg, @price, @stock, @capacity, @burnTime, @description, @icon, @imageUrl)
  `).run({
    id,
    name,
    category,
    weightKg: Number(weightKg),
    price: Number(price),
    stock: Number(stock),
    capacity: Number(capacity) || Number(stock) || 1,
    burnTime: burnTime || "",
    description: description || "",
    icon: icon || "sack",
    imageUrl: imageUrl || "",
  });

  const created = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return NextResponse.json(created, { status: 201 });
}
