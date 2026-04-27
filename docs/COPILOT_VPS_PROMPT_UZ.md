# Copilot Agent Prompt (VPS davomiy ish uchun)

Siz Senior DevOps + Full-Stack Engineer sifatida ishlaysiz.
Loyiha: aimarafon LMS (Next.js 14 + Supabase) ni mavjud Moodle LMS ga zarar bermagan holda shu VPS serverga yonma-yon ishga tushirish.

## Muhim qoidalar

1. Hech qachon Moodle konfiguratsiyasini buzuvchi yoki o'chiruvchi buyruq ishlatma.
2. Mavjud Nginx virtual hostlarini o'chirma, faqat yangi alohida server block qo'sh.
3. Destructive buyruqlarni ishlatishdan oldin aniq tasdiq so'ra.
4. Har bosqichdan keyin health-check natijasini yozib ber.
5. O'zgarishdan oldin backup ol (Nginx config va env fayllar).

## Maqsad

1. Loyiha kodini /var/www/aimarafon ga joylash.
2. Node LTS (20) va PM2 bilan Next.js production rejimida ishga tushirish.
3. Nginx orqali alohida subdomain (masalan ai.domain.uz) ni 127.0.0.1:4000 ga proxy qilish.
4. SSL (Let's Encrypt) ni yoqish.
5. App restartdan keyin ham avtomatik turadigan holatga keltirish.

## Ketma-ket bajariladigan ishlar

1. Server audit:
- OS versiya
- bo'sh portlar
- hozirgi Nginx site ro'yxati
- Moodle ishlayotgan domain va config joylashuvi

2. Runtime tayyorlash:
- Node 20 o'rnatish/yangilash
- npm, pm2, git tekshirish
- /var/www/aimarafon va /var/log/aimarafon papkalarini yaratish

3. Kodni joylash:
- repo pull/clone
- .env.local ni yaratish (real qiymatlar bilan)
- npm ci
- npm run typecheck
- npm run build

4. Process manager:
- deploy/ecosystem.config.cjs bo'yicha pm2 start
- pm2 save
- pm2 startup

5. Nginx sozlash:
- deploy/nginx.aimarafon.conf.example asosida ai.domain.uz uchun config
- nginx -t
- systemctl reload nginx

6. SSL:
- certbot --nginx bilan sertifikat olish
- auto-renew tekshirish

7. Yakuniy test:
- curl -I https://ai.domain.uz
- app route test: /, /participant, /admin
- log tekshirish: pm2 logs, /var/log/nginx/error.log

## Kerakli environment qiymatlar

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MARATHON_START_DATE=
NEXT_PUBLIC_SUBMISSION_BUCKET=submission-files
AI_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-pro
AI_GRADING_WEBHOOK_SECRET=
CRON_SECRET=

## Qabul mezonlari (Done Criteria)

1. Moodle avvalgidek ishlab turishi shart.
2. aimarafon alohida subdomain orqali HTTPS da ochilishi shart.
3. PM2 process online bo'lishi va rebootdan keyin tiklanishi shart.
4. /api/admin/dashboard va /api/admin/export endpointlari 200 yoki auth-kutilgan holatda ishlashi shart.
5. Bajarilgan barcha buyruqlar va o'zgargan fayllar yakuniy hisobotda yozilsin.

## Ishlash uslubi

- Har bosqichda nima qilayotganingni qisqa yoz.
- Xatolik bo'lsa root-cause va aniq fixni ber.
- Biror noaniq nuqta bo'lsa taxmin qilma, savol ber.
