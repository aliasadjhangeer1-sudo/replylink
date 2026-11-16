// AES-256-GCM token encryption. Key from TOKEN_ENCRYPTION_KEY (64 hex chars).
// Format stored in DB: base64(iv) + ':' + base64(ciphertext) + ':' + base64(authTag)
// NEVER log tokens, encrypted or not. Never return decrypted tokens to the client.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const KEY_HEX = process.env.TOKEN_ENCRYPTION_KEY ?? "";
function key(): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(KEY_HEX)) throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hex chars (openssl rand -hex 32)");
  return Buffer.from(KEY_HEX, "hex");
}
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}:${enc.toString("base64")}:${cipher.getAuthTag().toString("base64")}`;
}
export function decryptToken(stored: string): string {
  const [ivB64, encB64, tagB64] = stored.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encB64, "base64")), decipher.final()]).toString("utf8");
}
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
