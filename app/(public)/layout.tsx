import Link from "next/link";

import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/about", label: "Marafon haqida" },
  { href: "/rules", label: "Qoidalar" },
  { href: "/leaderboard", label: "Reyting" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-500 text-white">
              AI
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Bir haftada AI</p>
              <p className="text-xs text-slate-500">7 kunlik amaliy marafon</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link href="/login">Kirish</Link>
            </Button>
            <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
              <Link href="/register">Royxatdan otish</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200/70 bg-white/70">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm text-slate-600 sm:grid-cols-2 sm:px-6 lg:px-8">
          <div>
            <p className="text-base font-semibold text-slate-900">Bir haftada AI</p>
            <p className="mt-2 max-w-sm">
              Rasmiy marafon platformasi: topshiriqlar, baholash va reytinglar bir joyda.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-900">Boglanish</p>
            <p>Telegram: @aimarafon_uz</p>
            <p>Email: info@aimarafon.uz</p>
            <p>Veb: aimarafon.uz</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
