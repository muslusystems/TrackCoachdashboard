import "server-only";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export function pushConfigured() {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let ready = false;
function init() {
  if (ready) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@trackcoach.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  ready = true;
}

export type PushMessage = { title: string; body: string; url?: string; tag?: string };

/** Bir koçun tüm kayıtlı cihazlarına bildirim yollar; süresi dolmuş abonelikleri temizler. */
export async function sendPushToCoach(coachId: string, msg: PushMessage) {
  if (!pushConfigured()) return { sent: 0, removed: 0, total: 0, configured: false };
  init();
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("coach_id", coachId);
  if (error) throw new Error(error.message);
  const subs = data || [];
  let sent = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: msg.title, body: msg.body, url: msg.url || "/", tag: msg.tag }),
          { TTL: 60 * 60 * 24 }
        );
        sent++;
      } catch (e: any) {
        if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.id);
      }
    })
  );
  if (dead.length) await supabaseAdmin.from("push_subscriptions").delete().in("id", dead);
  return { sent, removed: dead.length, total: subs.length, configured: true };
}
