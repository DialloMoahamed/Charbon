import { NextResponse } from "next/server";
const crypto = require("crypto");
const db = require("../../../lib/db");
const { getAdminSession } = require("../../../lib/requireAdmin");

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const orders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all();
  const itemsStmt = db.prepare("SELECT * FROM order_items WHERE orderId = ?");
  const withItems = orders.map((o) => ({ ...o, items: itemsStmt.all(o.id) }));
  return NextResponse.json(withItems);
}

export async function POST(request) {
  const body = await request.json();
  const { customerName, customerPhone, customerAddress, note, items, latitude, longitude } = body;

  if (!customerName || !customerPhone || !customerAddress || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Informations de livraison ou panier incomplets." }, { status: 400 });
  }

  const hasCoords =
    typeof latitude === "number" && typeof longitude === "number" &&
    !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const getProduct = db.prepare("SELECT * FROM products WHERE id = ?");
  const updateStock = db.prepare("UPDATE products SET stock = ?, updatedAt = datetime('now') WHERE id = ?");
  const insertOrder = db.prepare(`
    INSERT INTO orders (id, reference, customerName, customerPhone, customerAddress, note, latitude, longitude, total, status)
    VALUES (@id, @reference, @customerName, @customerPhone, @customerAddress, @note, @latitude, @longitude, @total, 'En attente')
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (id, orderId, productId, name, qty, price)
    VALUES (@id, @orderId, @productId, @name, @qty, @price)
  `);

  try {
    const order = db.transaction(() => {
      let total = 0;
      const resolvedItems = [];

      for (const it of items) {
        const product = getProduct.get(it.productId);
        if (!product) throw new Error(`Produit introuvable (${it.productId}).`);
        if (it.qty < 1) throw new Error(`Quantité invalide pour ${product.name}.`);
        if (product.stock < it.qty) {
          throw new Error(`Stock insuffisant pour "${product.name}" (${product.stock} restants).`);
        }
        updateStock.run(product.stock - it.qty, product.id);
        total += product.price * it.qty;
        resolvedItems.push({ productId: product.id, name: product.name, qty: it.qty, price: product.price });
      }

      const orderId = crypto.randomUUID();
      const reference = "WT-" + Date.now().toString().slice(-8);
      insertOrder.run({
        id: orderId,
        reference,
        customerName,
        customerPhone,
        customerAddress,
        note: note || "",
        latitude: hasCoords ? latitude : null,
        longitude: hasCoords ? longitude : null,
        total,
      });
      for (const it of resolvedItems) {
        insertItem.run({ id: crypto.randomUUID(), orderId, ...it });
      }

      return { id: orderId, reference, total, items: resolvedItems, status: "En attente" };
    })();

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
