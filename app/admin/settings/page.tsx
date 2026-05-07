import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card className="border-slate-200/70">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">Sozlamalar</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        Admin sozlamalari, rollar, marafon statusi va AI provider sozlamalari shu yerda boshqariladi.
      </CardContent>
    </Card>
  );
}
