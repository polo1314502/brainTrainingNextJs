import Link from "next/link";
import MastermindGame from "../../components/games/MastermindGame";

export default function MastermindPage() {
  return (
    <div className="min-h-screen bg-fuchsia-50">
      <nav className="px-6 py-4 border-b border-fuchsia-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fuchsia-600 font-medium hover:text-fuchsia-800 transition"
        >
          ← Back to Dashboard
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto py-8">
        <MastermindGame />
      </main>
    </div>
  );
}
