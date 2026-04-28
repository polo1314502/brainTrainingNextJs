import Link from "next/link";
import QuickCountGame from "../../components/games/QuickCountGame";

export default function QuickCountPage() {
  return (
    <div className="min-h-screen bg-sky-50">
      <nav className="px-6 py-4 border-b border-sky-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sky-600 font-medium hover:text-sky-800 transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto py-8">
        <QuickCountGame />
      </main>
    </div>
  );
}
