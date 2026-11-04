import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendPushToCoach } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const r = await sendPushToCoach(session.coachId, {
      title: "TrackCoach",
      body: "Bildirimler çalışıyor ✅",
      url: "/",
      tag: "test",
    });
    return NextResponse.json(r);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Hata" }, { status: 500 });
  }
}
