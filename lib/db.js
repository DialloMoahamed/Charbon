const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DATABASE_PATH || "./data/wuta.db";
const resolvedPath = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(process.cwd(), DB_PATH);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

// Une seule connexion réutilisée entre les appels (Next.js recharge les modules
// en dev, donc on la garde sur `global` pour éviter d'ouvrir le fichier plusieurs fois).
const globalForDb = globalThis;

const db = globalForDb.__wutaDb || new Database(resolvedPath);
if (process.env.NODE_ENV !== "production") globalForDb.__wutaDb = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'gestionnaire',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    weightKg REAL NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 1,
    burnTime TEXT DEFAULT '',
    description TEXT DEFAULT '',
    icon TEXT DEFAULT 'sack',
    imageUrl TEXT DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    customerAddress TEXT NOT NULL,
    note TEXT DEFAULT '',
    latitude REAL,
    longitude REAL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'En attente',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    productId TEXT REFERENCES products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    price INTEGER NOT NULL
  );
`);

// Migration douce : si le fichier existait déjà avant l'ajout des rôles,
// on ajoute la colonne sans perdre les comptes admin déjà créés.
const adminColumns = db.prepare("PRAGMA table_info(admins)").all().map((c) => c.name);
if (!adminColumns.includes("role")) {
  db.exec("ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'gestionnaire'");
}
const productColumns = db.prepare("PRAGMA table_info(products)").all().map((c) => c.name);
if (!productColumns.includes("imageUrl")) {
  db.exec("ALTER TABLE products ADD COLUMN imageUrl TEXT DEFAULT ''");
}
const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
if (!orderColumns.includes("latitude")) {
  db.exec("ALTER TABLE orders ADD COLUMN latitude REAL");
}
if (!orderColumns.includes("longitude")) {
  db.exec("ALTER TABLE orders ADD COLUMN longitude REAL");
}

module.exports = db;
