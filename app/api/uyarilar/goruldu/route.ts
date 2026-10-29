import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { computeAlerts } from "@/lib/alerts";
import { SEEN_COOKIE } from "@/lib/alertSeen";

export const dynamic = "force-dynamic";

// Koç Dikkat Panosu'nu açınca o an acil olan öğrenciler "görüldü" sayılır.
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const alerts = await computeAlerts(session.coachId);
    const red = alerts.filter((a) => a.level === "red").map((a) => a.id).slice(0, 60);
    cookies().set(SEEN_COOKIE, red.join(","), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
  }
}
