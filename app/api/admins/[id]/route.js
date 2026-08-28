import { NextResponse } from "next/server";
const db = require("../../../../lib/db");
const { getAdminSession, isSuperAdmin } = require("../../../../lib/requireAdmin");
const { hashPassword } = require("../../../../lib/auth");

const VALID_ROLES = ["super_admin", "gestionnaire"];

function countSuperAdmins() {
  return db.prepare("SELECT COUNT(*) AS n FROM admins WHERE role = 'super_admin'").get().n;
}

export async function PUT(request, { params }) {
  const session = getAdminSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Réservé aux administrateurs principaux." }, { status: 403 });
  }

  const target = db.prepare("SELECT * FROM admins WHERE id = ?").get(params.id);
  if (!target) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  const { role, password } = await request.json();

  if (role && VALID_ROLES.includes(role) && role !== target.role) {
    // On empêche de retirer le dernier super_admin restant : ça bloquerait
    // définitivement l'accès à la gestion de l'équipe.
    if (target.role === "super_admin" && role !== "super_admin" && countSuperAdmins() <= 1) {
      return NextResponse.json(
        { error: "Impossible de rétrograder le dernier administrateur principal." },
        { status: 409 }
      );
    }
    db.prepare("UPDATE admins SET role = ? WHERE id = ?").run(role, params.id);
  }

  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    }
    db.prepare("UPDATE admins SET passwordHash = ? WHERE id = ?").run(hashPassword(password), params.id);
  }

  const updated = db.prepare("SELECT id, email, role, createdAt FROM admins WHERE id = ?").get(params.id);
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const session = getAdminSession();
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "Réservé aux administrateurs principaux." }, { status: 403 });
  }

  const target = db.prepare("SELECT * FROM admins WHERE id = ?").get(params.id);
  if (!target) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  if (target.id === session.sub) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 });
  }
  if (target.role === "super_admin" && countSuperAdmins() <= 1) {
    return NextResponse.json(
      { error: "Impossible de supprimer le dernier administrateur principal." },
      { status: 409 }
    );
  }

  db.prepare("DELETE FROM admins WHERE id = ?").run(params.id);
  return NextResponse.json({ ok: true });
}
