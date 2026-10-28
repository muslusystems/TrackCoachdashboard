"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LoginState = "idle" | "waiting" | "expired" | "error";

export default function LoginPage() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>("idle");
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const nonceRef = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollTimer.current) clearInterval(pollTimer.current);
  }

  async function startLogin() {
    setState("waiting");
    const res = await fetch("/api/auth/telegram/start", { method: "POST" });
    if (!res.ok) {
      setState("error");
      return;
    }
    const data = await res.json();
    nonceRef.current = data.nonce;
    setDeepLink(data.deepLink);

    if (/Mobi|Android/i.test(navigator.userAgent)) {
      window.location.href = data.deepLink;
    }

    pollTimer.current = setInterval(async () => {
      if (!nonceRef.current) return;
      const pollRes = await fetch(
        `/api/auth/telegram/poll?nonce=${nonceRef.current}`
      );
      const pollData = await pollRes.json();

      if (pollData.status === "confirmed") {
        stopPolling();
        router.push("/ogrenciler");
      } else if (pollData.status === "expired" || pollData.status === "not_found") {
        stopPolling();
        setState("expired");
      }
    }, 2000);
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const qrSrc = deepLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        deepLink
      )}`
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-night-900 via-night-800 to-signal-800 px-4">
      <div className="w-full max-w-sm rounded-card bg-white p-8 text-center shadow-pop">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-signal-400 to-signal-700 font-display text-xl font-semibold text-white shadow-card">T</span>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          TrackCoach
        </h1>
        <p className="mt-2 text-sm text-ink-400">
          Koç panelinize erişmek için Telegram hesabınızla giriş yapın.
        </p>

        {state === "idle" && (
          <button
            onClick={startLogin}
            className="mt-6 w-full rounded-xl bg-gradient-to-b from-signal-500 to-signal-700 px-4 py-3 text-sm font-medium text-white shadow-card hover:from-signal-600 hover:to-signal-800"
          >
            Telegram ile Giriş Yap
          </button>
        )}

        {state === "waiting" && deepLink && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-ink-600">
              Telegram uygulamasında devam etmek için butona dokunun.
            </p>
            <a
              href={deepLink}
              className="block w-full rounded-xl bg-gradient-to-b from-signal-500 to-signal-700 px-4 py-3 text-sm font-medium text-white shadow-card hover:from-signal-600 hover:to-signal-800"
            >
              Telegram&apos;ı Aç
            </a>
            {qrSrc && (
              <div className="mt-5">
                <p className="mb-2 text-xs text-ink-400">
                  Ya da telefonunla QR kodu okut
                </p>
                <img
                  src={qrSrc}
                  alt="Telegram giriş QR kodu"
                  className="mx-auto rounded-md border border-ink-100"
                  width={180}
                  height={180}
                />
              </div>
            )}
            <p className="mt-4 text-xs text-ink-400">
              Onay bekleniyor… Telegram&apos;da botun gönderdiği mesajı
              gördükten sonra bu sayfa otomatik ilerleyecek.
            </p>
          </div>
        )}

        {state === "expired" && (
          <div className="mt-6">
            <p className="text-sm text-pending-700">
              Giriş süresi doldu ya da bu Telegram hesabı kayıtlı değil.
            </p>
            <button
              onClick={startLogin}
              className="mt-4 w-full rounded-xl bg-gradient-to-b from-signal-500 to-signal-700 px-4 py-3 text-sm font-medium text-white shadow-card hover:from-signal-600 hover:to-signal-800"
            >
              Tekrar dene
            </button>
          </div>
        )}

        {state === "error" && (
          <p className="mt-6 text-sm text-pending-700">
            Bir şeyler ters gitti, sayfayı yenileyip tekrar dene.
          </p>
        )}

        <p className="mt-6 text-xs text-ink-400">
          Sisteme kayıtlı olmayan bir Telegram hesabıyla giriş yapamazsınız —
          önce admin bot üzerinden kayıt olun.
        </p>
      </div>
    </main>
  );
}
