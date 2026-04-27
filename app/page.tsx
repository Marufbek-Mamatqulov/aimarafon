import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-3xl rounded-2xl border border-cyan-300/20 bg-slate-900/60 p-8 text-center backdrop-blur-sm card-glow">
        <p className="mb-3 text-xs uppercase tracking-[0.35em] text-cyan-300/80">
          Bir haftada AI
        </p>
        <h1 className="mb-4 font-[var(--font-heading)] text-3xl font-semibold text-white sm:text-5xl">
          aimarafon.uz LMS
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-sm text-slate-300 sm:text-base">
          7 kunlik AI marafoni uchun topshiriqlar, ekspert baholash, AI avtomatik
          reyting va real-time liderlar jadvali.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/participant"
            className="rounded-lg border border-purple-300/40 bg-purple-500/10 px-5 py-2.5 text-sm font-medium text-purple-100 transition hover:bg-purple-500/20"
          >
            Participant dashboard
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-5 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/20"
          >
            Admin panelni ochish
          </Link>
        </div>
      </div>
    </main>
  );
}
