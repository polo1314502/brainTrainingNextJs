"use client";

import { useEffect, useRef, useState } from "react";

type GameState = "idle" | "playing" | "result" | "finished";

type Prompt = {
  word: string;
  inkClass: string;
  shouldMatch: boolean;
};

const WORDS = [
  { label: "Red", inkClass: "text-red-600" },
  { label: "Blue", inkClass: "text-blue-600" },
  { label: "Green", inkClass: "text-emerald-600" },
  { label: "Yellow", inkClass: "text-amber-500" },
  { label: "Purple", inkClass: "text-violet-600" },
] as const;

const TOTAL_ROUNDS = 10;
const STARTING_LIVES = 3;
const ROUND_TIME_MS = 1600;

const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

const makePrompt = (): Prompt => {
  const ink = pick(WORDS);
  const shouldMatch = Math.random() < 0.5;
  const word = shouldMatch ? ink.label : pick(WORDS.filter((item) => item.label !== ink.label)).label;

  return { word, inkClass: ink.inkClass, shouldMatch };
};

export default function StroopSprintGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [resultMessage, setResultMessage] = useState("10 rounds, 3 lives. Click only when the word matches the ink color.");
  const [roundCorrect, setRoundCorrect] = useState(false);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (roundTimerRef.current) {
      clearTimeout(roundTimerRef.current);
      roundTimerRef.current = null;
    }
  };

  const endRound = (success: boolean, message: string) => {
    clearTimer();

    const nextLives = success ? lives : Math.max(0, lives - 1);
    const nextStreak = success ? streak + 1 : 0;
    const nextScore = success ? score + 10 + streak * 2 : score;

    setLives(nextLives);
    setStreak(nextStreak);
    setBestStreak((best) => Math.max(best, nextStreak));
    setScore(nextScore);
    setRoundCorrect(success);
    setGameState("result");
    setResultMessage(message);
  };

  const startRound = () => {
    clearTimer();
    const nextPrompt = makePrompt();
    setPrompt(nextPrompt);
    setGameState("playing");
    setResultMessage(nextPrompt.shouldMatch ? "Tap if it matches." : "Do not tap.");

    roundTimerRef.current = setTimeout(() => {
      endRound(!nextPrompt.shouldMatch, nextPrompt.shouldMatch ? "Missed the match." : "Good restraint.");
    }, ROUND_TIME_MS);
  };

  const startGame = () => {
    clearTimer();
    setRound(1);
    setLives(STARTING_LIVES);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setPrompt(null);
    setRoundCorrect(false);
    startRound();
  };

  const handleClick = () => {
    if (gameState !== "playing" || !prompt) return;
    endRound(prompt.shouldMatch, prompt.shouldMatch ? "Correct match." : "False start.");
  };

  const handleNext = () => {
    if (round >= TOTAL_ROUNDS || lives <= 0) {
      setGameState("finished");
      setPrompt(null);
      setResultMessage(`Done. Score: ${score}.`);
      return;
    }

    setRound((prev) => prev + 1);
    startRound();
  };

  useEffect(
    () => () => {
      if (roundTimerRef.current) {
        clearTimeout(roundTimerRef.current);
      }
    },
    []
  );

  const isPlayable = gameState === "playing";
  const boardClass = isPlayable
    ? "bg-white hover:bg-gray-50 border-gray-200"
    : gameState === "finished"
    ? "bg-gray-100 border-gray-200"
    : "bg-gray-50 border-gray-200";

  return (
    <div className="flex flex-col items-center p-8 gap-6">
      <h1 className="text-3xl font-bold text-gray-800">Stroop Sprint</h1>
      <p className="text-gray-500 text-center max-w-sm">
        Click only when the word matches the ink color. Ignore the rest.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
        <div className="rounded-xl bg-white border border-rose-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Round</p>
          <p className="text-xl font-bold text-rose-700">
            {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-rose-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Lives</p>
          <p className="text-xl font-bold text-red-600">{lives}</p>
        </div>
        <div className="rounded-xl bg-white border border-rose-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Streak</p>
          <p className="text-xl font-bold text-violet-600">{streak}</p>
        </div>
        <div className="rounded-xl bg-white border border-rose-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Score</p>
          <p className="text-xl font-bold text-gray-800">{score}</p>
        </div>
      </div>

      <button
        onClick={gameState === "idle" || gameState === "finished" ? startGame : handleClick}
        className={`w-full max-w-md h-56 rounded-2xl border-2 shadow-md transition-all ${boardClass} ${
          isPlayable ? "active:scale-[0.99]" : ""
        }`}
      >
        {prompt ? (
          <div className="flex flex-col items-center gap-4">
            <span className={`text-5xl font-black tracking-tight ${prompt.inkClass}`}>{prompt.word}</span>
            <span className="text-sm font-semibold text-gray-500">
              {prompt.shouldMatch ? "Tap now" : "Do not tap"}
            </span>
          </div>
        ) : (
          <span className="text-xl font-semibold text-gray-500">
            {gameState === "finished" ? "Play again" : "Start"}
          </span>
        )}
      </button>

      <p className="text-lg font-medium text-gray-700 text-center">{resultMessage}</p>

      {gameState === "result" && (
        <button
          onClick={handleNext}
          className="px-8 py-2.5 bg-rose-600 text-white rounded-full font-semibold hover:bg-rose-700 active:scale-95 transition-all"
        >
          {round >= TOTAL_ROUNDS || lives <= 0 ? "Finish" : "Next Round"}
        </button>
      )}

      <p className="text-sm text-gray-500">Best streak: {bestStreak}</p>
      {gameState === "result" && <p className="text-sm text-gray-500">{roundCorrect ? "Correct." : "Missed."}</p>}
    </div>
  );
}
