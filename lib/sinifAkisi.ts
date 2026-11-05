// Telegram'daki sınıf seçimi akışının saf (veritabanından bağımsız) yardımcıları.

export const YENI_SINIF_ISARET = "🆕 Yeni sınıf adı";

export type SinifOlayi =
  | { tur: "sec"; studentTg: string; classId: string; callbackId: string; coachTg: string; chatId: string; messageId: number }
  | { tur: "sonra"; studentTg: string; callbackId: string; coachTg: string; chatId: string; messageId: number }
  | { tur: "yeni"; studentTg: string; callbackId: string; coachTg: string; chatId: string }
  | { tur: "ad"; studentTg: string; ad: string; coachTg: string; chatId: string }
  | null;

/** Telegram güncellemesini sınıf akışı olayına çevirir; ilgisizse null döner. */
export function sinifOlayiCoz(update: any): SinifOlayi {
  const cb = update?.callback_query;
  if (cb?.data && typeof cb.data === "string") {
    const d: string = cb.data;
    const coachTg = String(cb.from?.id ?? "");
    const chatId = String(cb.message?.chat?.id ?? cb.from?.id ?? "");
    const messageId = Number(cb.message?.message_id ?? 0);
    let m = d.match(/^snfsec_(\d+)_([0-9a-fA-F-]{36})$/);
    if (m) return { tur: "sec", studentTg: m[1], classId: m[2], callbackId: String(cb.id), coachTg, chatId, messageId };
    m = d.match(/^snfsonra_(\d+)$/);
    if (m) return { tur: "sonra", studentTg: m[1], callbackId: String(cb.id), coachTg, chatId, messageId };
    m = d.match(/^snfyeni_(\d+)$/);
    if (m) return { tur: "yeni", studentTg: m[1], callbackId: String(cb.id), coachTg, chatId };
    return null;
  }
  const msg = update?.message;
  const prompt: string = msg?.reply_to_message?.text || "";
  if (msg?.text && prompt.startsWith(YENI_SINIF_ISARET)) {
    const m = prompt.match(/öğrenci kodu:\s*(\d+)/);
    if (m) {
      return { tur: "ad", studentTg: m[1], ad: String(msg.text), coachTg: String(msg.from?.id ?? ""), chatId: String(msg.chat?.id ?? "") };
    }
  }
  return null;
}
