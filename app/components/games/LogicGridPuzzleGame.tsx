"use client";

import React, { useState, useEffect } from "react";

type GameState = "playing" | "solved";
type GridMap = Record<string, string[][]>;
type Clue = {
  type: "positive" | "negative";
  cat1: string;
  idx1: number;
  cat2: string;
  idx2: number;
};

const namePool = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Henry"];
const colorPool = ["Red", "Blue", "Green", "Yellow", "Purple", "Orange", "White", "Black"];
const petPool = ["Cat", "Dog", "Fish", "Bird", "Rabbit", "Hamster", "Turtle", "Snake"];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function* permutations(arr: number[]): Generator<number[]> {
  if (arr.length <= 1) { yield arr.slice(); return; }
  for (let i = 0; i < arr.length; i++) {
    const curr = arr.slice();
    const next = curr.splice(i, 1);
    for (const p of permutations(curr)) yield next.concat(p);
  }
}

const GRID_KEYS = ["Names-Colors", "Names-Pets", "Colors-Pets"];

export default function LogicGridPuzzleGame() {
  const [gameState, setGameState] = useState<GameState>("playing");
  const [items, setItems] = useState<Record<string, string[]>>({ Names: [], Colors: [], Pets: [] });
  const [allClues, setAllClues] = useState<Clue[]>([]);
  const [visibleClueCount, setVisibleClueCount] = useState(4);
  const [expected, setExpected] = useState<GridMap>({});
  const [grids, setGrids] = useState<GridMap>({});
  const [resultMessage, setResultMessage] = useState<{ text: string; success: boolean } | null>(null);

  const generatePuzzle = () => {
    const names = shuffle(namePool).slice(0, 3);
    const colors = shuffle(colorPool).slice(0, 3);
    const pets = shuffle(petPool).slice(0, 3);
    setItems({ Names: names, Colors: colors, Pets: pets });

    const colorPerm = shuffle([0, 1, 2]);
    const petPerm = shuffle([0, 1, 2]);

    const newExpected: GridMap = {};
    GRID_KEYS.forEach((key) => {
      newExpected[key] = Array(3).fill("").map(() => Array(3).fill("X"));
    });
    for (let i = 0; i < 3; i++) {
      newExpected["Names-Colors"][i][colorPerm[i]] = "O";
      newExpected["Names-Pets"][i][petPerm[i]] = "O";
    }
    for (let j = 0; j < 3; j++) {
      const i = colorPerm.indexOf(j);
      newExpected["Colors-Pets"][j][petPerm[i]] = "O";
    }
    setExpected(newExpected);

    const newGrids: GridMap = {};
    GRID_KEYS.forEach((key) => {
      newGrids[key] = Array(3).fill("").map(() => Array(3).fill(""));
    });
    setGrids(newGrids);

    const clues: Clue[] = [];
    for (let i = 0; i < 3; i++) {
      clues.push({ type: "positive", cat1: "Names", idx1: i, cat2: "Colors", idx2: colorPerm[i] });
      clues.push({ type: "positive", cat1: "Names", idx1: i, cat2: "Pets", idx2: petPerm[i] });
      clues.push({ type: "positive", cat1: "Colors", idx1: i, cat2: "Pets", idx2: petPerm[colorPerm.indexOf(i)] });
      clues.push({ type: "negative", cat1: "Names", idx1: i, cat2: "Colors", idx2: (colorPerm[i] + 1) % 3 });
      clues.push({ type: "negative", cat1: "Names", idx1: i, cat2: "Pets", idx2: (petPerm[i] + 1) % 3 });
      clues.push({ type: "negative", cat1: "Colors", idx1: i, cat2: "Pets", idx2: (petPerm[colorPerm.indexOf(i)] + 1) % 3 });
    }
    setAllClues(shuffle(clues));
    setVisibleClueCount(4);
    setGameState("playing");
    setResultMessage(null);
  };

  useEffect(() => { generatePuzzle(); }, []);

  const isInsufficient = () => {
    const visible = allClues.slice(0, visibleClueCount);
    let count = 0;
    for (const cPerm of permutations([0, 1, 2])) {
      for (const pPerm of permutations([0, 1, 2])) {
        let ok = true;
        for (const clue of visible) {
          let val: number;
          if (clue.cat1 === "Names" && clue.cat2 === "Colors") {
            val = cPerm[clue.idx1];
          } else if (clue.cat1 === "Names" && clue.cat2 === "Pets") {
            val = pPerm[clue.idx1];
          } else {
            const nameIdx = cPerm.indexOf(clue.idx1);
            val = pPerm[nameIdx];
          }
          if ((clue.type === "positive" && val !== clue.idx2) || (clue.type === "negative" && val === clue.idx2)) {
            ok = false; break;
          }
        }
        if (ok) count++;
      }
    }
    return count > 1;
  };

  const toggleCell = (gridKey: string, row: number, col: number) => {
    if (gameState !== "playing") return;
    setGrids((prev) => {
      const newGrid = prev[gridKey].map((r) => [...r]);
      const cur = newGrid[row][col];
      newGrid[row][col] = cur === "" ? "O" : cur === "O" ? "X" : "";
      return { ...prev, [gridKey]: newGrid };
    });
  };

  const checkSolution = () => {
    let solved = true;
    for (const key of GRID_KEYS) {
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++)
          if (grids[key]?.[r]?.[c] !== expected[key]?.[r]?.[c]) solved = false;
    }
    if (solved) {
      setGameState("solved");
      setResultMessage({ text: "🎉 Congratulations! You solved the puzzle!", success: true });
    } else {
      setResultMessage({ text: "❌ Not quite right. Check the clues and try again.", success: false });
    }
  };

  const clueText = (clue: Clue) => {
    if (clue.cat1 === "Names" && clue.cat2 === "Colors") {
      return `${items.Names[clue.idx1]} ${clue.type === "positive" ? "lives in the" : "does not live in the"} ${items.Colors[clue.idx2]} house.`;
    } else if (clue.cat1 === "Names" && clue.cat2 === "Pets") {
      return `${items.Names[clue.idx1]} ${clue.type === "positive" ? "owns the" : "does not own the"} ${items.Pets[clue.idx2]}.`;
    } else {
      return `The ${items.Colors[clue.idx1]} house ${clue.type === "positive" ? "has the" : "does not have the"} ${items.Pets[clue.idx2]}.`;
    }
  };

  const renderGrid = (gridKey: string) => {
    const [catA, catB] = gridKey.split("-");
    const rowItems = items[catA] || [];
    const colItems = items[catB] || [];
    if (!grids[gridKey]) return null;

    return (
      <div key={gridKey} className="mb-6">
        <h3 className="font-bold text-gray-700 mb-2">{catA} vs {catB}</h3>
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-20" />
                {colItems.map((item, idx) => (
                  <th key={idx} className="w-16 text-center text-xs font-semibold text-gray-600 pb-1 px-1">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowItems.map((rowItem, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="text-xs font-medium text-gray-600 pr-2 text-right whitespace-nowrap">{rowItem}</td>
                  {colItems.map((_, colIdx) => {
                    const cell = grids[gridKey][rowIdx]?.[colIdx] ?? "";
                    return (
                      <td key={colIdx} className="p-0.5">
                        <button
                          onClick={() => toggleCell(gridKey, rowIdx, colIdx)}
                          disabled={gameState === "solved"}
                          className={`w-14 h-10 border-2 rounded-lg text-lg font-bold transition-all
                            ${cell === "O"
                              ? "bg-green-200 border-green-400 text-green-700"
                              : cell === "X"
                              ? "bg-red-100 border-red-300 text-red-500"
                              : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                            } disabled:cursor-not-allowed`}
                        >
                          {cell}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Logic Grid Puzzle</h1>
      <p className="text-gray-500 text-center mb-6 text-sm">
        Use the clues to determine which person has which color house and pet. Click a cell to toggle ⭕ (match) or ❌ (no match).
      </p>

      {/* Clues */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <h2 className="font-bold text-gray-700 mb-3">📋 Clues</h2>
        <ol className="space-y-1.5">
          {allClues.slice(0, visibleClueCount).map((clue, idx) => (
            <li key={idx} className={`text-sm ${clue.type === "positive" ? "text-gray-800" : "text-gray-500"}`}>
              <span className="font-semibold mr-1">{idx + 1}.</span>
              {clue.type === "negative" && <span className="line-through-hint text-gray-400">[NOT] </span>}
              {clueText(clue)}
            </li>
          ))}
        </ol>
        {visibleClueCount < allClues.length && isInsufficient() && (
          <button
            onClick={() => setVisibleClueCount((n) => n + 1)}
            className="mt-3 px-4 py-1.5 bg-amber-200 hover:bg-amber-300 rounded-full text-sm font-medium text-amber-800 transition"
          >
            + Show More Clues
          </button>
        )}
      </div>

      {/* Grids */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        {GRID_KEYS.map(renderGrid)}
      </div>

      {/* Result message */}
      {resultMessage && (
        <div className={`mb-4 p-3 rounded-xl text-center font-semibold ${resultMessage.success ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
          {resultMessage.text}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={checkSolution}
          disabled={gameState === "solved"}
          className="px-6 py-2 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          Check Solution
        </button>
        <button
          onClick={generatePuzzle}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition"
        >
          New Puzzle
        </button>
      </div>
    </div>
  );
}
