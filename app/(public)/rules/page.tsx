import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rubric = [
  { criterion: "Topshiriqning mavzuga mosligi", points: 20 },
  { criterion: "Prompt sifati va aniqligi", points: 15 },
  { criterion: "AI vositasidan togri foydalanish", points: 15 },
  { criterion: "Natijaning amaliyligi va foydaliligi", points: 20 },
  { criterion: "Kreativ yondashuv va taqdimot sifati", points: 10 },
  { criterion: "AI natijasini tahlil qilish va izohlash", points: 10 },
  { criterion: "Topshiriqni oz vaqtida topshirish", points: 10 },
];

const rules = [
  "Har bir topshiriq uchun prompt, natija va izoh majburiy.",
  "Bir topshiriqqa bir marta yuborish qabul qilinadi.",
  "Kechikkan ishlar punktual ballni kamaytiradi.",
  "Plagiat aniqlansa ish rad etilishi mumkin.",
  "Baholash natijalari reytingda aks ettiriladi.",
];

export default function RulesPage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
          Qoidalar va baholash
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Marafon qoidalari</h1>
        <p className="mt-4 text-base text-slate-600">
          Har bir ishtirokchi topshiriqlarni belgilangan muddatda yuborishi kerak. Baholash
          100 ballik rubrika asosida amalga oshiriladi.
        </p>
      </section>

      <Card className="border-slate-200/70">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">100 ballik baholash rubrikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mezon</TableHead>
                <TableHead className="text-right">Ball</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rubric.map((item) => (
                <TableRow key={item.criterion}>
                  <TableCell>{item.criterion}</TableCell>
                  <TableCell className="text-right font-medium">{item.points}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-semibold">Jami</TableCell>
                <TableCell className="text-right font-semibold">100</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-slate-200/70">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Asosiy qoidalar</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-slate-600">
            {rules.map((rule) => (
              <li key={rule} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-indigo-600" />
                {rule}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
