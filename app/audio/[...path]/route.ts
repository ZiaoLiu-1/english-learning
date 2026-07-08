/**
 * Dev/runtime audio server for data/audio/** (mp3s produced by pnpm content:tts).
 * In production, nginx serves /english/audio/ directly via alias (ADR-002); this
 * route is the dev fallback and a working default if the alias is ever absent.
 * Path is confined to data/audio to prevent traversal.
 */
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const AUDIO_ROOT = path.join(process.cwd(), "data", "audio");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const target = path.join(AUDIO_ROOT, ...parts);
  const resolved = path.resolve(target);
  if (resolved !== AUDIO_ROOT && !resolved.startsWith(AUDIO_ROOT + path.sep)) {
    return new NextResponse(null, { status: 403 });
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return new NextResponse(null, { status: 404 });
  }
  const file = fs.readFileSync(resolved);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
