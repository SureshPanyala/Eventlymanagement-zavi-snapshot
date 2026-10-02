import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { getImage } from "@/lib/images";

export const dynamic = "force-dynamic";

/** Serves an uploaded event banner or profile image. Only sniffed raster types are
 *  ever stored, and nosniff stops a browser from reinterpreting the bytes. */
export async function GET(_req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  const id = /^\d{1,18}$/.test(params.id) ? Number(params.id) : 0;
  if (!id || !hasDatabase()) return new NextResponse("Not found", { status: 404 });
  const img = await getImage(id);
  if (!img) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(img.data), {
    status: 200,
    headers: {
      "Content-Type": img.content_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
