import Link from "next/link";
import ReflectionGame from "../../components/games/ReflectionGame";

export default function ReflectionPage() {
  return (
    <div className="min-h-screen bg-emerald-50">
      <nav className="px-6 py-4 border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-emerald-700 font-medium hover:text-emerald-900 transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto py-8">
        <ReflectionGame />
      </main>
    </div>
  );
}
