import Link from "next/link";

interface GameCardProps {
  href: string;
  emoji: string;
  title: string;
  description: string;
  color: string;
}

export default function GameCard({ href, emoji, title, description, color }: GameCardProps) {
  return (
    <Link href={href} className="group block">
      <div
        className={`rounded-2xl p-6 h-full flex flex-col gap-3 border border-transparent shadow-sm transition-all duration-200 group-hover:shadow-lg group-hover:scale-105 ${color}`}
      >
        <div className="text-5xl">{emoji}</div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-600 flex-1">{description}</p>
        <span className="mt-2 inline-block px-4 py-1.5 bg-white/70 rounded-full text-sm font-semibold text-gray-700 group-hover:bg-white transition">
          Play →
        </span>
      </div>
    </Link>
  );
}
