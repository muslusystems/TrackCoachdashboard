import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const incoming = await request.formData();
  incoming.set("coachId", session.coachId);

  const webhookUrl = process.env.N8N_ODEV_ATA_WEBHOOK_URL;
  const secret = process.env.TRACKCOACH_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return NextResponse.json(
      { error: "Sunucu ayarları eksik (N8N_ODEV_ATA_WEBHOOK_URL / TRACKCOACH_WEBHOOK_SECRET)" },
      { status: 500 }
    );
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "x-trackcoach-secret": secret },
    body: incoming,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: `n8n hatası: ${res.status} ${text}` },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => ({ ok: true }));
  return NextResponse.json(data);
}
