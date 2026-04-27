# aimarafon.uz

Specialized Learning Management System (LMS) for the 7-day AI marathon **"Bir haftada AI"**.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Shadcn-style UI components
- Supabase (PostgreSQL, Auth, Storage)
- OpenAI (GPT-4o) or Google Gemini for auto-grading
- Recharts for analytics
- xlsx for exports

## Folder Structure

```text
aimarafon.uz/
├─ app/
│  ├─ api/
│  │  ├─ admin/
│  │  │  ├─ dashboard/
│  │  │  │  └─ route.ts              # Staff-auth protected dashboard API
│  │  │  └─ export/
│  │  │     └─ route.ts              # Staff-auth protected export API
│  │  └─ ai-grade/
│  │     ├─ route.ts                 # AI scoring endpoint (submission -> grade)
│  │     └─ worker/
│  │        └─ route.ts              # Background queue worker endpoint
│  ├─ admin/
│  │  └─ page.tsx                    # Admin dashboard page
│  ├─ participant/
│  │  └─ page.tsx                    # Participant dashboard page
│  ├─ globals.css                    # Dark futuristic branding
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ admin/
│  │  ├─ admin-console.tsx           # Staff auth + dashboard orchestration
│  │  └─ admin-dashboard.tsx         # Analytics + grading queue + plagiarism UI
│  ├─ participant/
│  │  └─ participant-dashboard.tsx    # Task flow + submission + leaderboard
│  └─ ui/
│     ├─ badge.tsx
│     ├─ button.tsx
│     ├─ card.tsx
│     ├─ input.tsx
│     ├─ table.tsx
│     └─ textarea.tsx
├─ lib/
│  ├─ supabase/
│  │  └─ admin.ts                    # Service-role Supabase client
│  │  └─ browser.ts                  # Browser-side Supabase client
│  │  └─ authz.ts                    # Staff role authorization helper
│  ├─ dashboard-data.ts              # Admin dashboard data fetch + fallback
│  ├─ participant-demo.ts            # Demo fallback data
│  ├─ participant-types.ts
│  ├─ types.ts
│  └─ utils.ts
├─ supabase/
│  └─ migrations/
│     └─ 20260423_init_lms.sql       # Full DB schema + RLS + views + leaderboard
├─ .env.example
├─ components.json
├─ next.config.mjs
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
└─ tsconfig.json
```

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill values.
   - `NEXT_PUBLIC_MARATHON_START_DATE` example: `2026-04-23T00:00:00Z`
   - `NEXT_PUBLIC_SUBMISSION_BUCKET` default: `submission-files`
3. Apply Supabase migration (CLI):
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   If you prefer manual SQL execution, run:
   - `supabase/migrations/20260423_init_lms.sql`
4. Run the app:
   ```bash
   npm run dev
   ```

### Local Run Checklist (Current Workspace)

1. `npm install`
2. `npm run typecheck`
3. `npm run dev`
4. Open:
   - `http://localhost:3000/`
   - `http://localhost:3000/participant`
   - `http://localhost:3000/admin`

If you see stale module errors in dev, clear cache and rerun:

```bash
npx rimraf .next
npm run dev
```

## AI Grading Flow

1. Participant submits task -> row inserted into `submissions`.
2. DB trigger auto-enqueues a row in `ai_grading_jobs`.
3. Worker endpoint processes the oldest queued job.
4. Worker calls `POST /api/ai-grade`.
5. AI evaluates by 7 criteria, saves into `grades`, and updates `submissions.status='graded'`.
6. `leaderboard` materialized view refreshes after grade changes.

## Participant Flow

1. Open `/participant`.
2. Login or register via Supabase Auth.
3. Day tasks open sequentially (previous day submitted) or by `NEXT_PUBLIC_MARATHON_START_DATE`.
4. Submit `Prompt Text`, `Work Link`, and optional image/PDF upload.
5. Submission is queued in `ai_grading_jobs` and evaluated by AI worker.

## Important Endpoints

- `GET /api/admin/dashboard`
  - Returns analytics dataset for admin panel.
  - In live mode requires `Authorization: Bearer <supabase_access_token>`.

- `GET /api/admin/export?entity=users|submissions|results`
  - Streams Excel file for selected entity.
  - In live mode requires `Authorization: Bearer <supabase_access_token>`.

- `POST /api/ai-grade`
  - Body: `{ "submissionId": "<uuid>", "provider": "openai" | "gemini" }`
  - Header (optional, recommended): `x-webhook-secret`

- `POST /api/ai-grade/worker`
  - Runs one queued grading job.
  - Protected by `x-webhook-secret` when configured.

- `GET /api/ai-grade/worker`
  - Cron-compatible path for scheduled processing.
  - Accepts `Authorization: Bearer <CRON_SECRET>` for Vercel Cron.

## Worker Scheduling

- Vercel Cron config is in `vercel.json` and runs every 5 minutes.
- Add `CRON_SECRET` in your Vercel Environment Variables to secure cron calls.
- Keep `AI_GRADING_WEBHOOK_SECRET` for manual or webhook `POST` calls.

## Notes

- Timeliness criterion is calculated server-side from `submitted_at` and task `deadline`.
- Admin dashboard reads from SQL views:
  - `daily_submission_stats`
  - `regional_participation_stats`
  - `admin_grading_queue`
  - `plagiarism_flags`
- `leaderboard` is a materialized view with rank calculation.
- Without Supabase credentials in `.env.local`, app works in demo fallback mode for UI preview.
- With Supabase credentials configured, admin routes are protected by staff role check (`expert` or `admin`).

## VPS Continue Docs

- Copilot continuation prompt: `docs/COPILOT_VPS_PROMPT_UZ.md`
- Step-by-step VPS checklist: `docs/VPS_DEPLOYMENT_CHECKLIST.md`
- PM2 config template: `deploy/ecosystem.config.cjs`
- Nginx config template: `deploy/nginx.aimarafon.conf.example`
