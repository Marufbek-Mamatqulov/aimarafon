import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  BarChart3,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const programDays = [
  {
    day: 1,
    title: "AI bilan samarali prompt yozish va matn yaratish",
    description: "Prompt muhandisligi va aniq talablar bilan ishlash.",
  },
  {
    day: 2,
    title: "AI bilan talimiy vizual kontent va rasm yaratish",
    description: "Vizual fikrlash, prompt va natija tahlili.",
  },
  {
    day: 3,
    title: "AI bilan prezentatsiya va slayd tayyorlash",
    description: "Canva yoki Gamma yordamida taqdimotlar.",
  },
  {
    day: 4,
    title: "AI bilan dars ishlanma va metodik material tayyorlash",
    description: "Metodik paketlar va amaliy yondashuvlar.",
  },
  {
    day: 5,
    title: "AI bilan test, topshiriq va baholash vositalari yaratish",
    description: "Baholash rubrikalari va test dizayni.",
  },
  {
    day: 6,
    title: "AI bilan malumot tahlili, jadval va hisobot tayyorlash",
    description: "Hisobotlar, jadval va xulosa chiqarish.",
  },
  {
    day: 7,
    title: "AI natijalarini tekshirish, faktcheking va xavfsiz foydalanish",
    description: "Faktcheking, xavfsizlik va ishonchli natijalar.",
  },
];

const benefits = [
  {
    title: "Oqituvchilar uchun",
    description: "Dars dizayni, vizual va baholash vositalarini tez yaratish.",
    icon: GraduationCap,
  },
  {
    title: "Metodistlar uchun",
    description: "Metodik material va standartlarga mos kontent ishlab chiqish.",
    icon: Target,
  },
  {
    title: "Talabalar uchun",
    description: "AI bilan ishlash amaliyoti va portfolioni boyitish.",
    icon: Sparkles,
  },
];

const rules = [
  "Har kuni bitta topshiriqni bajaring va osha kuni yuboring.",
  "Prompt matni, AI natijasi va qisqa izohni birga taqdim eting.",
  "Natija amaliy va foydali bolishi kerak.",
  "Bir topshiriqqa bir marta yuborish qabul qilinadi.",
  "Kechikkan ishlar uchun ball kamaytiriladi.",
];

const prizes = [
  { title: "1-orin", description: "Noutbuk", icon: Trophy },
  { title: "2-orin", description: "Planshet", icon: Award },
  { title: "3-orin", description: "Yandex stansiya", icon: Award },
  { title: "Keyingi 10 nafar", description: "Esdalik sovgalari", icon: Award },
];

export default function PublicHomePage() {
  return (
    <div className="space-y-20">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-sm lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-cyan-400/20 via-blue-400/20 to-indigo-500/30 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <Badge className="mb-4 bg-blue-50 text-blue-700">7 kunlik AI marafon</Badge>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl lg:text-5xl">
              Bir haftada AI
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Suniy intellekt boyicha 7 kunlik amaliy konikmalar marafoni. Har kuni real
              vazifalar, avtomatik baholash va reytinglar.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                <Link href="/register">Royxatdan otish</Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/leaderboard">
                  Reytingni korish <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card className="border-slate-200/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Marafon davomiyligi</CardTitle>
                </CardHeader>
                <CardContent className="text-xl font-semibold text-slate-900">7 kun</CardContent>
              </Card>
              <Card className="border-slate-200/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Topshiriqlar</CardTitle>
                </CardHeader>
                <CardContent className="text-xl font-semibold text-slate-900">7 ta</CardContent>
              </Card>
              <Card className="border-slate-200/70">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-500">Jami ball</CardTitle>
                </CardHeader>
                <CardContent className="text-xl font-semibold text-slate-900">700</CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/40 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Real vaqt reyting</p>
                <p className="text-xs text-slate-500">Har kun yangilanadi</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">AI baholash</p>
                <p className="text-xs text-slate-500">100 ballik rubrika</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Ekspert tasdigi</p>
                <p className="text-xs text-slate-500">Professional kozi bilan</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 text-sm text-slate-600">
              Har kun yakunida natijalar, kuchli va zaif tomonlar boicha fikrlar beriladi.
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Marafon haqida
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Amaliy ko nikmalar va real natijalar
          </h2>
          <p className="mt-4 text-slate-600">
            Bir haftada AI marafoni ta lim sohasi, metodistlar va yosh mutaxassislar uchun
            mo ljallangan. Har kuni real vazifalar, real promptlar va real natijalar.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
              7 kunlik struktura va aniq rubrika.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-600" />
              AI baholash + ekspert tasdigi.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-violet-500" />
              Reytinglar va sertifikatlar.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
              7 kunlik dastur
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Har kuni amaliy vazifa
            </h2>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/register">Ishtirok etish</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programDays.map((day) => (
            <Card key={day.day} className="border-slate-200/70">
              <CardHeader className="space-y-2">
                <Badge className="w-fit bg-slate-900 text-white">Day {day.day}</Badge>
                <CardTitle className="text-base text-slate-900">{day.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{day.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Foyda
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Kimlar uchun
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <Card key={benefit.title} className="border-slate-200/70">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base text-slate-900">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">{benefit.description}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="rules" className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Qoidalar
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Adolatli baholash va intizom
          </h2>
          <p className="mt-4 text-slate-600">
            Har bir topshiriq 100 ballik rubrika asosida baholanadi. Topshiriqlarni o vaqtida
            topshirish va izoh berish muhim.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
          <ul className="space-y-3 text-sm text-slate-600">
            {rules.map((rule) => (
              <li key={rule} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-indigo-600" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Mukofotlar</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
          Eng yaxshi ishtirokchilar uchun
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {prizes.map((prize) => {
            const Icon = prize.icon;
            return (
              <Card key={prize.title} className="border-slate-200/70">
                <CardHeader className="space-y-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base text-slate-900">{prize.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600">{prize.description}</CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
