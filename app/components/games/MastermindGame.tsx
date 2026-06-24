"use client";

import { FormEvent, useMemo, useState } from "react";

type PegColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange";

type GuessResult = {
  exact: number;
  partial: number;
};

type Turn = {
  guess: PegColor[];
  result: GuessResult;
};

const COLORS: { value: PegColor; label: string; chipClass: string }[] = [
  { value: "red", label: "Red", chipClass: "bg-red-500" },
  { value: "blue", label: "Blue", chipClass: "bg-blue-500" },
  { value: "green", label: "Green", chipClass: "bg-emerald-500" },
  { value: "yellow", label: "Yellow", chipClass: "bg-amber-400" },
  { value: "purple", label: "Purple", chipClass: "bg-violet-500" },
  { value: "orange", label: "Orange", chipClass: "bg-orange-500" },
];

const CODE_LENGTH = 4;
const MAX_TURNS = 10;

const pickRandomColor = (): PegColor =>
  COLORS[Math.floor(Math.random() * COLORS.length)].value;

const generateSecret = (): PegColor[] =>
  Array.from({ length: CODE_LENGTH }, pickRandomColor);

const scoreGuess = (secret: PegColor[], guess: PegColor[]): GuessResult => {
  let exact = 0;
  const secretRemainder: Record<PegColor, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    purple: 0,
    orange: 0,
  };
  const guessRemainder: Record<PegColor, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
    purple: 0,
    orange: 0,
  };

  for (let i = 0; i < CODE_LENGTH; i += 1) {
    if (secret[i] === guess[i]) {
      exact += 1;
    } else {
      secretRemainder[secret[i]] += 1;
      guessRemainder[guess[i]] += 1;
    }
  }

  const partial = (Object.keys(secretRemainder) as PegColor[]).reduce(
    (count, color) => count + Math.min(secretRemainder[color], guessRemainder[color]),
    0
  );

  return { exact, partial };
};

if (process.env.NODE_ENV !== "production") {
  const check = scoreGuess(
    ["red", "blue", "green", "yellow"],
    ["red", "green", "purple", "blue"]
  );
  if (check.exact !== 1 || check.partial !== 2) {
    throw new Error("Mastermind score check failed.");
  }
}

export default function MastermindGame() {
  const [secret, setSecret] = useState<PegColor[]>(() => generateSecret());
  const [guess, setGuess] = useState<PegColor[]>(() => Array.from({ length: CODE_LENGTH }, () => "red"));
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState("Pick 4 colors, submit, then use feedback to crack the code.");
  const [won, setWon] = useState(false);

  const remainingTurns = MAX_TURNS - turns.length;
  const finished = won || remainingTurns === 0;

  const secretPreview = useMemo(
    () => (won || remainingTurns === 0 ? secret : Array.from({ length: CODE_LENGTH }, () => null)),
    [remainingTurns, secret, won]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (finished) return;

    const result = scoreGuess(secret, guess);
    const nextTurns = [...turns, { guess: [...guess], result }];
    setTurns(nextTurns);

    if (result.exact === CODE_LENGTH) {
      setWon(true);
      setMessage(`Nice. You cracked it in ${nextTurns.length} turn${nextTurns.length > 1 ? "s" : ""}.`);
      return;
    }

    if (nextTurns.length >= MAX_TURNS) {
      setMessage("Out of turns.");
      return;
    }

    setMessage("Keep going.");
  };

  const resetGame = () => {
    // ponytail: fixed board size/turns for MVP; add difficulty options only if players ask.
    setSecret(generateSecret());
    setGuess(Array.from({ length: CODE_LENGTH }, () => "red"));
    setTurns([]);
    setWon(false);
    setMessage("New game started.");
  };

  return (
    <div className="flex flex-col items-center p-8 gap-6">
      <h1 className="text-3xl font-bold text-gray-800">Mastermind</h1>
      <p className="text-gray-500 text-center max-w-md">
        Feedback: exact = right color in right slot, partial = right color in wrong slot.
      </p>

      <div className="w-full max-w-xl grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white border border-fuchsia-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Turns Left</p>
          <p className="text-xl font-bold text-fuchsia-700">{remainingTurns}</p>
        </div>
        <div className="rounded-xl bg-white border border-fuchsia-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-xl font-bold text-gray-800">{won ? "Won" : finished ? "Lost" : "Playing"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-2xl bg-white border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-600 mb-3">Current Guess</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {guess.map((value, index) => (
            <label key={index} className="flex flex-col gap-2">
              <span className="text-xs text-gray-500">Slot {index + 1}</span>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
                value={value}
                onChange={(event) => {
                  const next = [...guess];
                  next[index] = event.target.value as PegColor;
                  setGuess(next);
                }}
                disabled={finished}
              >
                {COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={finished}
            className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-full font-semibold hover:bg-fuchsia-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            Submit Guess
          </button>
          <button
            type="button"
            onClick={resetGame}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-all"
          >
            New Game
          </button>
        </div>
      </form>

      <p className="text-lg font-medium text-gray-700">{message}</p>

      <div className="w-full max-w-xl rounded-2xl bg-white border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-600 mb-3">History</p>
        {turns.length === 0 ? (
          <p className="text-sm text-gray-500">No guesses yet.</p>
        ) : (
          <div className="space-y-2">
            {turns.map((turn, index) => (
              <div
                key={index}
                className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-lg border border-gray-100 px-3 py-2"
              >
                <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {turn.guess.map((color, colorIndex) => {
                    const chip = COLORS.find((item) => item.value === color);
                    return (
                      <span
                        key={`${index}-${colorIndex}`}
                        aria-label={chip?.label}
                        className={`inline-block h-5 w-5 rounded-full border border-black/10 ${chip?.chipClass}`}
                      />
                    );
                  })}
                  <span className="ml-1 text-sm font-medium text-gray-700">
                    exact {turn.result.exact} • partial {turn.result.partial}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-xl rounded-2xl bg-white border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-600 mb-3">Secret</p>
        <div className="flex gap-2">
          {secretPreview.map((color, index) => {
            if (!color) {
              return <span key={index} className="inline-block h-6 w-6 rounded-full bg-gray-200" />;
            }
            const chip = COLORS.find((item) => item.value === color);
            return (
              <span
                key={index}
                aria-label={chip?.label}
                className={`inline-block h-6 w-6 rounded-full border border-black/10 ${chip?.chipClass}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
