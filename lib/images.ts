import "server-only";
import { query } from "@/lib/db";

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

type ImageType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/** Detect the real image type from the file's first bytes. The browser-sent
 *  content type is ignored, so an SVG or HTML file renamed .png is rejected. */
function sniff(buf: Buffer): ImageType | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 6 && (buf.subarray(0, 6).toString("ascii") === "GIF87a" || buf.subarray(0, 6).toString("ascii") === "GIF89a")) return "image/gif";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

export type UploadResult = { ok: true; url: string | null } | { ok: false; error: "too_big" | "bad_type" };

/** Store an uploaded image for ownerId. Returns its site-relative URL
 *  (`/images/<id>`), or url null when no file was chosen. */
export async function saveUploadedImage(file: FormDataEntryValue | null, ownerId: number): Promise<UploadResult> {
  if (!file || typeof file === "string" || file.size === 0) return { ok: true, url: null };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "too_big" };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) return { ok: false, error: "bad_type" };
  const r = await query<{ id: number }>(
    "INSERT INTO images (owner_id, content_type, data, byte_size) VALUES ($1, $2, $3, $4) RETURNING id",
    [ownerId, type, buf, buf.length],
  );
  return { ok: true, url: `/images/${r.rows[0].id}` };
}

export async function getImage(id: number): Promise<{ content_type: string; data: Buffer } | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const r = await query<{ content_type: string; data: Buffer }>("SELECT content_type, data FROM images WHERE id = $1", [id]);
  return r.rows[0] ?? null;
}

/** Accept either an uploaded-image path (`/images/<id>`) or an https:// URL.
 *  Returns the normalized value, null for empty, or false when invalid. */
export function normalizeImageUrl(raw: string): string | null | false {
  const v = raw.trim();
  if (!v) return null;
  if (/^\/images\/\d{1,18}$/.test(v)) return v;
  try {
    const u = new URL(v);
    return u.protocol === "https:" ? u.toString() : false;
  } catch {
    return false;
  }
}
