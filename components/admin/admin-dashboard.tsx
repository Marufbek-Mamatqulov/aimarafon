"use client";

import {
  AlertTriangle,
  BarChart3,
  Download,
  FileCheck2,
  LogOut,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AdminDashboardData, ExportEntity } from "@/lib/types";

interface AdminDashboardProps {
  data: AdminDashboardData;
  onExport?: (entity: ExportEntity) => void;
  exportingEntity?: ExportEntity | null;
  userLabel?: string | null;
  onSignOut?: () => void;
}

const barColors = ["#22d3ee", "#a855f7", "#67e8f9", "#c084fc", "#06b6d4", "#8b5cf6"];

export function AdminDashboard({
  data,
  onExport,
  exportingEntity,
  userLabel,
  onSignOut,
}: AdminDashboardProps) {
  const gradingCoverage =
    data.stats.submissions > 0
      ? Math.round((data.stats.graded / data.stats.submissions) * 100)
      : 0;

  const statCards = [
    {
      title: "Ro'yxatdan o'tganlar",
      value: data.stats.registrations.toLocaleString(),
      helper: "Jami participantlar",
      icon: Users,
      iconTint: "text-cyan-300",
    },
    {
      title: "Yuborilgan ishlar",
      value: data.stats.submissions.toLocaleString(),
      helper: "7 kun bo'yicha umumiy",
      icon: FileCheck2,
      iconTint: "text-purple-300",
    },
    {
      title: "Baholash qamrovi",
      value: `${gradingCoverage}%`,
      helper: `${data.stats.graded} ta graded`,
      icon: BarChart3,
      iconTint: "text-emerald-300",
    },
    {
      title: "Plagiat signal",
      value: data.stats.plagiarismFlags.toString(),
      helper: "Tekshiruv talab qiladi",
      icon: ShieldAlert,
      iconTint: "text-rose-300",
    },
  ];

  const handleExport = (entity: ExportEntity) => {
    if (onExport) {
      onExport(entity);
      return;
    }

    window.open(`/api/admin/export?entity=${entity}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <header className="reveal rounded-2xl border border-purple-300/20 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/60 p-6 card-glow">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan-300/80">
              Admin & Expert Analytics
            </p>
            <h1 className="font-[var(--font-heading)] text-2xl font-semibold text-white sm:text-3xl">
              aimarafon.uz boshqaruv paneli
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Real-time registratsiya, kunlik topshiriqlar, AI baholash va plagiat
              ogohlantirishlari bitta ekranda.
            </p>
            {userLabel && (
              <p className="mt-3 text-xs text-slate-400">
                Authenticated as: <span className="text-cyan-200">{userLabel}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleExport("users")}
              disabled={!!exportingEntity}
            >
              <Download className="h-4 w-4" />
              {exportingEntity === "users" ? "Export..." : "Users export"}
            </Button>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={() => handleExport("submissions")}
              disabled={!!exportingEntity}
            >
              <Download className="h-4 w-4" />
              {exportingEntity === "submissions" ? "Export..." : "Submissions export"}
            </Button>
            <Button
              variant="default"
              className="gap-2"
              onClick={() => handleExport("results")}
              disabled={!!exportingEntity}
            >
              <Download className="h-4 w-4" />
              {exportingEntity === "results" ? "Export..." : "Final results"}
            </Button>
            {onSignOut && (
              <Button variant="outline" className="gap-2" onClick={onSignOut}>
                <LogOut className="h-4 w-4" />
                Chiqish
              </Button>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={cn("reveal", index > 0 && "reveal-delay-1")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription>{stat.title}</CardDescription>
                  <Icon className={cn("h-4 w-4", stat.iconTint)} />
                </div>
                <CardTitle className="metric-number">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-400">{stat.helper}</CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="reveal reveal-delay-1">
          <CardHeader>
            <CardTitle>Kunlar bo'yicha submissions</CardTitle>
            <CardDescription>Day 1 dan Day 7 gacha aktivlik</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.submissionsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis
                  dataKey="dayNumber"
                  tickFormatter={(value) => `Day ${value}`}
                  stroke="#94a3b8"
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  cursor={{ fill: "rgba(34, 211, 238, 0.08)" }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid rgba(34, 211, 238, 0.25)",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="submissions" radius={[8, 8, 0, 0]}>
                  {data.submissionsByDay.map((entry, index) => (
                    <Cell
                      key={`submissions-cell-${entry.dayNumber}`}
                      fill={barColors[index % barColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="reveal reveal-delay-1">
          <CardHeader>
            <CardTitle>Hududiy qatnashuv</CardTitle>
            <CardDescription>Eng faol viloyatlar kesimi</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.regionalParticipation} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="region"
                  stroke="#94a3b8"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(168, 85, 247, 0.08)" }}
                  contentStyle={{
                    backgroundColor: "#020617",
                    border: "1px solid rgba(168, 85, 247, 0.25)",
                    borderRadius: "10px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="participants" fill="#a855f7" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Grading Queue</CardTitle>
            <CardDescription>
              AI high-score tavsiya qilingan ishlar ekspert tasdig'i uchun
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.gradingQueue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400">
                      Queue bo'sh.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.gradingQueue.map((item) => (
                    <TableRow key={item.submissionId}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-100">{item.participantName}</p>
                          <p className="text-xs text-slate-400">{item.region}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-slate-100">{item.taskTitle}</p>
                          <p className="text-xs text-slate-400">Day {item.dayNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-cyan-200">{item.aiScore}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "graded" ? "secondary" : "default"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Plagiarism Watch</CardTitle>
            <CardDescription>
              Bir xil link yoki prompt yuborilgan holatlar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.plagiarismFlags.length === 0 ? (
              <p className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                Hozircha shubhali nusxalash topilmadi.
              </p>
            ) : (
              data.plagiarismFlags.slice(0, 5).map((flag) => (
                <article
                  key={`${flag.sourceType}-${flag.duplicatedValue}`}
                  className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="danger" className="capitalize">
                      {flag.sourceType.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-rose-200">
                      {flag.duplicateCount} ta submission
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-200">{flag.duplicatedValue}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Expert tekshiruvi tavsiya qilinadi
                  </div>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
