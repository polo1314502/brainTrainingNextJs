import Link from "next/link";
import MemorizeSequenceGame from "../../components/games/MemorizeSequenceGame";

export default function MemorizeSequencePage() {
  return (
    <div className="min-h-screen bg-indigo-50">
      <nav className="px-6 py-4 border-b border-indigo-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-800 transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto py-8">
        <MemorizeSequenceGame />
      </main>
    </div>
  );
}
