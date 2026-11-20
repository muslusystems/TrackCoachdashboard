import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSession } from "@/lib/session";
import { isAdminCoach, PACKAGES } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function guard() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Yetkisiz" }, { status: 401 }) };
  if (!(await isAdminCoach(session.coachId))) {
    return { error: NextResponse.json({ error: "Yönetici değilsin" }, { status: 403 }) };
  }
  return { session };
}

// Bir koçun son kredi hareketleri: ?coach_id=...
export async function GET(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const coachId = new URL(req.url).searchParams.get("coach_id");
  if (!coachId) return NextResponse.json({ error: "coach_id gerekli" }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from("credit_ledger")
    .select("id, package_questions, period_months, qty, reason, note, created_at")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data || [] });
}

// Elle kredi ekle/çıkar: { coach_id, package_questions, period_months, qty (+/-), note }
export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const b = await req.json().catch(() => null);
  const coachId = String(b?.coach_id || "");
  const pkg = Number(b?.package_questions);
  const period = Number(b?.period_months);
  const qty = Number(b?.qty);
  const note = String(b?.note || "").trim().slice(0, 200);

  if (!coachId) return NextResponse.json({ error: "Koç seçilmedi" }, { status: 400 });
  if (!(PACKAGES as readonly number[]).includes(pkg)) {
    return NextResponse.json({ error: "Geçersiz soru kotası" }, { status: 400 });
  }
  if (!Number.isInteger(period) || period < 1 || period > 10) {
    return NextResponse.json({ error: "Süre 1-10 ay arasında olmalı" }, { status: 400 });
  }
  if (!Number.isInteger(qty) || qty === 0 || Math.abs(qty) > 1000) {
    return NextResponse.json({ error: "Adet 1-1000 arasında tam sayı olmalı" }, { status: 400 });
  }

  const { data: coach } = await supabaseAdmin.from("coaches").select("id").eq("id", coachId).maybeSingle();
  if (!coach) return NextResponse.json({ error: "Koç bulunamadı" }, { status: 404 });

  if (qty < 0) {
    const { data: rows } = await supabaseAdmin
      .from("credit_ledger")
      .select("qty")
      .eq("coach_id", coachId)
      .eq("package_questions", pkg)
      .eq("period_months", period);
    const balance = (rows || []).reduce((s, r: any) => s + Number(r.qty), 0);
    if (balance + qty < 0) {
      return NextResponse.json({ error: `Bakiye yetersiz (mevcut: ${balance})` }, { status: 400 });
    }
  }

  const { error } = await supabaseAdmin.from("credit_ledger").insert({
    coach_id: coachId,
    package_questions: pkg,
    period_months: period,
    qty,
    reason: "manual",
    note: (note ? note + " " : "") + `(yönetici: ${g.session!.name || g.session!.coachId})`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
