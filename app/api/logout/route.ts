// BLESSED TEMPLATE — app/api/logout/route.ts (POST). Uses lib/auth.ts.
import { NextResponse } from "next/server";
import { forbidden, isCrossSiteRequest, redirectClearingSession } from "@/lib/auth";

export async function POST(req: Request): Promise<NextResponse> {
  if (isCrossSiteRequest(req)) return forbidden();
  return redirectClearingSession("/");
}
