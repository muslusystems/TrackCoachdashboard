import { TelegramLoginButton } from "@/components/telegram-login-button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm rounded-card border border-ink-100 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          TrackCoach
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Koç panelinize erişmek için Telegram hesabınızla giriş yapın.
        </p>
        <div className="mt-6 flex justify-center">
          <TelegramLoginButton />
        </div>
        <p className="mt-6 text-xs text-ink-400">
          Sisteme kayıtlı olmayan bir Telegram hesabıyla giriş yapamazsınız —
          önce admin bot üzerinden kayıt olun.
        </p>
      </div>
    </main>
  );
}
