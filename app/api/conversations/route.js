import { NextResponse } from "next/server";
const db = require("../../../lib/db");
const { getAdminSession } = require("../../../lib/requireAdmin");

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const conversations = db
    .prepare("SELECT * FROM conversations ORDER BY lastMessageAt DESC")
    .all();

  return NextResponse.json(conversations);
}
