import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { computeAlerts } from "@/lib/alerts";
import { levelRank } from "@/lib/alertRules";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  try {
    const students = await computeAlerts(session.coachId);
    students.sort(
      (a, b) =>
        levelRank(a.level) - levelRank(b.level) ||
        b.overdueCount - a.overdueCount ||
        a.name.localeCompare(b.name, "tr")
    );
    return NextResponse.json({ students });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Hata" }, { status: 500 });
  }
}
