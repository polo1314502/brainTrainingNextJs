"use client";

import { useEffect, useRef, useState } from "react";

type GameState = "idle" | "waiting" | "fakeout" | "ready" | "round_result" | "finished";

const TOTAL_ROUNDS = 8;
const STARTING_LIVES = 3;

export default function ReflectionGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentRound, setCurrentRound] = useState(1);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [message, setMessage] = useState(
    "8 rounds, 3 lives. Wait for green. Yellow is a fake-out trap."
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRoundTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const finishAttempt = (nextLives: number, resultMessage: string) => {
    const isLastRound = currentRound >= TOTAL_ROUNDS;

    if (nextLives <= 0) {
      setGameState("finished");
      setMessage(`${resultMessage} Out of lives.`);
      return;
    }

    if (isLastRound) {
      setGameState("finished");
      setMessage(`${resultMessage} Challenge complete.`);
      return;
    }

    setGameState("round_result");
    setCurrentRound((prev) => prev + 1);
    setMessage(`${resultMessage} Press next round.`);
  };

  const startRound = () => {
    clearRoundTimer();
    setGameState("waiting");
    setReactionTime(null);
    setStartedAt(null);
    setMessage("Wait for green...");

    const readySignal = () => {
      setGameState("ready");
      setStartedAt(Date.now());
      setMessage("NOW! Click!");
      timerRef.current = null;
    };

    const baseDelay = 900 + Math.floor(Math.random() * 1700);
    const shouldFakeOut = Math.random() < 0.35;

    timerRef.current = setTimeout(() => {
      if (!shouldFakeOut) {
        readySignal();
        return;
      }

      setGameState("fakeout");
      setMessage("Fake-out! Don't click yellow.");
      const fakeoutDuration = 220 + Math.floor(Math.random() * 180);

      timerRef.current = setTimeout(() => {
        setGameState("waiting");
        setMessage("Wait for green...");
        const secondDelay = 450 + Math.floor(Math.random() * 1000);

        timerRef.current = setTimeout(readySignal, secondDelay);
      }, fakeoutDuration);
    }, baseDelay);
  };

  const startChallenge = () => {
    clearRoundTimer();
    setCurrentRound(1);
    setLives(STARTING_LIVES);
    setScore(0);
    setStreak(0);
    setHistory([]);
    setBestTime(null);
    startRound();
  };

  const handleBoardClick = () => {
    if (gameState === "idle" || gameState === "round_result" || gameState === "finished") {
      return;
    }

    if (gameState === "waiting" || gameState === "fakeout") {
      clearRoundTimer();
      const nextLives = Math.max(0, lives - 1);
      setLives(nextLives);
      setStreak(0);
      setStartedAt(null);
      finishAttempt(nextLives, "Too early! -1 life, streak reset.");
      return;
    }

    if (gameState !== "ready" || startedAt === null) {
      return;
    }

    const elapsed = Date.now() - startedAt;
    setReactionTime(elapsed);
    setHistory((prev) => [...prev, elapsed]);
    setBestTime((prev) => (prev === null ? elapsed : Math.min(prev, elapsed)));
    setStreak((prev) => prev + 1);

    const speedPoints = Math.max(80, 650 - elapsed);
    const streakBonus = streak * 30;
    const roundScore = speedPoints + streakBonus;
    const nextScore = score + roundScore;
    setScore(nextScore);

    finishAttempt(
      lives,
      `Round clear: ${elapsed} ms (+${roundScore} pts${streakBonus > 0 ? `, ${streakBonus} streak bonus` : ""}).`
    );
  };

  useEffect(() => clearRoundTimer, []);

  const boardStyle =
    gameState === "ready"
      ? "bg-green-500 hover:bg-green-500"
      : gameState === "fakeout"
      ? "bg-yellow-500 hover:bg-yellow-500"
      : gameState === "waiting"
      ? "bg-red-500 hover:bg-red-500"
      : "bg-gray-200 hover:bg-gray-300";

  const averageTime =
    history.length === 0 ? null : Math.round(history.reduce((sum, value) => sum + value, 0) / history.length);

  return (
    <div className="flex flex-col items-center p-8 gap-6">
      <h1 className="text-3xl font-bold text-gray-800">Reflection Training</h1>
      <p className="text-gray-500 text-center max-w-sm">
        Multi-round reflex challenge with fake-outs, streaks, and score.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
        <div className="rounded-xl bg-white border border-emerald-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Round</p>
          <p className="text-xl font-bold text-emerald-700">
            {Math.min(currentRound, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-emerald-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Lives</p>
          <p className="text-xl font-bold text-rose-600">{lives}</p>
        </div>
        <div className="rounded-xl bg-white border border-emerald-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Streak</p>
          <p className="text-xl font-bold text-indigo-600">{streak}</p>
        </div>
        <div className="rounded-xl bg-white border border-emerald-100 px-3 py-2 text-center">
          <p className="text-xs text-gray-500">Score</p>
          <p className="text-xl font-bold text-gray-800">{score}</p>
        </div>
      </div>

      {(gameState === "idle" || gameState === "finished") && (
        <button
          onClick={startChallenge}
          className="px-8 py-2.5 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
        >
          {gameState === "idle" ? "Start Challenge" : "Play Again"}
        </button>
      )}

      {gameState === "round_result" && (
        <button
          onClick={startRound}
          className="px-8 py-2.5 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
        >
          Next Round
        </button>
      )}

      <button
        onClick={handleBoardClick}
        className={`w-full max-w-md h-56 rounded-2xl text-white text-xl font-bold shadow-md transition-all ${boardStyle}`}
      >
        {gameState === "ready"
          ? "CLICK!"
          : gameState === "fakeout"
          ? "TRAP!"
          : gameState === "waiting"
          ? "WAIT..."
          : "READY"}
      </button>

      <p className="text-lg font-medium text-gray-700">{message}</p>

      {reactionTime !== null && (
        <p className="text-2xl font-bold text-emerald-700">Reaction: {reactionTime} ms</p>
      )}
      {(bestTime !== null || averageTime !== null) && (
        <p className="text-sm text-gray-500">
          {bestTime !== null ? `Best: ${bestTime} ms` : ""} {bestTime !== null && averageTime !== null ? "•" : ""}{" "}
          {averageTime !== null ? `Average: ${averageTime} ms` : ""}
        </p>
      )}
    </div>
  );
}
