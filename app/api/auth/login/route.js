import { NextResponse } from "next/server";
import { cookies } from "next/headers";
const db = require("../../../../lib/db");
const { verifyPassword, signSession, COOKIE_NAME } = require("../../../../lib/auth");

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  const token = signSession({ sub: admin.id, email: admin.email, role: admin.role });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true, email: admin.email, role: admin.role });
}
