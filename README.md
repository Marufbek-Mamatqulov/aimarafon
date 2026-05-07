# Bir haftada AI platformasi

"Bir haftada AI" marafoni uchun zamonaviy, production tayyor web platforma. 7 kunlik amaliy topshiriqlar, AI baholash, ekspert tekshiruvi va jonli reytinglar.

## Texnologiyalar

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage)
- OpenAI yoki Gemini (AI baholash)
- Vercel (deploy)

## Asosiy imkoniyatlar

- Public landing, qoidalar va reyting
- Auth (royxatdan otish, kirish)
- Ishtirokchi dashboard: topshiriqlar, yuborish, natijalar
- Admin panel: ishtirokchilar, topshiriqlar, baholash, nazorat
- Expert panel: sharhlar va tasdiqlar
- Supabase RLS bilan xavfsiz DB

## Ishga tushirish

### 1) Dependency larni ornatish

```bash
npm install
```

### 2) Env sozlash

`.env.example` faylini `.env.local` ga nusxalang va qiymatlarni kiriting.

Muhim env lar:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (faqat server)
- `AI_PROVIDER` (openai | gemini)
- `OPENAI_API_KEY` yoki `GEMINI_API_KEY`
- `AI_GRADING_WEBHOOK_SECRET` (ixtiyoriy)
- `CRON_SECRET` (ixtiyoriy)

### 3) Supabase migration va seed

Supabase CLI bilan:

```bash
npx supabase login
npx supabase link --project-ref <project_ref>
npx supabase db push
```

Seed data:

```bash
npx supabase db seed
```

Agar qo'lda ishlatsangiz:

- `supabase/migrations/20260423_init_lms.sql`
- `supabase/seed.sql`

### 4) Lokal ishga tushirish

```bash
npm run dev
```

Brauzer:

- `http://localhost:3000/`

## Admin user yaratish

Admin yaratish uchun Supabase Auth orqali user oching va `profiles` jadvalida rolni yangilang:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

Expert uchun:

```sql
update public.profiles
set role = 'expert'
where email = 'expert@example.com';
```

## AI baholash qanday ishlaydi

1. Ishtirokchi topshiriq yuboradi -> `submissions`.
2. DB trigger `ai_grading_jobs` ga navbat yaratadi.
3. Worker `/api/ai-grade/worker` navbatni olib `/api/ai-grade` ni chaqiradi.
4. AI JSON formatda baho qaytaradi va `evaluations` jadvaliga yoziladi.
5. `submissions.status` `ai_evaluated` ga otadi.

Agar AI javobi notogri JSON bo'lsa, 1 marta qayta urinadi. Baribir xato bo'lsa, xato holati saqlanadi.

## Deploy (Vercel)

1. GitHub repo ni Vercel ga ulang.
2. Env larni Vercel dashboard ga kiriting.
3. Cron ishlatsa, `CRON_SECRET` belgilang va `vercel.json` ni tekshiring.

## Project struktura

```text
app/
  (public)/
    page.tsx
    about/
    rules/
    leaderboard/
    login/
    register/
  dashboard/
  admin/
  expert/
  api/
components/
  admin/
  expert/
  layout/
  submissions/
  ui/
lib/
  supabase/
  validations/
supabase/
  migrations/
  seed.sql
```

## Kelgusi yaxshilashlar (TODO)

- Export (CSV/Excel) reportlar
- Admin report va analytics panelini boyitish
- Leaderboard filtrlari va search
- Notification va email eslatmalar
- Certificate generator

---

Savollar bo'lsa: info@aimarafon.uz
