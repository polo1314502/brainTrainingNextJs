import Link from "next/link";
import NaturalDeductionGame from "../../components/games/NaturalDeductionGame";

export default function NaturalDeductionPage() {
  return (
    <div className="min-h-screen bg-violet-50">
      <nav className="px-6 py-4 border-b border-violet-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-violet-700 font-medium hover:text-violet-900 transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      <main className="py-8">
        <NaturalDeductionGame />
      </main>
    </div>
  );
}
