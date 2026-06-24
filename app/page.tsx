import GameCard from "./components/GameCard";

const GAMES = [
  {
    href: "/games/memorize-sequence",
    emoji: "🎨",
    title: "Memorize the Sequence",
    description:
      "Watch a sequence of colored buttons light up, then repeat the pattern from memory. How long can you go?",
    color: "bg-indigo-50 hover:bg-indigo-100",
  },
  {
    href: "/games/quick-count",
    emoji: "🔵",
    title: "Quick Count",
    description:
      "A scatter of blue circles flashes on screen for 2 seconds. Count them fast before they disappear!",
    color: "bg-sky-50 hover:bg-sky-100",
  },
  {
    href: "/games/logic-grid",
    emoji: "🧩",
    title: "Logic Grid Puzzle",
    description:
      "Use deductive clues to match people with their house colors and pets. A classic brain teaser!",
    color: "bg-amber-50 hover:bg-amber-100",
  },
  {
    href: "/games/natural-deduction",
    emoji: "🔗",
    title: "Natural Deduction",
    description:
      "Apply logical inference rules step-by-step to derive conclusions from premises. 10 progressive puzzles!",
    color: "bg-violet-50 hover:bg-violet-100",
  },
  {
    href: "/games/reflection",
    emoji: "⚡",
    title: "Reflection Training",
    description:
      "Wait for green, then click as fast as possible. Track your reaction speed and beat your best time.",
    color: "bg-emerald-50 hover:bg-emerald-100",
  },
  {
    href: "/games/stroop",
    emoji: "🟥",
    title: "Stroop Sprint",
    description:
      "Click only when the word matches the ink color. A fast attention-and-inhibition drill.",
    color: "bg-rose-50 hover:bg-rose-100",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      {/* Header */}
      <header className="text-center py-16 px-6">
        <div className="text-6xl mb-4">🧠</div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-3">
          Brain Training
        </h1>
        <p className="text-lg text-gray-500 max-w-md mx-auto">
          Keep your mind sharp with fun and challenging games. Pick one to get started!
        </p>
      </header>

      {/* Game Cards */}
      <main className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES.map((game) => (
            <GameCard key={game.href} {...game} />
          ))}
        </div>
      </main>
    </div>
  );
}
