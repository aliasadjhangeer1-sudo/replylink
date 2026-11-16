// POST /api/webhooks/meta — Phase 2 worker wiring lives here.
// Phase 1: verification + signature check + 200-ack + queue stub (no sends yet).
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/meta";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}
export async function POST(req: NextRequest) {
  const raw = Buffer.from(await req.arrayBuffer());
  const sig = req.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(raw, sig)) return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  // 200 immediately; work happens async (Phase 2: QStash / Edge Function queue).
  const body = JSON.parse(raw.toString());
  // Dedupe + persist raw event (service role; comment_id unique).
  // Phase 2: enqueue { eventId } → worker matches keywords, enforces limits, sends private reply.
  void supabaseAdmin; void body;
  return NextResponse.json({ received: true }, { status: 200 });
}
