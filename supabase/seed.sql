-- Seed data for aimarafon.uz

insert into public.marathons (title, slug, description, start_date, end_date, status)
values (
  'Bir haftada AI',
  'bir-haftada-ai',
  'Suniy intellekt boyicha 7 kunlik amaliy konikmalar marafoni.',
  date '2026-05-06',
  date '2026-05-12',
  'active'
)
on conflict (slug) do nothing;

with marathon as (
  select id, start_date
  from public.marathons
  where slug = 'bir-haftada-ai'
  limit 1
),
seed_tasks as (
  select * from (values
    (1, 'AI bilan samarali prompt yozish va matn yaratish', 'Matn yaratish va prompt muhandisligi asoslari.', 'Aniq rol, format va cheklovlar bilan prompt yozing. Natijani tahlil qiling.', 'Prompt matni, AI natijasi va izoh.'),
    (2, 'AI bilan talimiy vizual kontent va rasm yaratish', 'Taftish uchun vizual kontent ishlab chiqing.', 'Prompt va ishlatilgan AI vositasini korsating. Natija foydali bolsin.', 'Prompt, rasm yoki vizual link, izoh.'),
    (3, 'AI bilan prezentatsiya va slayd tayyorlash', 'Mavzu boyicha slaydlar toplamini tayyorlang.', 'Prezentatsiya linki va prompt matnini yuboring.', 'Prompt, slaydlar linki, izoh.'),
    (4, 'AI bilan dars ishlanma va metodik material tayyorlash', 'Metodik material tayyorlash boicha amaliy vazifa.', 'Prompt va yakuniy natijani baholang.', 'Prompt, natija, izoh.'),
    (5, 'AI bilan test, topshiriq va baholash vositalari yaratish', 'Test va baholash vositalari ishlab chiqing.', 'Mezonlar va baholash izohi bolsin.', 'Prompt, test/ruyhat, izoh.'),
    (6, 'AI bilan malumot tahlili, jadval va hisobot tayyorlash', 'Malumotlar asosida jadval va hisobot yarating.', 'Natijani foydali xulosalar bilan taqdim eting.', 'Prompt, jadval yoki hisobot, izoh.'),
    (7, 'AI natijalarini tekshirish, faktcheking va xavfsiz foydalanish', 'AI natijasini tekshirish va xavfsiz foydalanish.', 'Faktcheking usullari va xatolar tahlili bolsin.', 'Prompt, natija, tahlil.' )
  ) as t(day_number, title, description, instruction, expected_output)
)
insert into public.tasks (
  marathon_id,
  day_number,
  title,
  description,
  instruction,
  expected_output,
  deadline,
  max_score,
  is_published
)
select
  marathon.id,
  t.day_number,
  t.title,
  t.description,
  t.instruction,
  t.expected_output,
  (marathon.start_date::timestamptz + ((t.day_number - 1) || ' day')::interval),
  100,
  true
from marathon
join seed_tasks t on true
on conflict (marathon_id, day_number) do nothing;
