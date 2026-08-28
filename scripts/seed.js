require("dotenv").config({ path: ".env.local" });
const crypto = require("crypto");
const db = require("../lib/db");
const { hashPassword } = require("../lib/auth");

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "\nADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env.local avant de lancer le seed.\n" +
        "Copiez .env.example en .env.local et remplissez ces valeurs, puis relancez : npm run seed\n"
    );
    process.exit(1);
  }

  const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
  if (existing) {
    db.prepare("UPDATE admins SET passwordHash = ? WHERE email = ?").run(
      hashPassword(password),
      email
    );
    console.log(`Compte admin existant mis à jour : ${email}`);
    return;
  }

  // Le tout premier compte (celui créé depuis .env.local) est toujours
  // "super_admin" : c'est lui qui pourra ensuite créer les autres comptes
  // depuis l'onglet "Équipe" de l'espace pro.
  db.prepare(
    "INSERT INTO admins (id, email, passwordHash, role) VALUES (?, ?, ?, 'super_admin')"
  ).run(crypto.randomUUID(), email, hashPassword(password));
  console.log(`Compte admin créé (super_admin) : ${email}`);
}

function seedProducts() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM products").get().n;
  if (count > 0) {
    console.log(`${count} produit(s) déjà en base, catalogue non réinitialisé.`);
    return;
  }

  const products = [
    {
      name: "Charbon de bois — Sac 50kg",
      category: "Ménage",
      weightKg: 50,
      price: 12500,
      stock: 30,
      capacity: 50,
      burnTime: "6 à 8h en cuisson continue",
      icon: "sack",
      description:
        "Charbon de bois dur, idéal pour les grandes familles et la marmite quotidienne. Braise longue et régulière.",
    },
    {
      name: "Charbon de bois — Sac 25kg",
      category: "Ménage",
      weightKg: 25,
      price: 6800,
      stock: 40,
      capacity: 60,
      burnTime: "6 à 8h",
      icon: "sack",
      description: "Même qualité que le sac de 50kg, format moyen pour les foyers de taille moyenne.",
    },
    {
      name: "Charbon de bois — Sac 12kg",
      category: "Ménage",
      weightKg: 12,
      price: 3500,
      stock: 20,
      capacity: 60,
      burnTime: "6 à 8h",
      icon: "sack",
      description: "Petit format pratique, parfait pour un usage quotidien ou pour essayer notre qualité.",
    },
    {
      name: "Braise grillade — Sac 5kg",
      category: "Grillade",
      weightKg: 5,
      price: 2200,
      stock: 35,
      capacity: 50,
      burnTime: "Monte vite, braise 2 à 3h",
      icon: "flame",
      description:
        "Charbon calibré pour brochettes et grillades. Chauffe fort et vite, pensé pour les vendeurs de dibi.",
    },
    {
      name: "Charbon industriel — Vrac (tonne)",
      category: "Industriel",
      weightKg: 1000,
      price: 145000,
      stock: 8,
      capacity: 15,
      burnTime: "Combustion longue et stable",
      icon: "truck",
      description:
        "Pour fours de boulangerie, forgerons et unités de transformation. Livraison camion sur Niamey et environs.",
    },
    {
      name: "Éco-charbon de Typha — Sac 12kg",
      category: "Écologique",
      weightKg: 12,
      price: 3200,
      stock: 15,
      capacity: 40,
      burnTime: "5 à 6h, faible fumée",
      icon: "leaf",
      description:
        "Fabriqué à partir du typha envahissant du fleuve Niger. Moins de fumée, prix accessible, valorise une plante nuisible.",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO products (id, name, category, weightKg, price, stock, capacity, burnTime, description, icon)
    VALUES (@id, @name, @category, @weightKg, @price, @stock, @capacity, @burnTime, @description, @icon)
  `);

  const insertAll = db.transaction((rows) => {
    for (const p of rows) insert.run({ id: crypto.randomUUID(), ...p });
  });
  insertAll(products);

  console.log(`${products.length} produits de départ créés. Modifiez-les depuis l'espace admin.`);
}

seedAdmin();
seedProducts();
console.log("\nInitialisation terminée.");
