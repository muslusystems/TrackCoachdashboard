import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { adminBot, checkSecret } from "@/lib/telegramBot";
import { assignStudentToClass } from "@/lib/sinifAta";
import { sinifOlayiCoz, YENI_SINIF_ISARET } from "@/lib/sinifAkisi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// n8n (koç botu) ilgili güncellemeyi buraya iletir. Gövde: { update }
export async function POST(req: Request) {
  if (!checkSecret(req)) return new Response("Yetkisiz", { status: 401 });
  const b = await req.json().catch(() => null);
  const olay = sinifOlayiCoz(b?.update);
  if (!olay) return NextResponse.json({ ok: true, ignored: true });

  // Yalnızca kayıtlı koç işlem yapabilir
  const { data: coach } = await supabaseAdmin.from("coaches").select("id").eq("telegram_id", olay.coachTg).limit(1);
  const coachId = coach && coach[0] ? coach[0].id : null;
  if (!coachId) {
    if ("callbackId" in olay) await adminBot("answerCallbackQuery", { callback_query_id: olay.callbackId, text: "Yetkisiz" });
    return NextResponse.json({ ok: true, ignored: "coach" });
  }

  if (olay.tur === "sec") {
    const r = await assignStudentToClass(coachId, { telegramId: olay.studentTg }, { classId: olay.classId });
    await adminBot("answerCallbackQuery", { callback_query_id: olay.callbackId, text: r.ok ? "Eklendi ✅" : "Eklenemedi" });
    await adminBot("editMessageText", {
      chat_id: olay.chatId,
      message_id: olay.messageId,
      text: r.ok ? `✅ ${r.studentName}, “${r.className}” sınıfına eklendi.` : `⚠️ Eklenemedi: ${r.error}`,
    });
    return NextResponse.json({ ok: r.ok });
  }

  if (olay.tur === "sonra") {
    await adminBot("answerCallbackQuery", { callback_query_id: olay.callbackId });
    await adminBot("editMessageText", {
      chat_id: olay.chatId,
      message_id: olay.messageId,
      text: "⏭ Öğrenci şimdilik sınıfsız bırakıldı. Dashboard'daki Öğrenciler sayfasından ya da botta “Sınıfa ata” ile sonra ekleyebilirsin.",
    });
    return NextResponse.json({ ok: true });
  }

  if (olay.tur === "yeni") {
    await adminBot("answerCallbackQuery", { callback_query_id: olay.callbackId });
    await adminBot("sendMessage", {
      chat_id: olay.chatId,
      text: `${YENI_SINIF_ISARET}\n(öğrenci kodu: ${olay.studentTg})\nSınıfın adını bu mesaja YANIT vererek yaz. Örn: 9. Sınıf`,
      reply_markup: { force_reply: true, input_field_placeholder: "Sınıf adı" },
    });
    return NextResponse.json({ ok: true });
  }

  // tur === "ad"
  const ad = olay.ad.trim();
  if (!ad || ad.startsWith("/")) {
    await adminBot("sendMessage", { chat_id: olay.chatId, text: "⚠️ Geçerli bir sınıf adı yaz (komut olmasın)." });
    return NextResponse.json({ ok: true });
  }
  const r = await assignStudentToClass(coachId, { telegramId: olay.studentTg }, { newName: ad });
  await adminBot("sendMessage", {
    chat_id: olay.chatId,
    text: r.ok
      ? r.created
        ? `✅ “${r.className}” sınıfı oluşturuldu ve ${r.studentName} eklendi.`
        : `✅ “${r.className}” sınıfı zaten vardı, ${r.studentName} oraya eklendi.`
      : `⚠️ Eklenemedi: ${r.error}`,
  });
  return NextResponse.json({ ok: r.ok });
}
