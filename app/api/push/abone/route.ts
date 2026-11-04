import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const sub = body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: "Geçersiz abonelik" }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
    {
      coach_id: session.coachId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
    },
    { onConflict: "endpoint" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.endpoint) return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint)
    .eq("coach_id", session.coachId);
  return NextResponse.json({ ok: true });
}
