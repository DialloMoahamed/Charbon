import { NextResponse } from "next/server";
const { getAdminSession } = require("../../../lib/requireAdmin");
const { getSetting, setSetting } = require("../../../lib/settings");
const { pushConfigured } = require("../../../lib/push");

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  return NextResponse.json({
    contactPhone: getSetting("contactPhone", process.env.PUBLIC_CONTACT_PHONE || ""),
    contactCity: getSetting("contactCity", process.env.PUBLIC_CONTACT_CITY || ""),
    pushConfigured,
  });
}

export async function PUT(request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });

  const { contactPhone, contactCity } = await request.json();
  if (typeof contactPhone === "string") setSetting("contactPhone", contactPhone.trim());
  if (typeof contactCity === "string") setSetting("contactCity", contactCity.trim());

  return NextResponse.json({ ok: true });
}
