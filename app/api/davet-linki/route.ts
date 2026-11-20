import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const bot = process.env.TELEGRAM_BOT_USERNAME || "TrackCoachBot";
  return NextResponse.json({
    link: `https://t.me/${bot}?start=${session.coachId}`,
  });
}
