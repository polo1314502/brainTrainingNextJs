import Link from "next/link";
import LogicGridPuzzleGame from "../../components/games/LogicGridPuzzleGame";

export default function LogicGridPage() {
  return (
    <div className="min-h-screen bg-amber-50">
      <nav className="px-6 py-4 border-b border-amber-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-amber-700 font-medium hover:text-amber-900 transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      <main className="py-8">
        <LogicGridPuzzleGame />
      </main>
    </div>
  );
}
