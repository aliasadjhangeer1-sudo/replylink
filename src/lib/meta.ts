// Meta Graph API v21.0 helpers — Phase 2 (scaffolded in Phase 1 so auth + DB land cleanly).
// Permissions needed (App Review): instagram_manage_comments, instagram_manage_messages,
// pages_messaging, pages_manage_metadata, pages_read_engagement, pages_manage_engagement.
import crypto from "crypto";
import { decryptToken } from "./crypto";

export const GRAPH = "https://graph.facebook.com/v21.0";
export function verifyWebhookSignature(rawBody: Buffer, signature: string | null): boolean {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", process.env.META_APP_SECRET!).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
// Exchange short-lived user token → long-lived (~60 days), then auto-refresh before expiry (Phase 2 cron).
export async function exchangeLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const u = new URL(`${GRAPH}/oauth/access_token`);
  u.searchParams.set("grant_type", "fb_exchange_token");
  u.searchParams.set("client_id", process.env.META_APP_ID!);
  u.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  u.searchParams.set("fb_exchange_token", shortToken);
  const r = await fetch(u); if (!r.ok) throw new Error(`Meta token exchange failed: ${r.status}`);
  return r.json();
}
export async function sendInstagramPrivateReply(igUserId: string, commentId: string, encryptedToken: string, message: string) {
  const token = decryptToken(encryptedToken);
  const r = await fetch(`${GRAPH}/${igUserId}/messages`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { comment_id: commentId }, message: { text: message } }),
  });
  // NOTE: real call needs Authorization header in production — token is passed via query in Graph for page tokens;
  // this scaffold uses body token pattern; Phase 2 worker finalises per Meta docs + logs error body (no token).
  void token; return r;
}
export async function sendFacebookPrivateReply(commentId: string, encryptedToken: string, message: string) {
  const token = decryptToken(encryptedToken);
  const r = await fetch(`${GRAPH}/${commentId}/private_replies`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  void token; return r;
}
