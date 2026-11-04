"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

type St = "yukleniyor" | "desteklenmiyor" | "ios-kur" | "engelli" | "kapali" | "acik";

function toKey(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(Array.from(raw).map((c) => c.charCodeAt(0)));
}

export function PushToggle() {
  const [st, setSt] = useState<St>("yukleniyor");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const ua = navigator.userAgent;
        const ios = /iPad|iPhone|iPod/.test(ua);
        const standalone =
          (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
        if (ios && !standalone) return setSt("ios-kur");
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          return setSt("desteklenmiyor");
        }
        if (Notification.permission === "denied") return setSt("engelli");
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setSt(sub && Notification.permission === "granted" ? "acik" : "kapali");
      } catch {
        setSt("desteklenmiyor");
      }
    })();
  }, []);

  if (!VAPID) return null;

  async function ac() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setSt(perm === "denied" ? "engelli" : "kapali");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(VAPID) }));
      const r = await fetch("/api/push/abone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      if (!r.ok) throw new Error("kayıt");
      setSt("acik");
      setMsg("Bildirimler açıldı.");
    } catch {
      setMsg("Açılamadı, tekrar dene.");
    } finally {
      setBusy(false);
    }
  }

  async function kapat() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch("/api/push/abone", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSt("kapali");
    } catch {
      setMsg("Kapatılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    try {
      const r = await fetch("/api/push/test", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      setMsg(j.sent ? "Test bildirimi gönderildi." : "Gönderilemedi (kayıtlı cihaz bulunamadı).");
    } catch {
      setMsg("Gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  const base = "mt-5 rounded-xl bg-white/[0.06] p-3 text-xs text-signal-200 md:mt-6";
  if (st === "yukleniyor") return null;
  if (st === "ios-kur")
    return <div className={base}>🔔 iPhone'da bildirim için siteyi ana ekrana ekleyip oradan aç.</div>;
  if (st === "desteklenmiyor") return <div className={base}>Bu tarayıcı bildirimleri desteklemiyor.</div>;
  if (st === "engelli")
    return <div className={base}>🔕 Bildirimler tarayıcı ayarlarından engellenmiş. Site ayarlarından izin ver.</div>;

  return (
    <div className={base}>
      {st === "acik" ? (
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-white"><Bell size={14} /> Bildirimler açık</span>
          <span className="flex gap-3">
            <button onClick={test} disabled={busy} className="hover:text-white">Test</button>
            <button onClick={kapat} disabled={busy} className="flex items-center gap-1 hover:text-white">
              <BellOff size={12} /> Kapat
            </button>
          </span>
        </div>
      ) : (
        <button onClick={ac} disabled={busy} className="flex items-center gap-1.5 text-white hover:text-signal-200">
          <Bell size={14} /> Bildirimleri aç
        </button>
      )}
      {msg && <p className="mt-1.5">{msg}</p>}
    </div>
  );
}
