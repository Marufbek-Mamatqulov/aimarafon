import { Award, Compass, Globe } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const highlights = [
  {
    title: "Amaliy yo nalish",
    description: "Har bir topshiriq real dars, metodika yoki loyiha bilan boglangan.",
    icon: Compass,
  },
  {
    title: "Adolatli baholash",
    description: "AI rubrika va ekspert tasdigi bilan yakuniy natija chiqariladi.",
    icon: Award,
  },
  {
    title: "Hududiy qamrov",
    description: "Marafon butun respublika boylab ta lim hamjamiyatini qamrab oladi.",
    icon: Globe,
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Marafon haqida
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Bir haftada AI</h1>
        <p className="mt-4 text-base text-slate-600">
          "Bir haftada AI" marafoni suniy intellektni talim va metodik jarayonlarga tez va
          amaliy integratsiya qilish uchun yaratilgan. 7 kun davomida ishtirokchilar prompt
          yozish, vizual kontent yaratish, prezentatsiya tayyorlash va faktcheking kabi
          konikmalarni mustahkamlaydi.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-slate-200/70">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-900">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{item.description}</CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
