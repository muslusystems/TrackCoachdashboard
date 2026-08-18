# TrackCoach — Koç Paneli

Next.js + Supabase + Telegram Login Widget ile kurulmuş koç dashboard'u.
Mevcut n8n/Telegram/Supabase sistemine dokunmaz, aynı veritabanının üzerine oturur.

## Kurulum

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` içindeki değerleri doldur:

- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard > Project Settings > API
- `TELEGRAM_ADMIN_BOT_TOKEN` — n8n'deki "Telegram admin" credential'ındaki aynı token
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — admin botun @kullanıcı adı (@ olmadan)
- `SESSION_SECRET` — `openssl rand -base64 32` ile üret

## Telegram tarafında yapman gereken tek şey

Telegram Login Widget, botun hangi domainlerden çağrılabileceğini bilmek zorunda.
@BotFather'a git, admin botunu seç, **Bot Settings > Domain** ile deploy edeceğin
domaini (örn. `trackcoach-dashboard.vercel.app`) tanımla. Bu yapılmazsa giriş
butonu görünür ama tıklayınca hata verir.

## Geliştirme

```bash
npm run dev
```

## Vercel'e deploy

1. Bu klasörü bir GitHub reposuna push et.
2. vercel.com'da "Import Project" ile repoyu bağla.
3. Environment Variables kısmına `.env.local`'deki değerleri tek tek gir.
4. Deploy sonrası gerçek domaini @BotFather'daki domain ayarına ekle.

## Güvenlik notu

API route'ları Supabase'e `SUPABASE_SERVICE_ROLE_KEY` ile bağlanıyor (Row Level
Security'yi bypass eder) ve her sorguyu oturumdaki `coachId` ile filtreliyor.
Bu MVP için yeterli ama ileride Supabase RLS politikaları eklemek istersen
`lib/supabaseAdmin.ts` dosyasındaki client'ı referans al.

## Mimari

- `app/login` — Telegram Login Widget
- `app/api/auth/telegram` — Telegram imza doğrulama + session cookie oluşturma
- `app/(dashboard)` — korumalı alan, kenar menü
- `app/(dashboard)/ogrenciler`, `app/(dashboard)/siniflar` — ilk iki ekran
- `lib/session.ts` — imzalı JWT cookie ile oturum yönetimi (jose)

## Sırada ne var

- Ödev Ata ekranı (sürükle-bırak dosya yükleme → Drive API)
- Öğrenci detay sayfası (geçmiş, ödevler)
- Analitik ekranı
- Ayarlar ekranı (email, kredi)
