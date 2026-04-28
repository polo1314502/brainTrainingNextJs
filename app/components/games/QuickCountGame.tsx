"use client";

import React, { useState, useEffect } from "react";

type GameState = "start" | "showing" | "guessing" | "result";

interface Dot {
  id: number;
  left: number;
  top: number;
}

export default function QuickCountGame() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [dots, setDots] = useState<Dot[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [resultMessage, setResultMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(2);

  const generateDots = (currentScore: number) => {
    const count = Math.floor(Math.random() * 10) + currentScore + 1;
    const newDots = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 280,
      top: Math.random() * 380,
    }));
    setDots(newDots);
    setCorrectCount(count);
  };

  const startGame = () => {
    generateDots(score);
    setGameState("showing");
    setResultMessage("");
    setTimeLeft(2);
  };

  useEffect(() => {
    if (gameState !== "showing") return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    const timer = setTimeout(() => setGameState("guessing"), 2000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [gameState]);

  const handleGuess = (guess: number) => {
    setGameState("result");
    if (guess === correctCount) {
      setScore((prev) => prev + 1);
      setResultMessage(`✅ Correct! There were ${correctCount} circles.`);
    } else {
      setResultMessage(`❌ Wrong! The answer was ${correctCount}.`);
    }
  };

  const resetGame = () => {
    setGameState("start");
    setDots([]);
    setCorrectCount(0);
    setResultMessage("");
    setScore(0);
  };

  const guessOptions = Array.from({ length: 11 }, (_, i) => score + i);

  return (
    <div className="flex flex-col items-center p-8 gap-6">
      <h1 className="text-3xl font-bold text-gray-800">Quick Count</h1>
      <p className="text-gray-500 text-center max-w-sm">
        Count the blue circles before they disappear!
      </p>

      <div className="flex items-center gap-2 text-lg">
        <span className="font-medium text-gray-700">Score:</span>
        <span className="font-bold text-indigo-600 text-2xl">{score}</span>
      </div>

      {gameState === "start" && (
        <button
          onClick={startGame}
          className="px-8 py-2.5 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Start Game
        </button>
      )}

      {gameState === "showing" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-indigo-600 font-medium animate-pulse">
            ⏱ Memorize! ({timeLeft}s)
          </p>
          <div className="relative w-80 h-96 border-2 border-gray-200 bg-white rounded-2xl shadow-inner overflow-hidden">
            {dots.map((dot) => (
              <div
                key={dot.id}
                className="absolute w-5 h-5 bg-blue-500 rounded-full shadow"
                style={{ left: dot.left, top: dot.top }}
              />
            ))}
          </div>
        </div>
      )}

      {gameState === "guessing" && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold text-gray-700">
            How many blue circles did you see?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {guessOptions.map((num) => (
              <button
                key={num}
                onClick={() => handleGuess(num)}
                className="px-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 rounded-xl font-semibold text-indigo-800 transition hover:scale-105"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === "result" && (
        <div className="flex flex-col items-center gap-4">
          <p
            className={`text-lg font-semibold ${
              resultMessage.startsWith("✅") ? "text-green-600" : "text-red-500"
            }`}
          >
            {resultMessage}
          </p>
          <div className="flex gap-3">
            <button
              onClick={startGame}
              className="px-6 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition"
            >
              Play Again
            </button>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition"
            >
              Reset Score
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
