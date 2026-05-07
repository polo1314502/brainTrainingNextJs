# 🧠 Brain Training

A collection of fun, browser-based brain-training mini-games built with **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## Games

| Game | Route | Description |
|---|---|---|
| 🎨 **Memorize the Sequence** | `/games/memorize-sequence` | Watch colored buttons light up in a sequence, then repeat the pattern from memory. Adjust the sequence length (1–20) for more challenge. |
| 🔵 **Quick Count** | `/games/quick-count` | A scatter of blue circles flashes for 2 seconds — count them before they disappear. The number increases as your score grows. |
| 🧩 **Logic Grid Puzzle** | `/games/logic-grid` | Use deductive clues to match people ↔ house colors ↔ pets. A classic Einstein-style brain teaser with a randomised puzzle each round. |

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **UI:** [React 19](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)
- **Fonts:** Geist Sans & Geist Mono via `next/font/google`
- **Linting:** ESLint 9 with `eslint-config-next`

---

## Project Structure

```
app/
├── layout.tsx                  # Root layout (fonts, global CSS)
├── page.tsx                    # Home dashboard (game card grid)
├── globals.css                 # Global Tailwind styles
├── components/
│   ├── GameCard.tsx             # Reusable game card link component
│   └── games/
│       ├── MemorizeSequenceGame.tsx
│       ├── QuickCountGame.tsx
│       └── LogicGridPuzzleGame.tsx
└── games/
    ├── memorize-sequence/page.tsx
    ├── quick-count/page.tsx
    └── logic-grid/page.tsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm / bun)

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Create an optimised production build |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

---

## Adding a New Game

1. **Create the game component** in `app/components/games/YourGame.tsx`.  
   Add `"use client";` at the top if the component uses React state or browser APIs.

2. **Create the route page** at `app/games/your-game/page.tsx`:
   ```tsx
   import Link from "next/link";
   import YourGame from "../../components/games/YourGame";

   export default function YourGamePage() {
     return (
       <div className="min-h-screen bg-<color>-50">
         <nav className="px-6 py-4 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
           <Link href="/" className="text-<color>-600 font-medium hover:text-<color>-800 transition">
             ← Back to Dashboard
           </Link>
         </nav>
         <main className="max-w-2xl mx-auto py-8">
           <YourGame />
         </main>
       </div>
     );
   }
   ```

3. **Register the game card** in `app/page.tsx` by adding an entry to the `GAMES` array:
   ```ts
   {
     href: "/games/your-game",
     emoji: "🎮",
     title: "Your Game Title",
     description: "Short description shown on the home card.",
     color: "bg-<color>-50 hover:bg-<color>-100",
   }
   ```

---

## Deployment

The easiest way to deploy is [Vercel](https://vercel.com):

```bash
npx vercel
```

Or push to a GitHub repository connected to Vercel for automatic deployments on every push.

See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other hosting options.
