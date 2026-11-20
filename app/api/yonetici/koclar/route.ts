import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { isAdminCoach } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Yönetici: tüm koçlar ve kredi bakiyeleri
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  if (!(await isAdminCoach(session.coachId))) {
    return NextResponse.json({ error: "Yönetici değilsin" }, { status: 403 });
  }

  const { data: coaches, error } = await supabaseAdmin.from("coaches").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: rows, error: lErr } = await supabaseAdmin
    .from("credit_ledger")
    .select("coach_id, package_questions, period_months, qty");
  if (lErr) return NextResponse.json({ error: lErr.message }, { status: 500 });

  const bal = new Map<string, Map<string, number>>();
  for (const r of rows || []) {
    const m = bal.get(r.coach_id) || new Map<string, number>();
    const k = `${r.package_questions}:${r.period_months}`;
    m.set(k, (m.get(k) || 0) + Number(r.qty));
    bal.set(r.coach_id, m);
  }

  const list = (coaches || []).map((c: any) => ({
    id: c.id as string,
    name: (c.name_surname || c.name || "") as string,
    email: (c.email || "") as string,
    is_admin: c.is_admin === true,
    balances: Array.from(bal.get(c.id) || [], ([k, blocks]) => {
      const [p, m] = k.split(":").map(Number);
      return { package_questions: p, period_months: m, blocks };
    })
      .filter((b) => b.blocks !== 0)
      .sort((a, b) => a.package_questions - b.package_questions || a.period_months - b.period_months),
  }));
  list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "tr"));
  return NextResponse.json({ coaches: list });
}
