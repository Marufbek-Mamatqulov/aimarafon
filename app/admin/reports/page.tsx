import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Hisobotlar</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        Bu bolimda eksport, statistik tahlil va PDF hisobotlar joylashtiriladi.
      </CardContent>
    </Card>
  );
}
