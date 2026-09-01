import { NextResponse } from "next/server";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo — largement suffisant pour un vocal de quelques minutes
const EXT_BY_TYPE = {
  webm: "webm",
  ogg: "ogg",
  mp4: "m4a",
  mpeg: "mp3",
  wav: "wav",
};

function extensionFor(contentType) {
  const match = Object.keys(EXT_BY_TYPE).find((k) => (contentType || "").includes(k));
  return EXT_BY_TYPE[match] || "webm";
}

// POST /api/uploads/voice — corps = octets bruts de l'audio (Content-Type audio/*).
// Pas d'authentification requise : au même titre que l'envoi d'un message texte,
// un client invité doit pouvoir envoyer un vocal sans compte.
export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.startsWith("audio/")) {
    return NextResponse.json({ error: "Type de fichier invalide, audio attendu." }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "Fichier audio vide." }, { status: 400 });
  }
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: "Vocal trop long (8 Mo maximum)." }, { status: 413 });
  }

  const ext = extensionFor(contentType);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "voice");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), buffer);

  return NextResponse.json({ url: `/uploads/voice/${filename}` }, { status: 201 });
}
