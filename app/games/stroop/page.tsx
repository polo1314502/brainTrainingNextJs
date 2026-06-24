import Link from "next/link";
import StroopSprintGame from "../../components/games/StroopSprintGame";

export default function StroopPage() {
  return (
    <div className="min-h-screen bg-rose-50">
      <nav className="px-6 py-4 border-b border-rose-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-rose-600 font-medium hover:text-rose-800 transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto py-8">
        <StroopSprintGame />
      </main>
    </div>
  );
}
