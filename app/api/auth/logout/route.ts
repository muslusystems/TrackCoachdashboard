import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  clearSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
