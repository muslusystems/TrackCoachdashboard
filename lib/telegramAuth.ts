import crypto from "crypto";

export type TelegramAuthData = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

/**
 * Telegram Login Widget'ın gönderdiği veriyi doğrular.
 * Referans: https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(data: TelegramAuthData): boolean {
  const botToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_ADMIN_BOT_TOKEN tanımlı değil");

  const { hash, ...rest } = data;

  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${(rest as Record<string, unknown>)[key]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  if (hmac !== hash) return false;

  // auth_date 24 saatten eski ise reddet
  const isFresh = Date.now() / 1000 - data.auth_date < 60 * 60 * 24;
  return isFresh;
}
