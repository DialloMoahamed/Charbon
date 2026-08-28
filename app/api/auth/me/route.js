import { NextResponse } from "next/server";
const { getAdminSession } = require("../../../../lib/requireAdmin");

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, email: session.email, role: session.role });
}
