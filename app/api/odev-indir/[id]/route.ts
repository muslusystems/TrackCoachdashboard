import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Öğrenci bildirimindeki "Ödevi indir" butonu: Drive'daki PDF'i doğru
// Content-Type ve dosya adıyla sunar (Drive'ın uc?export=download adresi
// bazı tarayıcılarda .bin olarak iniyordu).
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return new Response("Bulunamadı", { status: 404 });

  const { data: a } = await supabaseAdmin
    .from("assignments")
    .select("title, drive_pdf_url")
    .eq("id", params.id)
    .maybeSingle();
  const fileId = String(a?.drive_pdf_url || "").match(/\/d\/([\w-]+)/)?.[1];
  if (!a || !fileId) return new Response("Dosya bulunamadı", { status: 404 });

  const upstream = await fetch(
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`,
    { redirect: "follow" }
  );
  if (!upstream.ok || !upstream.body) return new Response("Dosya alınamadı", { status: 502 });

  const safe = String(a.title || "odev")
    .replace(/[\\/:*?"<>|\r\n]+/g, " ")
    .trim()
    .slice(0, 80) || "odev";
  const ascii = safe.replace(/[^\x20-\x7E]/g, "_");

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${ascii}.pdf"; filename*=UTF-8''${encodeURIComponent(safe)}.pdf`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
