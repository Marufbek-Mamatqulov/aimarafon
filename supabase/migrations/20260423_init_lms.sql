-- aimarafon.uz LMS initial schema
-- Core modules: profiles, tasks, submissions, grades, leaderboard, analytics views

create extension if not exists "pgcrypto";

-- Enums
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('participant', 'expert', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.submission_status AS ENUM ('pending', 'graded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.ai_job_status AS ENUM ('queued', 'processing', 'done', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL UNIQUE,
  phone text,
  region text,
  workplace text,
  role public.app_role NOT NULL DEFAULT 'participant',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles (region);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number smallint NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  video_url text,
  instruction_markdown text NOT NULL DEFAULT '',
  deadline timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (day_number)
);

CREATE INDEX IF NOT EXISTS idx_tasks_day_number ON public.tasks (day_number);

-- Seed initial 7-day tasks (safe to run multiple times)
INSERT INTO public.tasks (
  day_number,
  title,
  description,
  video_url,
  instruction_markdown,
  deadline
)
VALUES
  (
    1,
    'AI bilan dars rejasi',
    'Mavzu asosida 45 daqiqalik dars rejasi yarating.',
    NULL,
    'Prompt yozing, natijani Canva/Gamma orqali vizuallashtiring, ish havolasini yuboring.',
    timezone('utc', now()) + interval '1 day'
  ),
  (
    2,
    'Baholash rubrikasi',
    '7 mezonli baholash rubrikasi ishlab chiqing.',
    NULL,
    'Prompt sifati va amaliy qiymatga e''tibor qarating.',
    timezone('utc', now()) + interval '2 day'
  ),
  (
    3,
    'Prezentatsiya avtomatlashtirish',
    'AI yordamida o''quv prezentatsiyasi tayyorlang.',
    NULL,
    'Canva yoki Gamma link va promptni birga yuboring.',
    timezone('utc', now()) + interval '3 day'
  ),
  (
    4,
    'Ma''lumot tahlili mini-loyiha',
    'Oddiy dataset asosida xulosa va tavsiya chiqaring.',
    NULL,
    'Natijani qisqa AI result analysis bilan izohlang.',
    timezone('utc', now()) + interval '4 day'
  ),
  (
    5,
    'Kontent rejalashtirish',
    'Haftalik kontent rejasini AI bilan yarating.',
    NULL,
    'Practicality va creativity mezonlarini asoslang.',
    timezone('utc', now()) + interval '5 day'
  ),
  (
    6,
    'Prompt optimizatsiyasi',
    'Bitta vazifa uchun 3 ta prompt variantini taqqoslang.',
    NULL,
    'Har variant uchun natija tahlili yozing.',
    timezone('utc', now()) + interval '6 day'
  ),
  (
    7,
    'Yakuniy capstone',
    'AI integratsiyalangan amaliy loyiha taqdim eting.',
    NULL,
    'To''liq prompt, natija, tahlil va utility xulosasini kiriting.',
    timezone('utc', now()) + interval '7 day'
  )
ON CONFLICT (day_number) DO NOTHING;

-- Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  prompt_text text NOT NULL,
  work_link text,
  file_url text,
  status public.submission_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON public.submissions (task_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions (status);
CREATE INDEX IF NOT EXISTS idx_submissions_work_link ON public.submissions (work_link);

-- Grades
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES public.submissions (id) ON DELETE CASCADE,
  expert_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ai_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (ai_score >= 0 AND ai_score <= 100),
  final_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (final_score >= 0 AND final_score <= 100),
  criterion_1_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (criterion_1_score >= 0 AND criterion_1_score <= 20), -- task relevance
  criterion_2_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (criterion_2_score >= 0 AND criterion_2_score <= 15), -- prompt quality
  criterion_3_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (criterion_3_score >= 0 AND criterion_3_score <= 15), -- tool usage
  criterion_4_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (criterion_4_score >= 0 AND criterion_4_score <= 20), -- practicality
  criterion_5_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (criterion_5_score >= 0 AND criterion_5_score <= 10), -- creativity
  criterion_6_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (criterion_6_score >= 0 AND criterion_6_score <= 10), -- result analysis
  criterion_7_score numeric(5,2) NOT NULL DEFAULT 0 CHECK (criterion_7_score >= 0 AND criterion_7_score <= 10), -- timeliness
  ai_feedback text,
  expert_comment text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON public.grades (submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_ai_score_desc ON public.grades (ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_grades_final_score_desc ON public.grades (final_score DESC);

-- AI grading queue for background processing
CREATE TABLE IF NOT EXISTS public.ai_grading_jobs (
  id bigserial PRIMARY KEY,
  submission_id uuid NOT NULL UNIQUE REFERENCES public.submissions (id) ON DELETE CASCADE,
  status public.ai_job_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_ai_grading_jobs_status_created_at
  ON public.ai_grading_jobs (status, created_at);

-- Supabase Storage bucket for participant uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-files',
  'submission-files',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS submission_files_select_own_or_staff ON storage.objects;
CREATE POLICY submission_files_select_own_or_staff
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('expert', 'admin')
    )
  )
);

DROP POLICY IF EXISTS submission_files_insert_own ON storage.objects;
CREATE POLICY submission_files_insert_own
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submission-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS submission_files_update_own_or_staff ON storage.objects;
CREATE POLICY submission_files_update_own_or_staff
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submission-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('expert', 'admin')
    )
  )
)
WITH CHECK (
  bucket_id = 'submission-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('expert', 'admin')
    )
  )
);

DROP POLICY IF EXISTS submission_files_delete_own_or_staff ON storage.objects;
CREATE POLICY submission_files_delete_own_or_staff
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'submission-files'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('expert', 'admin')
    )
  )
);

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_submissions_updated_at ON public.submissions;
CREATE TRIGGER trg_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_grades_updated_at ON public.grades;
CREATE TRIGGER trg_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ai_grading_jobs_updated_at ON public.ai_grading_jobs;
CREATE TRIGGER trg_ai_grading_jobs_updated_at
BEFORE UPDATE ON public.ai_grading_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auth helpers
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_user_role() IN ('expert', 'admin'), false);
$$;

CREATE OR REPLACE FUNCTION public.can_submit_task(p_user_id uuid, p_task_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_day int;
BEGIN
  SELECT t.day_number INTO current_day
  FROM public.tasks t
  WHERE t.id = p_task_id;

  IF current_day IS NULL THEN
    RETURN false;
  END IF;

  IF current_day = 1 THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.submissions s
    JOIN public.tasks t ON t.id = s.task_id
    WHERE s.user_id = p_user_id
      AND t.day_number = current_day - 1
  );
END;
$$;

-- Auto-create participant profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    region,
    workplace,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'region',
    NEW.raw_user_meta_data ->> 'workplace',
    'participant'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = CASE
      WHEN public.profiles.full_name = '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Enqueue AI grading job when a submission is created
CREATE OR REPLACE FUNCTION public.enqueue_ai_grading_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_grading_jobs (submission_id, status)
  VALUES (NEW.id, 'queued')
  ON CONFLICT (submission_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_ai_grading_job ON public.submissions;
CREATE TRIGGER trg_enqueue_ai_grading_job
AFTER INSERT ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.enqueue_ai_grading_job();

-- Materialized leaderboard
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard;
CREATE MATERIALIZED VIEW public.leaderboard AS
SELECT
  p.id AS user_id,
  COALESCE(SUM(g.final_score), 0)::numeric(6,2) AS total_points,
  DENSE_RANK() OVER (
    ORDER BY COALESCE(SUM(g.final_score), 0) DESC, p.created_at ASC
  )::int AS rank
FROM public.profiles p
LEFT JOIN public.submissions s ON s.user_id = p.id
LEFT JOIN public.grades g ON g.submission_id = s.id
WHERE p.role = 'participant'
GROUP BY p.id, p.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_id ON public.leaderboard (user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON public.leaderboard (rank);

CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.leaderboard;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_leaderboard ON public.grades;
CREATE TRIGGER trg_refresh_leaderboard
AFTER INSERT OR UPDATE OR DELETE ON public.grades
FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_leaderboard();

-- Analytics views (used by admin dashboard)
CREATE OR REPLACE VIEW public.daily_submission_stats
WITH (security_invoker = true)
AS
SELECT
  t.day_number,
  COUNT(s.id)::int AS submissions_count
FROM public.tasks t
LEFT JOIN public.submissions s ON s.task_id = t.id
GROUP BY t.day_number
ORDER BY t.day_number;

CREATE OR REPLACE VIEW public.regional_participation_stats
WITH (security_invoker = true)
AS
SELECT
  COALESCE(NULLIF(TRIM(p.region), ''), 'Noma''lum') AS region,
  COUNT(*)::int AS participant_count
FROM public.profiles p
WHERE p.role = 'participant'
GROUP BY 1
ORDER BY participant_count DESC;

CREATE OR REPLACE VIEW public.admin_grading_queue
WITH (security_invoker = true)
AS
SELECT
  s.id AS submission_id,
  p.full_name AS participant_name,
  COALESCE(NULLIF(TRIM(p.region), ''), 'Noma''lum') AS region,
  t.title AS task_title,
  t.day_number,
  COALESCE(g.ai_score, 0)::numeric(5,2) AS ai_score,
  s.status,
  s.submitted_at
FROM public.submissions s
JOIN public.profiles p ON p.id = s.user_id
JOIN public.tasks t ON t.id = s.task_id
LEFT JOIN public.grades g ON g.submission_id = s.id
ORDER BY g.ai_score DESC NULLS LAST, s.submitted_at ASC;

CREATE OR REPLACE VIEW public.plagiarism_flags
WITH (security_invoker = true)
AS
WITH duplicate_work_links AS (
  SELECT
    'work_link'::text AS source_type,
    s.work_link AS duplicated_value,
    COUNT(*)::int AS duplicate_count,
    ARRAY_AGG(s.id ORDER BY s.submitted_at) AS submission_ids
  FROM public.submissions s
  WHERE COALESCE(s.work_link, '') <> ''
  GROUP BY s.work_link
  HAVING COUNT(DISTINCT s.user_id) > 1
),
duplicate_prompts AS (
  SELECT
    'prompt_text'::text AS source_type,
    LEFT(s.prompt_text, 300) AS duplicated_value,
    COUNT(*)::int AS duplicate_count,
    ARRAY_AGG(s.id ORDER BY s.submitted_at) AS submission_ids
  FROM public.submissions s
  WHERE COALESCE(s.prompt_text, '') <> ''
  GROUP BY s.prompt_text
  HAVING COUNT(DISTINCT s.user_id) > 1
)
SELECT * FROM duplicate_work_links
UNION ALL
SELECT * FROM duplicate_prompts;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_grading_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS profiles_select_owner_or_staff ON public.profiles;
CREATE POLICY profiles_select_owner_or_staff
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR public.is_staff()
);

DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
);

DROP POLICY IF EXISTS profiles_update_self_or_admin ON public.profiles;
CREATE POLICY profiles_update_self_or_admin
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR public.is_admin()
)
WITH CHECK (
  id = auth.uid() OR public.is_admin()
);

-- Tasks policies
DROP POLICY IF EXISTS tasks_select_authenticated ON public.tasks;
CREATE POLICY tasks_select_authenticated
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS tasks_modify_admin ON public.tasks;
CREATE POLICY tasks_modify_admin
ON public.tasks
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Submissions policies
DROP POLICY IF EXISTS submissions_select_owner_or_staff ON public.submissions;
CREATE POLICY submissions_select_owner_or_staff
ON public.submissions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR public.is_staff()
);

DROP POLICY IF EXISTS submissions_insert_owner_with_sequence_check ON public.submissions;
CREATE POLICY submissions_insert_owner_with_sequence_check
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.can_submit_task(auth.uid(), task_id)
);

DROP POLICY IF EXISTS submissions_update_owner_pending_or_staff ON public.submissions;
CREATE POLICY submissions_update_owner_pending_or_staff
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending') OR public.is_staff()
)
WITH CHECK (
  (user_id = auth.uid() AND status = 'pending') OR public.is_staff()
);

DROP POLICY IF EXISTS submissions_delete_owner_pending_or_admin ON public.submissions;
CREATE POLICY submissions_delete_owner_pending_or_admin
ON public.submissions
FOR DELETE
TO authenticated
USING (
  (user_id = auth.uid() AND status = 'pending') OR public.is_admin()
);

-- Grades policies
DROP POLICY IF EXISTS grades_select_owner_or_staff ON public.grades;
CREATE POLICY grades_select_owner_or_staff
ON public.grades
FOR SELECT
TO authenticated
USING (
  public.is_staff()
  OR EXISTS (
    SELECT 1
    FROM public.submissions s
    WHERE s.id = grades.submission_id
      AND s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS grades_insert_staff ON public.grades;
CREATE POLICY grades_insert_staff
ON public.grades
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_staff()
);

DROP POLICY IF EXISTS grades_update_staff ON public.grades;
CREATE POLICY grades_update_staff
ON public.grades
FOR UPDATE
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS grades_delete_admin ON public.grades;
CREATE POLICY grades_delete_admin
ON public.grades
FOR DELETE
TO authenticated
USING (public.is_admin());

-- AI jobs policies (only staff sees queue; service role bypasses RLS)
DROP POLICY IF EXISTS ai_jobs_select_staff ON public.ai_grading_jobs;
CREATE POLICY ai_jobs_select_staff
ON public.ai_grading_jobs
FOR SELECT
TO authenticated
USING (public.is_staff());

DROP POLICY IF EXISTS ai_jobs_update_staff ON public.ai_grading_jobs;
CREATE POLICY ai_jobs_update_staff
ON public.ai_grading_jobs
FOR UPDATE
TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.tasks TO authenticated;
GRANT SELECT ON public.leaderboard TO authenticated;
GRANT SELECT ON public.daily_submission_stats TO authenticated;
GRANT SELECT ON public.regional_participation_stats TO authenticated;
GRANT SELECT ON public.admin_grading_queue TO authenticated;
GRANT SELECT ON public.plagiarism_flags TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.ai_grading_jobs TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
