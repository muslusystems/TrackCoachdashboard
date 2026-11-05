import "server-only";

/** Koç (admin) botuna Bot API çağrısı yapar. Token yalnızca sunucu ortam değişkeninde durur. */
export async function adminBot(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_ADMIN_BOT_TOKEN tanımlı değil");
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return j as any;
}

export function checkSecret(req: Request) {
  const secret = process.env.NEXT_PUBLIC_TRACKCOACH_WEBHOOK_SECRET || process.env.TRACKCOACH_WEBHOOK_SECRET;
  return !!secret && req.headers.get("x-trackcoach-secret") === secret;
}
