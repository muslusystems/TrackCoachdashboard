# TrackCoach — Koç Paneli

Next.js + Supabase + n8n tabanlı Telegram bot-onaylı giriş ile kurulmuş
koç dashboard'u. Mevcut n8n/Telegram/Supabase sistemine dokunmaz.

## Giriş nasıl çalışır (widget YOK, tamamen bot tabanlı)

1. Dashboard rastgele bir kod (nonce) üretir, `t.me/BotAdi?start=login_<kod>` linkini gösterir.
2. Koç linke tıklar/QR okutur → Telegram uygulaması direkt açılır.
3. n8n admin bot workflow'u `/start login_<kod>` mesajını yakalar, koçu
   doğrular, Supabase'e onay yazar, koça "✅ Giriş onaylandı" mesajı atar.
4. Dashboard arka planda bu onayı kontrol eder (polling), görünce oturumu
   açar ve /ogrenciler'e yönlendirir.

BotFather'da domain ayarı GEREKMİYOR, bot token'ı dashboard'a hiç
girmiyor — doğrulama tamamen n8n tarafında.

## Kurulum

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` içindeki 3 değeri doldur:

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard > Project Settings > API
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — admin botun @kullanıcı adı (@ olmadan)
- `SESSION_SECRET` — `openssl rand -base64 32` ile üret

## Supabase'de yapman gereken tek şey

`login_tokens` tablosunu oluşturan SQL'i (ayrıca paylaştım) SQL Editor'de çalıştır.

## n8n'de yapman gereken tek şey

Admin bot workflow'unu (TrackCoach_admin) **Publish** et — login onay
mantığı zaten eklendi, sadece yayınlaman yeterli.

## Geliştirme

```bash
npm run dev
```

## Vercel'e deploy

1. Bu klasörü bir GitHub reposuna push et.
2. vercel.com'da "Import Project" ile repoyu bağla.
3. Environment Variables kısmına 3 değeri gir.
4. Deploy et. BotFather'da domain ayarına gerek YOK.

## Güvenlik notu

API route'ları Supabase'e `SUPABASE_SERVICE_ROLE_KEY` ile bağlanıyor ve
her sorguyu oturumdaki `coachId` ile filtreliyor. Telegram kimlik
doğrulaması tamamen n8n içinde (bot token orada, hiç dashboard'a
gelmiyor) yapılıyor — bu, bot token'ının client tarafına hiç
sızmamasını garanti eder.

## Mimari

- `app/login` — bot tabanlı giriş (nonce + QR/deep-link + polling)
- `app/api/auth/telegram/start` — nonce üretir, login_tokens'a yazar
- `app/api/auth/telegram/poll` — onay durumunu kontrol eder, session açar
- `app/(dashboard)` — korumalı alan, kenar menü
- `app/(dashboard)/ogrenciler`, `app/(dashboard)/siniflar` — ilk iki ekran
- `lib/session.ts` — imzalı JWT cookie ile oturum yönetimi (jose)

## Sırada ne var

- Ödev Ata ekranı (sürükle-bırak dosya yükleme → Drive API)
- Öğrenci detay sayfası (geçmiş, ödevler)
- Analitik ekranı
- Ayarlar ekranı (email, kredi)
