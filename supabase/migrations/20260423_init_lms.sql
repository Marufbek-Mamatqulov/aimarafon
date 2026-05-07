-- aimarafon.uz marathon platform schema

create extension if not exists "pgcrypto";

create sequence if not exists public.participant_code_seq;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  organization text,
  region text,
  role text not null default 'participant' check (role in ('admin', 'expert', 'participant')),
  participant_code text unique,
  avatar_url text,
  is_blocked boolean not null default false,
  rules_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_region on public.profiles (region);
create index if not exists idx_profiles_participant_code on public.profiles (participant_code);

create table if not exists public.marathons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marathons_status on public.marathons (status);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  marathon_id uuid references public.marathons (id) on delete cascade,
  day_number int not null,
  title text not null,
  description text not null,
  instruction text,
  expected_output text,
  deadline timestamptz,
  max_score int not null default 100,
  is_published boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (marathon_id, day_number)
);

create index if not exists idx_tasks_marathon_id on public.tasks (marathon_id);
create index if not exists idx_tasks_day_number on public.tasks (day_number);
create index if not exists idx_tasks_is_published on public.tasks (is_published);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  participant_id uuid not null references public.profiles (id) on delete cascade,
  prompt_text text not null,
  ai_result text,
  result_url text,
  file_url text,
  participant_comment text,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'ai_evaluated', 'expert_reviewed', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  is_late boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, participant_id)
);

create index if not exists idx_submissions_task_id on public.submissions (task_id);
create index if not exists idx_submissions_participant_id on public.submissions (participant_id);
create index if not exists idx_submissions_status on public.submissions (status);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  relevance_score int not null default 0 check (relevance_score between 0 and 20),
  prompt_quality_score int not null default 0 check (prompt_quality_score between 0 and 15),
  ai_usage_score int not null default 0 check (ai_usage_score between 0 and 15),
  practical_value_score int not null default 0 check (practical_value_score between 0 and 20),
  creativity_score int not null default 0 check (creativity_score between 0 and 10),
  analysis_score int not null default 0 check (analysis_score between 0 and 10),
  punctuality_score int not null default 0 check (punctuality_score between 0 and 10),
  total_score int not null default 0 check (total_score between 0 and 100),
  ai_feedback text,
  ai_raw_response jsonb,
  evaluated_by_ai boolean not null default true,
  approved_by uuid references public.profiles (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_evaluations_submission_id on public.evaluations (submission_id);
create index if not exists idx_evaluations_total_score on public.evaluations (total_score desc);

create table if not exists public.expert_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  expert_id uuid not null references public.profiles (id) on delete cascade,
  score int,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, expert_id)
);

create index if not exists idx_expert_reviews_submission_id on public.expert_reviews (submission_id);
create index if not exists idx_expert_reviews_expert_id on public.expert_reviews (expert_id);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all' check (audience in ('all', 'participants', 'experts', 'admins')),
  is_published boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_audience on public.announcements (audience);
create index if not exists idx_announcements_is_published on public.announcements (is_published);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.profiles (id) on delete cascade,
  marathon_id uuid not null references public.marathons (id) on delete cascade,
  certificate_number text unique,
  certificate_url text,
  final_score int,
  rank int,
  issued_at timestamptz not null default now()
);

create index if not exists idx_certificates_participant_id on public.certificates (participant_id);
create index if not exists idx_certificates_marathon_id on public.certificates (marathon_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index if not exists idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

create table if not exists public.ai_grading_jobs (
  id bigserial primary key,
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'done', 'failed')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_grading_jobs_status_created_at
  on public.ai_grading_jobs (status, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.generate_participant_code()
returns text
language plpgsql
as $$
declare
  seq_value bigint;
  year_text text;
begin
  seq_value := nextval('public.participant_code_seq');
  year_text := to_char(now(), 'YYYY');
  return format('AI-%s-%06s', year_text, seq_value);
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_expert()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'expert', false);
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    email,
    organization,
    region,
    role,
    participant_code,
    rules_accepted
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.email,
    new.raw_user_meta_data ->> 'organization',
    new.raw_user_meta_data ->> 'region',
    'participant',
    public.generate_participant_code(),
    coalesce((new.raw_user_meta_data ->> 'rules_accepted')::boolean, false)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = case
      when public.profiles.full_name = '' then excluded.full_name
      else public.profiles.full_name
    end,
    participant_code = coalesce(public.profiles.participant_code, excluded.participant_code),
    rules_accepted = public.profiles.rules_accepted or excluded.rules_accepted;

  return new;
end;
$$;

create or replace function public.set_submission_late_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_deadline timestamptz;
begin
  if new.submitted_at is null then
    new.submitted_at := now();
  end if;

  select deadline into task_deadline
  from public.tasks
  where id = new.task_id;

  if task_deadline is null then
    new.is_late := false;
  else
    new.is_late := new.submitted_at > task_deadline;
  end if;

  return new;
end;
$$;

create or replace function public.enqueue_ai_grading_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' and new.status = 'submitted')
    or (tg_op = 'UPDATE' and new.status = 'submitted' and old.status <> 'submitted')
  then
    insert into public.ai_grading_jobs (submission_id, status)
    values (new.id, 'queued')
    on conflict (submission_id) do update
    set status = 'queued',
        last_error = null,
        updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_marathons_updated_at on public.marathons;
create trigger trg_marathons_updated_at
before update on public.marathons
for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists trg_submissions_updated_at on public.submissions;
create trigger trg_submissions_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists trg_evaluations_updated_at on public.evaluations;
create trigger trg_evaluations_updated_at
before update on public.evaluations
for each row execute function public.set_updated_at();

drop trigger if exists trg_expert_reviews_updated_at on public.expert_reviews;
create trigger trg_expert_reviews_updated_at
before update on public.expert_reviews
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_grading_jobs_updated_at on public.ai_grading_jobs;
create trigger trg_ai_grading_jobs_updated_at
before update on public.ai_grading_jobs
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_submission_late_flag on public.submissions;
create trigger trg_set_submission_late_flag
before insert or update on public.submissions
for each row execute function public.set_submission_late_flag();

drop trigger if exists trg_enqueue_ai_grading_job on public.submissions;
create trigger trg_enqueue_ai_grading_job
after insert or update on public.submissions
for each row execute function public.enqueue_ai_grading_job();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace view public.leaderboard_view
as
select
  p.id as participant_id,
  p.participant_code,
  p.full_name,
  p.region,
  p.organization,
  coalesce(sum(case when s.status in ('approved', 'ai_evaluated', 'expert_reviewed') then e.total_score else 0 end), 0) as total_score,
  count(case when s.status in ('approved', 'ai_evaluated', 'expert_reviewed') then 1 end) as completed_tasks_count,
  dense_rank() over (
    order by coalesce(sum(case when s.status in ('approved', 'ai_evaluated', 'expert_reviewed') then e.total_score else 0 end), 0) desc,
    p.created_at asc
  )::int as rank
from public.profiles p
left join public.submissions s on s.participant_id = p.id
left join public.evaluations e on e.submission_id = s.id
where p.role = 'participant'
group by p.id, p.participant_code, p.full_name, p.region, p.organization, p.created_at;

create or replace view public.participant_daily_scores_view
with (security_invoker = true)
as
select
  s.participant_id,
  s.task_id,
  t.day_number,
  t.title as task_title,
  coalesce(e.total_score, 0) as total_score,
  s.status,
  s.submitted_at
from public.submissions s
join public.tasks t on t.id = s.task_id
left join public.evaluations e on e.submission_id = s.id;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-files',
  'submission-files',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists submission_files_select_own_or_staff on storage.objects;
create policy submission_files_select_own_or_staff
on storage.objects
for select
to authenticated
using (
  bucket_id = 'submission-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or public.is_expert()
  )
);

drop policy if exists submission_files_insert_own on storage.objects;
create policy submission_files_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'submission-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists submission_files_update_own_or_staff on storage.objects;
create policy submission_files_update_own_or_staff
on storage.objects
for update
to authenticated
using (
  bucket_id = 'submission-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or public.is_expert()
  )
)
with check (
  bucket_id = 'submission-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or public.is_expert()
  )
);

drop policy if exists submission_files_delete_own_or_staff on storage.objects;
create policy submission_files_delete_own_or_staff
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'submission-files'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or public.is_expert()
  )
);

alter table public.profiles enable row level security;
alter table public.marathons enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;
alter table public.expert_reviews enable row level security;
alter table public.announcements enable row level security;
alter table public.certificates enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_grading_jobs enable row level security;

-- profiles policies
 drop policy if exists profiles_select_owner_or_staff on public.profiles;
create policy profiles_select_owner_or_staff
on public.profiles
for select
to authenticated
using (
  id = auth.uid() or public.is_admin() or public.is_expert()
);

 drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

 drop policy if exists profiles_update_self_limited on public.profiles;
create policy profiles_update_self_limited
on public.profiles
for update
to authenticated
using (id = auth.uid() and public.current_user_role() = 'participant')
with check (
  id = auth.uid()
  and public.current_user_role() = 'participant'
  and role is not distinct from (select role from public.profiles where id = auth.uid())
  and participant_code is not distinct from (select participant_code from public.profiles where id = auth.uid())
  and is_blocked is not distinct from (select is_blocked from public.profiles where id = auth.uid())
  and email is not distinct from (select email from public.profiles where id = auth.uid())
);

 drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- marathons policies
 drop policy if exists marathons_select_public on public.marathons;
create policy marathons_select_public
on public.marathons
for select
to anon
using (status in ('active', 'completed'));

 drop policy if exists marathons_select_authenticated on public.marathons;
create policy marathons_select_authenticated
on public.marathons
for select
to authenticated
using (status <> 'draft' or public.is_admin() or public.is_expert());

 drop policy if exists marathons_manage_admin on public.marathons;
create policy marathons_manage_admin
on public.marathons
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- tasks policies
 drop policy if exists tasks_select_published on public.tasks;
create policy tasks_select_published
on public.tasks
for select
to authenticated
using (is_published or public.is_admin() or public.is_expert());

 drop policy if exists tasks_manage_admin on public.tasks;
create policy tasks_manage_admin
on public.tasks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- submissions policies
 drop policy if exists submissions_select_owner_or_staff on public.submissions;
create policy submissions_select_owner_or_staff
on public.submissions
for select
to authenticated
using (
  participant_id = auth.uid()
  or public.is_admin()
  or public.is_expert()
);

 drop policy if exists submissions_insert_participant on public.submissions;
create policy submissions_insert_participant
on public.submissions
for insert
to authenticated
with check (
  participant_id = auth.uid()
  and public.current_user_role() = 'participant'
  and coalesce((select is_blocked from public.profiles where id = auth.uid()), false) = false
  and status in ('draft', 'submitted')
  and exists (select 1 from public.tasks t where t.id = task_id and t.is_published = true)
  and not exists (
    select 1 from public.submissions s
    where s.task_id = task_id and s.participant_id = auth.uid()
  )
);

 drop policy if exists submissions_update_participant on public.submissions;
create policy submissions_update_participant
on public.submissions
for update
to authenticated
using (
  participant_id = auth.uid()
  and public.current_user_role() = 'participant'
)
with check (
  participant_id = auth.uid()
  and public.current_user_role() = 'participant'
  and coalesce((select is_blocked from public.profiles where id = auth.uid()), false) = false
  and status in ('draft', 'submitted')
  and (
    (select deadline from public.tasks where id = task_id) is null
    or now() <= (select deadline from public.tasks where id = task_id)
  )
);

 drop policy if exists submissions_manage_admin on public.submissions;
create policy submissions_manage_admin
on public.submissions
for all
to authenticated
using (public.is_admin() or public.is_expert())
with check (public.is_admin() or public.is_expert());

-- evaluations policies
 drop policy if exists evaluations_select_owner_or_staff on public.evaluations;
create policy evaluations_select_owner_or_staff
on public.evaluations
for select
to authenticated
using (
  public.is_admin()
  or public.is_expert()
  or exists (
    select 1 from public.submissions s
    where s.id = evaluations.submission_id
      and s.participant_id = auth.uid()
  )
);

 drop policy if exists evaluations_modify_admin on public.evaluations;
create policy evaluations_modify_admin
on public.evaluations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- expert reviews policies
 drop policy if exists expert_reviews_select_owner_or_staff on public.expert_reviews;
create policy expert_reviews_select_owner_or_staff
on public.expert_reviews
for select
to authenticated
using (
  public.is_admin()
  or public.is_expert()
  or exists (
    select 1 from public.submissions s
    where s.id = expert_reviews.submission_id
      and s.participant_id = auth.uid()
  )
);

 drop policy if exists expert_reviews_insert_expert on public.expert_reviews;
create policy expert_reviews_insert_expert
on public.expert_reviews
for insert
to authenticated
with check (
  expert_id = auth.uid()
  and (public.is_expert() or public.is_admin())
);

 drop policy if exists expert_reviews_update_expert on public.expert_reviews;
create policy expert_reviews_update_expert
on public.expert_reviews
for update
to authenticated
using (expert_id = auth.uid() or public.is_admin())
with check (expert_id = auth.uid() or public.is_admin());

 drop policy if exists expert_reviews_delete_admin on public.expert_reviews;
create policy expert_reviews_delete_admin
on public.expert_reviews
for delete
to authenticated
using (public.is_admin());

-- announcements policies
 drop policy if exists announcements_select_public on public.announcements;
create policy announcements_select_public
on public.announcements
for select
to anon
using (is_published = true and audience = 'all');

 drop policy if exists announcements_select_authenticated on public.announcements;
create policy announcements_select_authenticated
on public.announcements
for select
to authenticated
using (
  public.is_admin()
  or public.is_expert()
  or (
    is_published = true
    and (
      audience = 'all'
      or (audience = 'participants' and public.current_user_role() = 'participant')
      or (audience = 'experts' and public.current_user_role() = 'expert')
      or (audience = 'admins' and public.current_user_role() = 'admin')
    )
  )
);

 drop policy if exists announcements_manage_admin on public.announcements;
create policy announcements_manage_admin
on public.announcements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- certificates policies
 drop policy if exists certificates_select_owner_or_staff on public.certificates;
create policy certificates_select_owner_or_staff
on public.certificates
for select
to authenticated
using (
  participant_id = auth.uid()
  or public.is_admin()
  or public.is_expert()
);

 drop policy if exists certificates_manage_admin on public.certificates;
create policy certificates_manage_admin
on public.certificates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- audit logs policies
 drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select
to authenticated
using (public.is_admin());

 drop policy if exists audit_logs_insert_admin on public.audit_logs;
create policy audit_logs_insert_admin
on public.audit_logs
for insert
to authenticated
with check (public.is_admin());

-- ai grading jobs policies
 drop policy if exists ai_grading_jobs_select_staff on public.ai_grading_jobs;
create policy ai_grading_jobs_select_staff
on public.ai_grading_jobs
for select
to authenticated
using (public.is_admin() or public.is_expert());

 drop policy if exists ai_grading_jobs_update_staff on public.ai_grading_jobs;
create policy ai_grading_jobs_update_staff
on public.ai_grading_jobs
for update
to authenticated
using (public.is_admin() or public.is_expert())
with check (public.is_admin() or public.is_expert());

-- grants
grant usage on schema public to anon, authenticated, service_role;

grant select on public.leaderboard_view to anon, authenticated;
grant select on public.participant_daily_scores_view to authenticated;

grant select on public.tasks to authenticated;
grant select on public.announcements to authenticated;

grant select, insert, update on public.ai_grading_jobs to service_role;
grant all on all tables in schema public to service_role;
grant all on all routines in schema public to service_role;
