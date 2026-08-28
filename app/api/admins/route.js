import { NextResponse } from "next/server";
const crypto = require("crypto");
const db = require("../../../lib/db");
const { getAdminSession, isSuperAdmin } = require("../../../lib/requireAdmin");
const { hashPassword } = require("../../../lib/auth");

const VALID_ROLES = ["super_admin", "gestionnaire"];

export async function GET() {
  const session = getAdminSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Réservé aux administrateurs principaux." }, { status: 403 });
  }
  const admins = db
    .prepare("SELECT id, email, role, createdAt FROM admins ORDER BY createdAt ASC")
    .all();
  return NextResponse.json(admins);
}

export async function POST(request) {
  const session = getAdminSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Réservé aux administrateurs principaux." }, { status: 403 });
  }

  const { email, password, role } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }
  const finalRole = VALID_ROLES.includes(role) ? role : "gestionnaire";

  const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO admins (id, email, passwordHash, role) VALUES (?, ?, ?, ?)").run(
    id,
    email,
    hashPassword(password),
    finalRole
  );

  const created = db.prepare("SELECT id, email, role, createdAt FROM admins WHERE id = ?").get(id);
  return NextResponse.json(created, { status: 201 });
}
