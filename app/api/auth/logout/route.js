import { NextResponse } from "next/server";
import { cookies } from "next/headers";
const { COOKIE_NAME } = require("../../../../lib/auth");

export async function POST() {
  cookies().delete(COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
