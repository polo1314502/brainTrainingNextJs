"use client";

import React, { useState } from "react";

const COLORS = [
  { name: "red", bg: "bg-red-500", activeBg: "bg-red-400" },
  { name: "green", bg: "bg-green-500", activeBg: "bg-green-400" },
  { name: "blue", bg: "bg-blue-500", activeBg: "bg-blue-400" },
  { name: "yellow", bg: "bg-yellow-400", activeBg: "bg-yellow-300" },
  { name: "gray", bg: "bg-gray-500", activeBg: "bg-gray-400" },
  { name: "purple", bg: "bg-purple-500", activeBg: "bg-purple-400" },
];

export default function MemorizeSequenceGame() {
  const [step, setStep] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [isShowing, setIsShowing] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [started, setStarted] = useState(false);

  const generateSequence = (length: number) =>
    Array.from({ length }, () => Math.floor(Math.random() * 4));

  const showSequence = async (seq: number[]) => {
    setIsShowing(true);
    for (let i = 0; i < seq.length; i++) {
      setActiveButton(seq[i]);
      await new Promise((r) => setTimeout(r, 600));
      setActiveButton(null);
      await new Promise((r) => setTimeout(r, 250));
    }
    setIsShowing(false);
  };

  const startNewGame = () => {
    const newSeq = generateSequence(step);
    setSequence(newSeq);
    setUserSequence([]);
    setMessage(null);
    setStarted(true);
    showSequence(newSeq);
  };

  const handlePress = (index: number) => {
    if (isShowing || !started) return;
    const newUserSeq = [...userSequence, index];
    setUserSequence(newUserSeq);

    if (newUserSeq.length === sequence.length) {
      const isCorrect = newUserSeq.every((val, idx) => val === sequence[idx]);
      setMessage({ text: isCorrect ? "🎉 Correct! Well done!" : "❌ Wrong! Try again.", success: isCorrect });
    }
  };

  return (
    <div className="flex flex-col items-center p-8 gap-6">
      <h1 className="text-3xl font-bold text-gray-800">Memorize the Sequence</h1>
      <p className="text-gray-500 text-center max-w-sm">
        Watch the color sequence, then repeat it in the same order.
      </p>

      <div className="flex items-center gap-3">
        <label className="font-medium text-gray-700">Sequence length:</label>
        <input
          type="number"
          value={step}
          onChange={(e) => setStep(Math.max(1, parseInt(e.target.value) || 1))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 w-20 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
          min={1}
          max={20}
        />
      </div>

      <button
        onClick={startNewGame}
        className="px-8 py-2.5 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
      >
        {started ? "Restart" : "Start Game"}
      </button>

      <div className="h-8 flex items-center">
        {isShowing && (
          <p className="text-indigo-600 font-medium animate-pulse">👀 Watch the sequence…</p>
        )}
        {!isShowing && started && !message && sequence.length > 0 && (
          <p className="text-gray-600 font-medium">Your turn! Repeat the sequence.</p>
        )}
        {message && (
          <p className={`text-lg font-semibold ${message.success ? "text-green-600" : "text-red-500"}`}>
            {message.text}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {COLORS.map((color, index) => (
          <button
            key={index}
            onClick={() => handlePress(index)}
            disabled={isShowing || !started || !!message}
            className={`w-24 h-24 rounded-2xl transition-all duration-150 shadow-md
              ${activeButton === index
                ? `${color.activeBg} scale-110 ring-4 ring-white ring-offset-2 shadow-lg`
                : `${color.bg} opacity-80 hover:opacity-100 hover:scale-105`}
              disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      {started && sequence.length > 0 && (
        <p className="text-sm text-gray-400">
          Progress: {userSequence.length} / {sequence.length}
        </p>
      )}
    </div>
  );
}
