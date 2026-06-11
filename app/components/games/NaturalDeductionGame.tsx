"use client";

import { useState, useEffect } from "react";

// ─── Formula Types ────────────────────────────────────────────────────────────
type Formula =
  | { type: "atom"; name: string }
  | { type: "not"; child: Formula }
  | { type: "and"; left: Formula; right: Formula }
  | { type: "or"; left: Formula; right: Formula }
  | { type: "implies"; left: Formula; right: Formula };

// Helper constructors
const atom = (name: string): Formula => ({ type: "atom", name });
const not = (child: Formula): Formula => ({ type: "not", child });
const and = (left: Formula, right: Formula): Formula => ({ type: "and", left, right });
const or = (left: Formula, right: Formula): Formula => ({ type: "or", left, right });
const imp = (left: Formula, right: Formula): Formula => ({ type: "implies", left, right });

// Display: wraps compound (non-atom, non-not-atom) sub-formulas in parens
function p(f: Formula): string {
  if (f.type === "atom") return f.name;
  if (f.type === "not" && f.child.type === "atom") return `¬${f.child.name}`;
  if (f.type === "not" && f.child.type === "not") return `¬${p(f.child)}`;
  if (f.type === "not") return `¬(${fmtF(f.child)})`;
  return `(${fmtF(f)})`;
}

function fmtF(f: Formula): string {
  switch (f.type) {
    case "atom": return f.name;
    case "not":
      if (f.child.type === "atom") return `¬${f.child.name}`;
      if (f.child.type === "not") return `¬${fmtF(f.child)}`;
      return `¬(${fmtF(f.child)})`;
    case "and": return `${p(f.left)} ∧ ${p(f.right)}`;
    case "or": return `${p(f.left)} ∨ ${p(f.right)}`;
    case "implies": return `${p(f.left)} → ${p(f.right)}`;
  }
}

function eq(a: Formula, b: Formula): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "atom": return a.name === (b as { type: "atom"; name: string }).name;
    case "not": return eq(a.child, (b as { type: "not"; child: Formula }).child);
    case "and":
    case "or":
    case "implies": {
      const B = b as { left: Formula; right: Formula };
      return eq(a.left, B.left) && eq(a.right, B.right);
    }
  }
}

// ─── Rules ────────────────────────────────────────────────────────────────────
type RuleId = "MP" | "MT" | "AndI" | "AndE" | "DS" | "HS" | "DNE" | "DM" | "MI" | "CP" | "Exp" | "DNI" | "CD" | "Comm" | "Dist";

const RULES: { id: RuleId; name: string; sym: string; lines: number; schema: string; desc: string }[] = [
  {
    id: "MP", name: "Modus Ponens", sym: "MP", lines: 2,
    schema: "P → Q,  P  ⊢  Q",
    desc: "From an implication and its antecedent, derive the consequent.",
  },
  {
    id: "MT", name: "Modus Tollens", sym: "MT", lines: 2,
    schema: "P → Q,  ¬Q  ⊢  ¬P",
    desc: "From an implication and the negation of the consequent, derive the negation of the antecedent.",
  },
  {
    id: "AndI", name: "Conjunction Intro", sym: "∧I", lines: 2,
    schema: "P,  Q  ⊢  P ∧ Q",
    desc: "Combine two formulas into a conjunction.",
  },
  {
    id: "AndE", name: "Conjunction Elim", sym: "∧E", lines: 1,
    schema: "P ∧ Q  ⊢  P  or  Q",
    desc: "Extract the left or right side of a conjunction.",
  },
  {
    id: "DS", name: "Disjunctive Syllogism", sym: "DS", lines: 2,
    schema: "P ∨ Q,  ¬P  ⊢  Q",
    desc: "From a disjunction and the negation of one disjunct, derive the other.",
  },
  {
    id: "HS", name: "Hypothetical Syllogism", sym: "HS", lines: 2,
    schema: "P → Q,  Q → R  ⊢  P → R",
    desc: "Chain two implications into one.",
  },
  {
    id: "DNE", name: "Double Negation Elim", sym: "¬¬E", lines: 1,
    schema: "¬¬P  ⊢  P",
    desc: "Remove a double negation.",
  },
  {
    id: "DM", name: "De Morgan's Law", sym: "DM", lines: 1,
    schema: "¬(P ∧ Q)  ⊢  ¬P ∨ ¬Q   |   ¬(P ∨ Q)  ⊢  ¬P ∧ ¬Q   (and reverses)",
    desc: "Convert a negated conjunction/disjunction to a disjunction/conjunction of negations, or reverse.",
  },
  {
    id: "MI", name: "Material Implication", sym: "MI", lines: 1,
    schema: "P → Q  ⊢  ¬P ∨ Q   (and reverse)",
    desc: "Convert an implication to a disjunction of the negated antecedent and consequent, or reverse.",
  },
  {
    id: "CP", name: "Contrapositive", sym: "CP", lines: 1,
    schema: "P → Q  ⊢  ¬Q → ¬P   (and reverse for ¬P → ¬Q)",
    desc: "Flip and negate both sides of an implication. When both sides are already negations, strips them.",
  },
  {
    id: "Exp", name: "Exportation", sym: "Exp", lines: 1,
    schema: "(P ∧ Q) → R  ⊢  P → (Q → R)   (and reverse)",
    desc: "Turn a conjunction in the antecedent into a nested implication, or reverse.",
  },
  {
    id: "DNI", name: "Double Negation Intro", sym: "¬¬I", lines: 1,
    schema: "P  ⊢  ¬¬P",
    desc: "Wrap any formula in a double negation.",
  },
  {
    id: "CD", name: "Constructive Dilemma", sym: "CD", lines: 3,
    schema: "P → Q,  R → S,  P ∨ R  ⊢  Q ∨ S",
    desc: "From two implications and a disjunction of their antecedents, derive the disjunction of consequents. Select all 3 lines.",
  },
  {
    id: "Comm", name: "Commutation", sym: "Com", lines: 1,
    schema: "P ∨ Q  ⊢  Q ∨ P   |   P ∧ Q  ⊢  Q ∧ P",
    desc: "Swap the two sides of a conjunction or disjunction.",
  },
  {
    id: "Dist", name: "Distribution", sym: "Dist", lines: 1,
    schema: "P ∧ (Q ∨ R)  ⊢  (P ∧ Q) ∨ (P ∧ R)   (and all variants)",
    desc: "Distribute a connective over the other, or collect a distributed formula back.",
  },
];

// ─── Apply a rule to selected proof lines ────────────────────────────────────
type Candidate = { formula: Formula; justification: string };

function applyRule(rule: RuleId, sel: ProofLine[]): Candidate[] {
  if (sel.length < 1) return [];
  const [l1, l2] = sel;
  const [f1] = sel.map((l) => l.formula);
  const f2 = l2?.formula;

  switch (rule) {
    case "MP": {
      if (!l2) return [];
      if (f1.type === "implies" && eq(f1.left, f2))
        return [{ formula: f1.right, justification: `MP (${l1.id}, ${l2.id})` }];
      if (f2.type === "implies" && eq(f2.left, f1))
        return [{ formula: f2.right, justification: `MP (${l2.id}, ${l1.id})` }];
      return [];
    }
    case "MT": {
      if (!l2) return [];
      if (f1.type === "implies" && f2.type === "not" && eq(f1.right, f2.child))
        return [{ formula: not(f1.left), justification: `MT (${l1.id}, ${l2.id})` }];
      if (f2.type === "implies" && f1.type === "not" && eq(f2.right, f1.child))
        return [{ formula: not(f2.left), justification: `MT (${l2.id}, ${l1.id})` }];
      return [];
    }
    case "AndI": {
      if (!l2) return [];
      return [{ formula: and(f1, f2), justification: `∧I (${l1.id}, ${l2.id})` }];
    }
    case "AndE": {
      if (f1.type !== "and") return [];
      return [
        { formula: f1.left, justification: `∧E (${l1.id})` },
        { formula: f1.right, justification: `∧E (${l1.id})` },
      ];
    }
    case "DS": {
      if (!l2) return [];
      if (f1.type === "or" && f2.type === "not") {
        if (eq(f1.left, f2.child)) return [{ formula: f1.right, justification: `DS (${l1.id}, ${l2.id})` }];
        if (eq(f1.right, f2.child)) return [{ formula: f1.left, justification: `DS (${l1.id}, ${l2.id})` }];
      }
      if (f2.type === "or" && f1.type === "not") {
        if (eq(f2.left, f1.child)) return [{ formula: f2.right, justification: `DS (${l2.id}, ${l1.id})` }];
        if (eq(f2.right, f1.child)) return [{ formula: f2.left, justification: `DS (${l2.id}, ${l1.id})` }];
      }
      return [];
    }
    case "HS": {
      if (!l2) return [];
      if (f1.type === "implies" && f2.type === "implies" && eq(f1.right, f2.left))
        return [{ formula: imp(f1.left, f2.right), justification: `HS (${l1.id}, ${l2.id})` }];
      if (f2.type === "implies" && f1.type === "implies" && eq(f2.right, f1.left))
        return [{ formula: imp(f2.left, f1.right), justification: `HS (${l2.id}, ${l1.id})` }];
      return [];
    }
    case "DNE": {
      if (f1.type === "not" && f1.child.type === "not")
        return [{ formula: f1.child.child, justification: `¬¬E (${l1.id})` }];
      return [];
    }
    case "DM": {
      // Forward: ¬(A∧B)→¬A∨¬B  |  ¬(A∨B)→¬A∧¬B
      // Reverse: ¬A∨¬B→¬(A∧B)  |  ¬A∧¬B→¬(A∨B)
      const results: Candidate[] = [];
      if (f1.type === "not") {
        if (f1.child.type === "and")
          results.push({ formula: or(not(f1.child.left), not(f1.child.right)), justification: `DM (${l1.id})` });
        else if (f1.child.type === "or")
          results.push({ formula: and(not(f1.child.left), not(f1.child.right)), justification: `DM (${l1.id})` });
      }
      if (f1.type === "or" && f1.left.type === "not" && f1.right.type === "not")
        results.push({ formula: not(and(f1.left.child, f1.right.child)), justification: `DM (${l1.id})` });
      if (f1.type === "and" && f1.left.type === "not" && f1.right.type === "not")
        results.push({ formula: not(or(f1.left.child, f1.right.child)), justification: `DM (${l1.id})` });
      return results;
    }
    case "MI": {
      const results: Candidate[] = [];
      if (f1.type === "implies")
        results.push({ formula: or(not(f1.left), f1.right), justification: `MI (${l1.id})` });
      if (f1.type === "or" && f1.left.type === "not")
        results.push({ formula: imp(f1.left.child, f1.right), justification: `MI (${l1.id})` });
      return results;
    }
    case "CP": {
      const results: Candidate[] = [];
      if (f1.type === "implies") {
        // Forward: P→Q ⊢ ¬Q→¬P
        results.push({ formula: imp(not(f1.right), not(f1.left)), justification: `CP (${l1.id})` });
        // Shortcut reverse: ¬P→¬Q ⊢ Q→P (strip double negations)
        if (f1.left.type === "not" && f1.right.type === "not")
          results.push({ formula: imp(f1.right.child, f1.left.child), justification: `CP (${l1.id})` });
      }
      return results;
    }
    case "Exp": {
      const results: Candidate[] = [];
      if (f1.type === "implies" && f1.left.type === "and")
        results.push({ formula: imp(f1.left.left, imp(f1.left.right, f1.right)), justification: `Exp (${l1.id})` });
      if (f1.type === "implies" && f1.right.type === "implies")
        results.push({ formula: imp(and(f1.left, f1.right.left), f1.right.right), justification: `Exp (${l1.id})` });
      return results;
    }
    case "DNI": {
      return [{ formula: not(not(f1)), justification: `¬¬I (${l1.id})` }];
    }
    case "CD": {
      if (sel.length < 3) return [];
      const lines3 = sel.slice(0, 3);
      const perms: [number, number, number][] = [
        [0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0],
      ];
      for (const [ai, bi, ci] of perms) {
        const la = lines3[ai], lb = lines3[bi], lc = lines3[ci];
        const fa = la.formula, fb = lb.formula, fc = lc.formula;
        if (fa.type === "implies" && fb.type === "implies" && fc.type === "or") {
          if (eq(fc.left, fa.left) && eq(fc.right, fb.left))
            return [{ formula: or(fa.right, fb.right), justification: `CD (${la.id}, ${lb.id}, ${lc.id})` }];
          if (eq(fc.left, fb.left) && eq(fc.right, fa.left))
            return [{ formula: or(fb.right, fa.right), justification: `CD (${lb.id}, ${la.id}, ${lc.id})` }];
        }
      }
      return [];
    }
    case "Comm": {
      if (f1.type === "or")  return [{ formula: or(f1.right, f1.left),   justification: `Com (${l1.id})` }];
      if (f1.type === "and") return [{ formula: and(f1.right, f1.left),  justification: `Com (${l1.id})` }];
      return [];
    }
    case "Dist": {
      const results: Candidate[] = [];
      // ── Forward distributions ─────────────────────────────────────────────
      if (f1.type === "and" && f1.right.type === "or")
        results.push({ formula: or(and(f1.left, f1.right.left), and(f1.left, f1.right.right)), justification: `Dist (${l1.id})` });
      if (f1.type === "and" && f1.left.type === "or")
        results.push({ formula: or(and(f1.left.left, f1.right), and(f1.left.right, f1.right)), justification: `Dist (${l1.id})` });
      if (f1.type === "or" && f1.right.type === "and")
        results.push({ formula: and(or(f1.left, f1.right.left), or(f1.left, f1.right.right)), justification: `Dist (${l1.id})` });
      if (f1.type === "or" && f1.left.type === "and")
        results.push({ formula: and(or(f1.left.left, f1.right), or(f1.left.right, f1.right)), justification: `Dist (${l1.id})` });
      // ── Reverse: collect back ─────────────────────────────────────────────
      if (f1.type === "or" && f1.left.type === "and" && f1.right.type === "and") {
        if (eq(f1.left.left, f1.right.left))
          results.push({ formula: and(f1.left.left, or(f1.left.right, f1.right.right)), justification: `Dist (${l1.id})` });
        if (eq(f1.left.right, f1.right.right))
          results.push({ formula: and(or(f1.left.left, f1.right.left), f1.left.right), justification: `Dist (${l1.id})` });
      }
      if (f1.type === "and" && f1.left.type === "or" && f1.right.type === "or") {
        if (eq(f1.left.left, f1.right.left))
          results.push({ formula: or(f1.left.left, and(f1.left.right, f1.right.right)), justification: `Dist (${l1.id})` });
        if (eq(f1.left.right, f1.right.right))
          results.push({ formula: or(and(f1.left.left, f1.right.left), f1.left.right), justification: `Dist (${l1.id})` });
      }
      return results;
    }
  }
}

// ─── Puzzle Pool ──────────────────────────────────────────────────────────────
type DifficultyLevel = 1 | 2 | 3;

type PuzzleTemplate = {
  title: string;
  description: string;
  premises: Formula[];
  goal: Formula;
  hint: string;
  difficulty: DifficultyLevel;
};

// ─── Puzzle Generator ─────────────────────────────────────────────────────────
const ATOM_NAMES = ["P","Q","R","S","T","U","V","W","X","Y","Z"] as const;

function shuffleArr<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick n distinct atoms in random order. */
function pickAtoms(n: number): Formula[] {
  return shuffleArr(ATOM_NAMES).slice(0, n).map(atom);
}

/** Random integer in [lo, hi] inclusive. */
function ri(lo: number, hi: number): number {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** Pick one element at random. */
function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Forward MP chain: n steps, n+1 atoms ─────────────────────────────────────
function genMPChain(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n + 1);
  const premises: Formula[] = [
    ...atoms.slice(0, n).map((a, i) => imp(a, atoms[i + 1])),
    atoms[0],
  ];
  return {
    difficulty: d,
    title: `Forward Chain (${n})`,
    description: `Follow ${n} implication${n > 1 ? "s" : ""} from ${fmtF(atoms[0])} to ${fmtF(atoms[n])}.`,
    premises,
    goal: atoms[n],
    hint: `Apply MP ${n} time${n > 1 ? "s" : ""} in order: ${atoms.map(fmtF).join(" → ")}.`,
  };
}

// ── Backward MT chain: n steps, n+1 atoms ────────────────────────────────────
function genMTChain(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n + 1);
  const premises: Formula[] = [
    ...atoms.slice(0, n).map((a, i) => imp(a, atoms[i + 1])),
    not(atoms[n]),
  ];
  return {
    difficulty: d,
    title: `Backward Chain (${n})`,
    description: `A chain of ${n} implications ends at ${fmtF(atoms[n])}, which is false. Work back to ¬${fmtF(atoms[0])}.`,
    premises,
    goal: not(atoms[0]),
    hint: `Apply MT ${n} time${n > 1 ? "s" : ""} backwards: ¬${fmtF(atoms[n])} → … → ¬${fmtF(atoms[0])}.`,
  };
}

// ── ¬¬E then MP chain: 1 + (n-1) = n steps, n atoms ─────────────────────────
function genDNEMPChain(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n);
  const premises: Formula[] = [
    not(not(atoms[0])),
    ...atoms.slice(0, n - 1).map((a, i) => imp(a, atoms[i + 1])),
  ];
  return {
    difficulty: d,
    title: `Fog Over a Chain (${n})`,
    description: `${fmtF(atoms[0])} hides under ¬¬. Reveal it, then follow ${n - 1} more implication${n - 1 > 1 ? "s" : ""} to ${fmtF(atoms[n - 1])}.`,
    premises,
    goal: atoms[n - 1],
    hint: `¬¬E → ${fmtF(atoms[0])} (1 step), then MP ${n - 1} time${n - 1 > 1 ? "s" : ""}.`,
  };
}

// ── ¬¬E on triple-neg then MT backward: 1 + n = n+1 steps, n+1 atoms ─────────
// Uses ¬¬¬aₙ as a premise; ¬¬E extracts ¬aₙ, then n×MT collapses the chain.
function genDNEMTChain(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n + 1);
  const premises: Formula[] = [
    ...atoms.slice(0, n).map((a, i) => imp(a, atoms[i + 1])),
    not(not(not(atoms[n]))), // ¬¬¬aₙ
  ];
  return {
    difficulty: d,
    title: `Triple-Neg Backward (${n + 1})`,
    description: `${fmtF(atoms[n])} is hidden under a triple negation. Unwrap it to ¬${fmtF(atoms[n])}, then collapse ${n} implication${n > 1 ? "s" : ""} back to ¬${fmtF(atoms[0])}.`,
    premises,
    goal: not(atoms[0]),
    hint: `¬¬E on ¬¬¬${fmtF(atoms[n])} → ¬${fmtF(atoms[n])} (1 step), then MT ${n} time${n > 1 ? "s" : ""} backwards.`,
  };
}

// ── DS then MP chain: 1 + (n-1) = n steps, n+1 atoms ────────────────────────
function genDSMPChain(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n + 1);
  const premises: Formula[] = [
    or(atoms[0], atoms[1]),
    not(atoms[0]),
    ...atoms.slice(1, n).map((a, i) => imp(a, atoms[i + 2])),
  ];
  return {
    difficulty: d,
    title: `Eliminate Then Chain (${n})`,
    description: `${fmtF(atoms[0])} ∨ ${fmtF(atoms[1])}, but ${fmtF(atoms[0])} is false. From ${fmtF(atoms[1])}, follow ${n - 1} more implication${n - 1 > 1 ? "s" : ""} to ${fmtF(atoms[n])}.`,
    premises,
    goal: atoms[n],
    hint: `DS → ${fmtF(atoms[1])} (1 step), then MP ${n - 1} time${n - 1 > 1 ? "s" : ""}.`,
  };
}

// ── Dual parallel chains: ∧E×2 + MP×k1 + MP×k2 + ∧I = k1+k2+3 steps ─────────
function genTwinChains(n: number, d: DifficultyLevel): PuzzleTemplate {
  const k1 = Math.max(1, Math.floor((n - 3) / 2));
  const k2 = Math.max(1, n - 3 - k1);
  const atoms = pickAtoms(k1 + k2 + 2);
  const [a, b] = atoms;
  const chainA = atoms.slice(2, 2 + k1);
  const chainB = atoms.slice(2 + k1);
  const premises: Formula[] = [and(a, b)];
  let prev: Formula = a;
  for (const c of chainA) { premises.push(imp(prev, c)); prev = c; }
  prev = b;
  for (const c of chainB) { premises.push(imp(prev, c)); prev = c; }
  const endA = chainA[chainA.length - 1];
  const endB = chainB[chainB.length - 1];
  return {
    difficulty: d,
    title: `Twin Chains (${k1 + k2 + 3})`,
    description: `Extract ${fmtF(a)} and ${fmtF(b)} from their conjunction. Each leads through its own chain. Combine the far ends.`,
    premises,
    goal: and(endA, endB),
    hint: `∧E×2 (2) → MP×${k1} on ${fmtF(a)}-chain → MP×${k2} on ${fmtF(b)}-chain → ∧I = ${k1 + k2 + 3} steps.`,
  };
}

// ── ¬¬E×2 + dual chains + ∧I = k1+k2+3 steps ────────────────────────────────
function genDNE2TwinChains(n: number, d: DifficultyLevel): PuzzleTemplate {
  const k1 = Math.max(1, Math.floor((n - 3) / 2));
  const k2 = Math.max(1, n - 3 - k1);
  const atoms = pickAtoms(k1 + k2 + 2);
  const [a, b] = atoms;
  const chainA = atoms.slice(2, 2 + k1);
  const chainB = atoms.slice(2 + k1);
  const premises: Formula[] = [not(not(a)), not(not(b))];
  let prev: Formula = a;
  for (const c of chainA) { premises.push(imp(prev, c)); prev = c; }
  prev = b;
  for (const c of chainB) { premises.push(imp(prev, c)); prev = c; }
  const endA = chainA[chainA.length - 1];
  const endB = chainB[chainB.length - 1];
  return {
    difficulty: d,
    title: `Double Fog, Twin Chains (${k1 + k2 + 3})`,
    description: `${fmtF(a)} and ${fmtF(b)} both hide under ¬¬. Reveal them, run parallel chains, then combine the endpoints.`,
    premises,
    goal: and(endA, endB),
    hint: `¬¬E×2 (2) → MP×${k1} on ${fmtF(a)}-chain → MP×${k2} on ${fmtF(b)}-chain → ∧I = ${k1 + k2 + 3} steps.`,
  };
}

// ── DNE(¬¬(a∧b)) + ∧E×2 + dual chains + ∧I = k1+k2+4 steps ─────────────────
function genDNEAndETwinChains(n: number, d: DifficultyLevel): PuzzleTemplate {
  const k1 = Math.max(1, Math.floor((n - 4) / 2));
  const k2 = Math.max(1, n - 4 - k1);
  const atoms = pickAtoms(k1 + k2 + 2);
  const [a, b] = atoms;
  const chainA = atoms.slice(2, 2 + k1);
  const chainB = atoms.slice(2 + k1);
  const premises: Formula[] = [not(not(and(a, b)))];
  let prev: Formula = a;
  for (const c of chainA) { premises.push(imp(prev, c)); prev = c; }
  prev = b;
  for (const c of chainB) { premises.push(imp(prev, c)); prev = c; }
  const endA = chainA[chainA.length - 1];
  const endB = chainB[chainB.length - 1];
  return {
    difficulty: d,
    title: `Unbox and Branch (${k1 + k2 + 4})`,
    description: `The conjunction ${fmtF(and(a, b))} hides under ¬¬. Reveal it, extract both parts, run two chains, then unite the far ends.`,
    premises,
    goal: and(endA, endB),
    hint: `DNE→${fmtF(and(a, b))} (1) → ∧E×2 (2) → MP×${k1} + MP×${k2} → ∧I = ${k1 + k2 + 4} steps.`,
  };
}

// ── DS + MP×(n-2) + ∧I = n steps, n atoms ────────────────────────────────────
// After DS we keep d1; follow the chain to chainEnd; then ∧I pairs d1 with chainEnd.
function genDSMPAndI(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n);
  const [d0, ...chain] = atoms;
  const d1 = chain[0];
  const premises: Formula[] = [
    or(d0, d1),
    not(d0),
    ...chain.slice(0, -1).map((a, i) => imp(a, chain[i + 1])),
  ];
  const chainEnd = chain[chain.length - 1];
  return {
    difficulty: d,
    title: `Eliminate and Merge (${n})`,
    description: `Eliminate ${fmtF(d0)} from a disjunction to get ${fmtF(d1)}, follow ${n - 2} more implication${n - 2 > 1 ? "s" : ""} to ${fmtF(chainEnd)}, then pair ${fmtF(d1)} with ${fmtF(chainEnd)}.`,
    premises,
    goal: and(d1, chainEnd),
    hint: `DS→${fmtF(d1)} (1) → MP×${n - 2} → ∧I(${fmtF(d1)}, ${fmtF(chainEnd)}) = ${n} steps.`,
  };
}

// ── Single-rule easy generators ────────────────────────────────────────────────
function genSingleMP(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return { difficulty: 1, title: "Single MP",
    description: `${fmtF(imp(a, b))} holds and ${fmtF(a)} is true. What can you conclude?`,
    premises: [imp(a, b), a], goal: b,
    hint: `Select Modus Ponens, then click ${fmtF(imp(a, b))} and ${fmtF(a)}.` };
}
function genSingleMT(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return { difficulty: 1, title: "Single MT",
    description: `${fmtF(imp(a, b))} holds, but ${fmtF(b)} is false. Rule out ${fmtF(a)}.`,
    premises: [imp(a, b), not(b)], goal: not(a),
    hint: `Select Modus Tollens: click ${fmtF(imp(a, b))} and ¬${fmtF(b)}.` };
}
function genAndEL(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return { difficulty: 1, title: "Conjunction Elim (Left)",
    description: `You know ${fmtF(and(a, b))} is true. Extract just ${fmtF(a)}.`,
    premises: [and(a, b)], goal: a, hint: `Use ∧E on line 1 and pick ${fmtF(a)}.` };
}
function genAndER(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return { difficulty: 1, title: "Conjunction Elim (Right)",
    description: `You know ${fmtF(and(a, b))} is true. Extract just ${fmtF(b)}.`,
    premises: [and(a, b)], goal: b, hint: `Use ∧E on line 1 and pick ${fmtF(b)}.` };
}
function genDS(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  if (Math.random() < 0.5)
    return { difficulty: 1, title: "Disjunctive Syllogism",
      description: `Either ${fmtF(a)} or ${fmtF(b)}, and ${fmtF(a)} is false. Conclude ${fmtF(b)}.`,
      premises: [or(a, b), not(a)], goal: b, hint: `Use DS on lines 1 & 2.` };
  return { difficulty: 1, title: "Disjunctive Syllogism",
    description: `Either ${fmtF(a)} or ${fmtF(b)}, and ${fmtF(b)} is false. Conclude ${fmtF(a)}.`,
    premises: [or(a, b), not(b)], goal: a, hint: `Use DS on lines 1 & 2.` };
}
function genDNE(): PuzzleTemplate {
  const [a] = pickAtoms(1);
  return { difficulty: 1, title: "Double Negation Elim",
    description: `${fmtF(not(not(a)))} is given. Reveal ${fmtF(a)}.`,
    premises: [not(not(a))], goal: a, hint: `Use ¬¬E on line 1.` };
}
function genAndI(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return { difficulty: 1, title: "Conjunction Intro",
    description: `You have ${fmtF(a)} and ${fmtF(b)} separately. Combine them.`,
    premises: [a, b], goal: and(a, b), hint: `Use ∧I on lines 1 and 2.` };
}
function genHS(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return { difficulty: 1, title: "Hypothetical Syllogism",
    description: `${fmtF(imp(a, b))} and ${fmtF(imp(b, c))} hold. Derive the direct shortcut ${fmtF(imp(a, c))}.`,
    premises: [imp(a, b), imp(b, c)], goal: imp(a, c), hint: `Use HS on lines 1 and 2.` };
}
function genAndEMP(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  const src = Math.random() < 0.5 ? a : b;
  return { difficulty: 1, title: "Extract Then Apply",
    description: `From ${fmtF(and(a, b))} and ${fmtF(imp(src, c))}, derive ${fmtF(c)}.`,
    premises: [and(a, b), imp(src, c)], goal: c,
    hint: `∧E to get ${fmtF(src)}, then MP with line 2.` };
}
function genDSMP(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return { difficulty: 1, title: "Eliminate Then Apply",
    description: `Either ${fmtF(a)} or ${fmtF(b)}. ${fmtF(a)} is false. ${fmtF(imp(b, c))} holds. Reach ${fmtF(c)}.`,
    premises: [or(a, b), not(a), imp(b, c)], goal: c,
    hint: `DS → ${fmtF(b)}, then MP with line 3.` };
}
function genCrossExtract(): PuzzleTemplate {
  const [a, b, c, d] = pickAtoms(4);
  return { difficulty: 1, title: "Cross Extract",
    description: `From ${fmtF(and(a, b))} and ${fmtF(and(c, d))}, combine the left side of each.`,
    premises: [and(a, b), and(c, d)], goal: and(a, c),
    hint: `∧E on line 1 → ${fmtF(a)}, ∧E on line 2 → ${fmtF(c)}, ∧I → ${fmtF(and(a, c))}.` };
}

// ── MIXED-RULE GENERATORS ─────────────────────────────────────────────────────

// Two roads, one destination: 2×MP + ∧I = 3 steps (easy combo)
function genMPAndI(): PuzzleTemplate {
  const [a, b, c, d] = pickAtoms(4);
  return { difficulty: 1, title: "Two Roads, One Destination",
    description: `${fmtF(a)} leads to ${fmtF(b)}, and ${fmtF(c)} leads to ${fmtF(d)}. You have both. Combine the results.`,
    premises: [a, imp(a, b), c, imp(c, d)], goal: and(b, d),
    hint: `MP twice to get ${fmtF(b)} and ${fmtF(d)}, then ∧I.` };
}

// DNE + DS = 2 steps (easy combo)
function genDNEDS(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return { difficulty: 1, title: "Unmasked Disjunction",
    description: `Either ${fmtF(a)} or ${fmtF(b)}, but ${fmtF(a)} hides under ¬¬¬. Unmask the negation, then eliminate.`,
    premises: [or(a, b), not(not(not(a)))], goal: b,
    hint: `¬¬E on ¬¬¬${fmtF(a)} → ¬${fmtF(a)}, then DS → ${fmtF(b)}.` };
}

// HS + MT = 2 steps at minimum; generalises: (n-1)×HS + MT = n steps (n+1 atoms)
function genHSMTCombo(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n + 1);
  const premises: Formula[] = [
    ...atoms.slice(0, n).map((a, i) => imp(a, atoms[i + 1])),
    not(atoms[n]),
  ];
  return {
    difficulty: d, title: `Shortcut to Contradiction (${n})`,
    description: `${n} implications chain ${fmtF(atoms[0])} to ${fmtF(atoms[n])}, which is false. Collapse the chain with HS shortcuts, then use MT to disprove ${fmtF(atoms[0])}.`,
    premises, goal: not(atoms[0]),
    hint: `HS×${n - 1} → ${fmtF(atoms[0])}→${fmtF(atoms[n])}, then MT(${fmtF(atoms[0])}→${fmtF(atoms[n])}, ¬${fmtF(atoms[n])}) = ${n} steps.`,
  };
}

// Forward MP chain + backward MT chain, joined with ∧I
// mpK×MP + mtK×MT + ∧I = mpK+mtK+1 steps; mpK+mtK+2 atoms
function genMPMTAndI(mpK: number, mtK: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(mpK + mtK + 2);
  const mpA = atoms.slice(0, mpK + 1);
  const mtA = atoms.slice(mpK + 1); // length mtK+1
  const premises: Formula[] = [
    mpA[0],
    ...mpA.slice(0, mpK).map((a, i) => imp(a, mpA[i + 1])),
    ...mtA.slice(0, mtK).map((a, i) => imp(a, mtA[i + 1])),
    not(mtA[mtK]),
  ];
  return {
    difficulty: d, title: `Forward–Backward (${mpK + mtK + 1})`,
    description: `Follow ${mpK} implication${mpK > 1 ? "s" : ""} forward to ${fmtF(mpA[mpK])}. Separately, ${fmtF(mtA[mtK])} is false — work ${mtK} step${mtK > 1 ? "s" : ""} back to disprove ${fmtF(mtA[0])}. Combine both conclusions.`,
    premises, goal: and(mpA[mpK], not(mtA[0])),
    hint: `MP×${mpK}→${fmtF(mpA[mpK])} (${mpK}), MT×${mtK}→¬${fmtF(mtA[0])} (${mtK}), ∧I (1) = ${mpK + mtK + 1} steps.`,
  };
}

// DNE + MP into disjunction + DS + MP chain
// 1 DNE + 1 MP + 1 DS + (n-3) MP = n steps; n atoms
function genDNEDSMPCombo(n: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(n);
  const [a, b, c] = atoms;
  const chain = atoms.slice(3); // may be empty when n=3
  const premises: Formula[] = [
    not(not(a)), imp(a, or(b, c)), not(c),
    ...(chain.length > 0 ? [imp(b, chain[0])] : []),
    ...chain.slice(0, -1).map((x, i) => imp(x, chain[i + 1])),
  ];
  const goal = chain.length > 0 ? chain[chain.length - 1] : b;
  return {
    difficulty: d, title: `Unwrap, Branch, Follow (${n})`,
    description: `${fmtF(a)} hides under ¬¬. Reveal it, follow it into a disjunction, eliminate the false branch to get ${fmtF(b)}${chain.length > 0 ? `, then follow ${chain.length} more implication${chain.length > 1 ? "s" : ""}` : ""}.`,
    premises, goal,
    hint: `DNE→${fmtF(a)} (1), MP→${fmtF(or(b, c))} (2), DS→${fmtF(b)} (3)${chain.length > 0 ? `, MP×${chain.length}→${fmtF(goal)}` : ""} = ${n} steps.`,
  };
}

// ∧E×2 + (k-1)×HS + MT + ∧I = k+3 = n steps; n-1 atoms (k = n-3)
// Forces ∧E, HS, MT, and ∧I all in one puzzle
function genAndEHSMTAndI(n: number, d: DifficultyLevel): PuzzleTemplate {
  const k = n - 3; // ≥ 1
  const atoms = pickAtoms(n - 1);
  const a = atoms[0], b = atoms[1];
  const c = atoms.slice(2); // length k
  const premises: Formula[] = [
    and(a, b), imp(a, c[0]),
    ...c.slice(0, -1).map((x, i) => imp(x, c[i + 1])),
    not(c[k - 1]),
  ];
  const hsCount = k - 1;
  return {
    difficulty: d, title: `Extract, Bridge, Contradict (${n})`,
    description: `Split ${fmtF(and(a, b))}. Use HS shortcuts to bridge ${fmtF(a)} to ${fmtF(c[k - 1])}, which is false — so ¬${fmtF(a)}. Keep ${fmtF(b)} and pair the two results.`,
    premises, goal: and(not(a), b),
    hint: `∧E×2 (2)${hsCount > 0 ? `, HS×${hsCount}→${fmtF(a)}→${fmtF(c[k - 1])} (${hsCount})` : ""}, MT→¬${fmtF(a)} (1), ∧I (1) = ${n} steps.`,
  };
}

// DS + MP chain + MT chain + ∧I
// 1 DS + mpK×MP + mtK×MT + 1 ∧I = mpK+mtK+2 steps; mpK+mtK+3 atoms
function genDSMPMTAndI(mpK: number, mtK: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(mpK + mtK + 3);
  const [a, b] = atoms;                          // disjunction pair
  const mpA = [b, ...atoms.slice(2, 2 + mpK)];  // b → mp[1] → … → mp[mpK]
  const mtA = atoms.slice(2 + mpK);              // mt[0] → … → mt[mtK]; length mtK+1
  const premises: Formula[] = [
    or(a, b), not(a),
    ...mpA.slice(0, mpK).map((x, i) => imp(x, mpA[i + 1])),
    ...mtA.slice(0, mtK).map((x, i) => imp(x, mtA[i + 1])),
    not(mtA[mtK]),
  ];
  return {
    difficulty: d, title: `Eliminate, Follow, Counter (${mpK + mtK + 2})`,
    description: `Eliminate ${fmtF(a)} from a disjunction to start from ${fmtF(b)}. Follow ${mpK} implication${mpK > 1 ? "s" : ""} forward. Separately, disprove ${fmtF(mtA[0])} by working ${mtK} step${mtK > 1 ? "s" : ""} back from a falsehood. Combine both conclusions.`,
    premises, goal: and(mpA[mpK], not(mtA[0])),
    hint: `DS→${fmtF(b)} (1), MP×${mpK}→${fmtF(mpA[mpK])} (${mpK}), MT×${mtK}→¬${fmtF(mtA[0])} (${mtK}), ∧I (1) = ${mpK + mtK + 2} steps.`,
  };
}

// ── 8-step mix: ¬¬E×1 + DS×1 + MP×2 + MT×2 + ∧I×2 (6 rule types, all ≤3) ──
// atoms: a,b,c,d,e,f,g,h  premises: [¬¬a, b∨c, ¬b, a→d, d→e, f→g, g→h, ¬h]
function genMix8(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, f, g, h] = pickAtoms(8);
  return {
    difficulty: d, title: "Six-Rule Challenge (8)",
    description: `Unwrap ¬¬${fmtF(a)}, then follow two implication${""
    }s to ${fmtF(e)}. Eliminate ${fmtF(b)} from a disjunction to get ${fmtF(c)
    }. Disprove ${fmtF(f)} by working back two steps. Combine all three results.`,
    premises: [not(not(a)), or(b, c), not(b), imp(a, dd), imp(dd, e),
               imp(f, g), imp(g, h), not(h)],
    goal: and(and(c, e), not(f)),
    hint: `¬¬E→${fmtF(a)} (1), DS→${fmtF(c)} (2), MP×2→${fmtF(e)} (2), `
        + `MT×2→¬${fmtF(f)} (2), ∧I×2 (2) = 8 steps.`,
  };
}

// ── 9-step mix: ¬¬E×1 + DS×1 + HS×2 + MP×1 + MT×2 + ∧I×2 (6 rule types) ──
// atoms: a,b,c,d,d2,e,f,g,h  premises: [¬¬a, b∨c, ¬b, a→d, d→d2, d2→e, f→g, g→h, ¬h]
function genMix9(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, dd2, e, f, g, h] = pickAtoms(9);
  return {
    difficulty: d, title: "Seven-Rule Gauntlet (9)",
    description: `Unwrap ¬¬${fmtF(a)}, then use two HS shortcuts to bridge `
    + `${fmtF(a)} to ${fmtF(e)} before a single MP. Eliminate ${fmtF(b)} by DS. `
    + `Disprove ${fmtF(f)} via two MT steps. Combine.`,
    premises: [not(not(a)), or(b, c), not(b), imp(a, dd), imp(dd, dd2),
               imp(dd2, e), imp(f, g), imp(g, h), not(h)],
    goal: and(and(c, e), not(f)),
    hint: `¬¬E→${fmtF(a)} (1), DS→${fmtF(c)} (1), HS×2→${fmtF(a)}→${fmtF(e)
           } (2), MP→${fmtF(e)} (1), MT×2→¬${fmtF(f)} (2), ∧I×2 (2) = 9 steps.`,
  };
}

// ── Compound hard: fwd(6) + bwd(hsK+mtK) + ∧I = hsK+mtK+7 steps ─────────────
// Forward (6 steps): ¬¬E×1 + ∧E×2 + MP×2 + ∧I×1 → (c∧d)
// Backward (hsK HS + mtK MT): builds shortcut y→end, then MT collapses chain → ¬Z
// Final ∧I×2: (c∧d) ∧ ¬Z
// Rule counts: ¬¬E:1, ∧E:2, MP:2, ∧I:2, HS:hsK≤3, MT:mtK≤3 — all ≤3 ✓
// Atom budget: 4 (fwd) + hsK+2 (inner) + mtK-1 (outer) = hsK+mtK+5 ≤ 11 ✓
function genHardCompound(hsK: number, mtK: number, d: DifficultyLevel): PuzzleTemplate {
  const atoms = pickAtoms(hsK + mtK + 5);
  const [a, b, c, dd] = atoms;                   // forward: ¬¬(a∧b), a→c, b→d

  const y   = atoms[4];                          // inner chain start
  const innerP = atoms.slice(5, 5 + hsK);        // p₁…p_{hsK}
  const end = atoms[5 + hsK];                    // inner chain end (¬end is premise)

  const outerO = atoms.slice(6 + hsK);           // o₁…o_{mtK-1} (outer MT chain)
  const Z = outerO.length > 0 ? outerO[outerO.length - 1] : y;  // final negated atom

  const premises: Formula[] = [
    // Forward
    not(not(and(a, b))), imp(a, c), imp(b, dd),
    // Backward inner HS chain
    imp(y, innerP.length > 0 ? innerP[0] : end),
    ...innerP.slice(0, -1).map((p, i) => imp(p, innerP[i + 1])),
    ...(innerP.length > 0 ? [imp(innerP[innerP.length - 1], end)] : []),
    not(end),
    // Backward outer MT chain (o₁→y, o₂→o₁, …)
    ...(outerO.length > 0 ? [imp(outerO[0], y)] : []),
    ...outerO.slice(0, -1).map((_, i) => imp(outerO[i + 1], outerO[i])),
  ];

  const totalSteps = hsK + mtK + 7;
  return {
    difficulty: d,
    title: `Compound Proof (${totalSteps})`,
    description:
      `Unpack ${fmtF(not(not(and(a, b))))}, extract ${fmtF(a)} and ${fmtF(b)}, `
    + `derive ${fmtF(c)} and ${fmtF(dd)} by MP, then join them. `
    + `In a separate chain, collapse ${fmtF(y)}→${fmtF(end)} via ${hsK} HS `
    + `shortcut${hsK > 1 ? "s" : ""}, use MT to disprove ${fmtF(y)}, then `
    + `propagate the negation back ${mtK - 1} more step${mtK - 1 !== 1 ? "s" : ""
    } to ¬${fmtF(Z)}. Finally unite both results.`,
    premises,
    goal: and(and(c, dd), not(Z)),
    hint:
      `Forward: ¬¬E (1), ∧E×2 (2), MP×2→${fmtF(c)},${fmtF(dd)} (2), ∧I (1). `
    + `Backward: HS×${hsK}→${fmtF(y)}→${fmtF(end)} (${hsK}), `
    + `MT×${mtK}→¬${fmtF(Z)} (${mtK}). Final ∧I = ${totalSteps} steps.`,
  };
}

// ─── De Morgan generators ──────────────────────────────────────────────────────

// Easy (1 step): ¬(A∧B) → ¬A∨¬B
function genDMBasicAnd(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "De Morgan (∧→∨)",
    description: `You know ${fmtF(not(and(a, b)))}. Use De Morgan's Law to rewrite it as a disjunction of negations.`,
    premises: [not(and(a, b))],
    goal: or(not(a), not(b)),
    hint: `Apply DM to ¬(${fmtF(a)}∧${fmtF(b)}).`,
  };
}

// Easy (1 step): ¬(A∨B) → ¬A∧¬B
function genDMBasicOr(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "De Morgan (∨→∧)",
    description: `You know ${fmtF(not(or(a, b)))}. Use De Morgan's Law to rewrite it as a conjunction of negations.`,
    premises: [not(or(a, b))],
    goal: and(not(a), not(b)),
    hint: `Apply DM to ¬(${fmtF(a)}∨${fmtF(b)}).`,
  };
}

// Easy (2 steps): ¬(A∨B) → DM→¬A∧¬B → ∧E→¬A (or ¬B)
function genDMOrAndE(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  const pickLeft = Math.random() < 0.5;
  const target = pickLeft ? a : b;
  return {
    difficulty: 1, title: "De Morgan + Extract",
    description: `From ${fmtF(not(or(a, b)))}, extract ${fmtF(not(target))} using De Morgan's Law and Conjunction Elimination.`,
    premises: [not(or(a, b))],
    goal: not(target),
    hint: `DM→¬${fmtF(a)}∧¬${fmtF(b)} (1), then ∧E (1).`,
  };
}

// Easy (2 steps): ¬(A∧B), ¬¬A → DM→¬A∨¬B → DS→¬B
// Note: ¬¬A = ¬(¬A), so DS eliminates ¬A from the disjunction.
function genDMAndDS(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "De Morgan + DS",
    description: `From ${fmtF(not(and(a, b)))} and ${fmtF(not(not(a)))}, prove ${fmtF(not(b))}.`,
    premises: [not(and(a, b)), not(not(a))],
    goal: not(b),
    hint: `DM→¬${fmtF(a)}∨¬${fmtF(b)} (1), DS using ¬¬${fmtF(a)} as ¬(¬${fmtF(a)}) (1).`,
  };
}

// Medium (6 steps): DM + ∧E + MT×3 + ∧I
// ¬(a∨b), c→a, d→c, e→d, x  →  DM→¬a∧¬b, ∧E→¬a, MT×3→¬e, ∧I(¬e,x)
// Rules: DM×1, ∧E×1, MT×3, ∧I×1 ✓
function genDMOrMTAndI(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, x] = pickAtoms(6);
  return {
    difficulty: d, title: "De Morgan + MT Chain (6)",
    description: `Apply De Morgan's Law to ${fmtF(not(or(a, b)))}, extract a negation, then propagate it back through a 3-step implication chain.`,
    premises: [not(or(a, b)), imp(c, a), imp(dd, c), imp(e, dd), x],
    goal: and(not(e), x),
    hint: `DM→¬${fmtF(a)}∧¬${fmtF(b)} (1), ∧E→¬${fmtF(a)} (1), MT×3→¬${fmtF(e)} (3), ∧I (1) = 6 steps.`,
  };
}

// Medium (6 steps): DM + DS + MP×3 + ∧I
// ¬(a∧b), ¬¬a, ¬b→c, c→d, d→e, x  →  DM, DS→¬b, MP×3→e, ∧I(e,x)
// Rules: DM×1, DS×1, MP×3, ∧I×1 ✓
function genDMAndDSMPAndI(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, x] = pickAtoms(6);
  return {
    difficulty: d, title: "De Morgan + DS + MP (6)",
    description: `Use De Morgan's Law then Disjunctive Syllogism to obtain ¬${fmtF(b)}, then follow the implication chain to ${fmtF(e)}.`,
    premises: [not(and(a, b)), not(not(a)), imp(not(b), c), imp(c, dd), imp(dd, e), x],
    goal: and(e, x),
    hint: `DM→¬${fmtF(a)}∨¬${fmtF(b)} (1), DS→¬${fmtF(b)} (1), MP×3→${fmtF(e)} (3), ∧I (1) = 6 steps.`,
  };
}

// Medium (6 steps): DM×2 + DS + ∧E + MT + ∧I
// ¬(a∧b), ¬¬a, ¬(c∨d), e→c  →  two independent DM uses, then combine
// Rules: DM×2, DS×1, ∧E×1, MT×1, ∧I×1 ✓
function genDMTwice(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e] = pickAtoms(5);
  return {
    difficulty: d, title: "Double De Morgan (6)",
    description: `Apply De Morgan's Law twice — once to a conjunction, once to a disjunction — then combine the results.`,
    premises: [not(and(a, b)), not(not(a)), not(or(c, dd)), imp(e, c)],
    goal: and(not(b), not(e)),
    hint: `DM on ¬(${fmtF(a)}∧${fmtF(b)}) (1), DS→¬${fmtF(b)} (1), DM on ¬(${fmtF(c)}∨${fmtF(dd)}) (1), ∧E→¬${fmtF(c)} (1), MT→¬${fmtF(e)} (1), ∧I (1) = 6 steps.`,
  };
}

// Medium (7 steps): DM×2 + DS + ∧E + MT×2 + ∧I
// ¬(a∧b), ¬¬a, ¬(c∨d), e→c, f→e
// Rules: DM×2, DS×1, ∧E×1, MT×2, ∧I×1 ✓
function genDMCombo7(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, f] = pickAtoms(6);
  return {
    difficulty: d, title: "Double De Morgan + Chain (7)",
    description: `Use De Morgan's Law twice to split two negated compound formulas, then chain MT steps to reach your two sub-goals.`,
    premises: [not(and(a, b)), not(not(a)), not(or(c, dd)), imp(e, c), imp(f, e)],
    goal: and(not(b), not(f)),
    hint: `DM×2 (2), DS→¬${fmtF(b)} (1), ∧E→¬${fmtF(c)} (1), MT×2→¬${fmtF(f)} (2), ∧I (1) = 7 steps.`,
  };
}

// Medium (8 steps): DM×2 + DS + ∧E + MT×3 + ∧I
// ¬(a∧b), ¬¬a, ¬(c∨d), e→c, f→e, g→f
// Rules: DM×2, DS×1, ∧E×1, MT×3, ∧I×1 ✓
function genDMCombo8(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, f, g] = pickAtoms(7);
  return {
    difficulty: d, title: "Double De Morgan + Long Chain (8)",
    description: `Apply De Morgan's Law twice, then propagate a negation back through a 3-step chain before combining results.`,
    premises: [not(and(a, b)), not(not(a)), not(or(c, dd)), imp(e, c), imp(f, e), imp(g, f)],
    goal: and(not(b), not(g)),
    hint: `DM×2 (2), DS→¬${fmtF(b)} (1), ∧E→¬${fmtF(c)} (1), MT×3→¬${fmtF(g)} (3), ∧I (1) = 8 steps.`,
  };
}

// Hard (11 steps): DM×2 + DS + MP + ∧E + HS×2 + MT×2 + ∧I×2
// Forward branch (6): DM→¬a∨¬b, DS→¬b, MP→c, DM→¬d∧¬e, ∧E→¬d, ∧I(c,¬d)
// Backward branch (5): HS×2 builds f→i, MT→¬f, MT→¬j, ∧I(c∧¬d, ¬j)
// Rules: DM×2, DS×1, MP×1, ∧E×1, HS×2, MT×2, ∧I×2 — all ≤3 ✓
function genDMHard(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, f, g, h, ii, j] = pickAtoms(10);
  return {
    difficulty: d, title: "De Morgan Compound (11)",
    description:
      `Two independent tracks: (1) apply De Morgan's Law to ¬(${fmtF(a)}∧${fmtF(b)}), `
    + `use DS to isolate ¬${fmtF(b)}, convert ¬(${fmtF(dd)}∨${fmtF(e)}) to extract ¬${fmtF(dd)}, then MP to ${fmtF(c)}, `
    + `combine into ${fmtF(c)}∧¬${fmtF(dd)}. (2) Use two HS shortcuts to chain ${fmtF(f)} to ${fmtF(ii)}, `
    + `apply MT twice to disprove ${fmtF(j)}. Finally unite both tracks.`,
    premises: [
      not(and(a, b)), not(not(a)), imp(not(b), c),
      not(or(dd, e)),
      imp(f, g), imp(g, h), imp(h, ii), imp(j, f), not(ii),
    ],
    goal: and(and(c, not(dd)), not(j)),
    hint:
      `Fwd: DM×2 (2), DS→¬${fmtF(b)} (1), MP→${fmtF(c)} (1), ∧E→¬${fmtF(dd)} (1), ∧I→${fmtF(c)}∧¬${fmtF(dd)} (1). `
    + `Bwd: HS×2→${fmtF(f)}→${fmtF(ii)} (2), MT×2→¬${fmtF(j)} (2), final ∧I (1) = 11 steps.`,
  };
}

// ─── MI generators ────────────────────────────────────────────────────────────

// Easy (1 step): P→Q → ¬P∨Q
function genMIBasic(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "Material Implication (→ to ∨)",
    description: `Convert ${fmtF(imp(a, b))} into a disjunction using Material Implication.`,
    premises: [imp(a, b)],
    goal: or(not(a), b),
    hint: `MI on ${fmtF(imp(a, b))} gives ¬${fmtF(a)}∨${fmtF(b)}.`,
  };
}

// Easy (1 step): ¬P∨Q → P→Q
function genMIRevBasic(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "Material Implication (∨ to →)",
    description: `Convert ${fmtF(or(not(a), b))} into an implication using Material Implication.`,
    premises: [or(not(a), b)],
    goal: imp(a, b),
    hint: `MI on ¬${fmtF(a)}∨${fmtF(b)} gives ${fmtF(a)}→${fmtF(b)}.`,
  };
}

// Easy (2 steps): ¬P∨Q → MI→P→Q, MP→Q
function genMIRevMP(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "MI + MP",
    description: `From ${fmtF(or(not(a), b))} and ${fmtF(a)}, derive ${fmtF(b)}.`,
    premises: [or(not(a), b), a],
    goal: b,
    hint: `MI converts ¬${fmtF(a)}∨${fmtF(b)} to ${fmtF(a)}→${fmtF(b)}, then MP with ${fmtF(a)}.`,
  };
}

// Medium (6 steps): MI×3 + HS×2 + MP×1
// Premises: [¬a∨b, ¬b∨c, ¬c∨d, a]  →  d
function genMIHSMP(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd] = pickAtoms(4);
  return {
    difficulty: d, title: "MI Chain (6)",
    description: `Three implications are disguised as disjunctions. Convert them with MI, chain them with HS, then apply MP.`,
    premises: [or(not(a), b), or(not(b), c), or(not(c), dd), a],
    goal: dd,
    hint: `MI×3→${fmtF(a)}→${fmtF(b)}, ${fmtF(b)}→${fmtF(c)}, ${fmtF(c)}→${fmtF(dd)} (3), HS×2→${fmtF(a)}→${fmtF(dd)} (2), MP (1) = 6 steps.`,
  };
}

// ─── CP generators ────────────────────────────────────────────────────────────

// Easy (1 step): P→Q → ¬Q→¬P
function genCPBasic(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "Contrapositive",
    description: `From ${fmtF(imp(a, b))}, derive its contrapositive ${fmtF(imp(not(b), not(a)))}.`,
    premises: [imp(a, b)],
    goal: imp(not(b), not(a)),
    hint: `Apply CP to ${fmtF(a)}→${fmtF(b)}.`,
  };
}

// Easy (2 steps): P→Q, ¬Q → CP→¬Q→¬P, MP→¬P
function genCPMP(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "CP + MP",
    description: `Use Contrapositive then Modus Ponens to derive ${fmtF(not(a))} from ${fmtF(imp(a, b))} and ${fmtF(not(b))}.`,
    premises: [imp(a, b), not(b)],
    goal: not(a),
    hint: `CP→¬${fmtF(b)}→¬${fmtF(a)} (1), MP (1).`,
  };
}

// Medium (6 steps): CP×3 + HS×3
// Premises: [¬b→¬a, ¬c→¬b, ¬d→¬c, e→a]  →  e→d
// CP shortcut on each ¬x→¬y: gives y→x. Then chain with HS.
function genCPHS(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e] = pickAtoms(5);
  return {
    difficulty: d, title: "Contrapositive Chain (6)",
    description: `Three contrapositives are given as ¬→¬ implications. Use CP to flip them, then chain with HS.`,
    premises: [imp(not(b), not(a)), imp(not(c), not(b)), imp(not(dd), not(c)), imp(e, a)],
    goal: imp(e, dd),
    hint: `CP×3→${fmtF(a)}→${fmtF(b)}, ${fmtF(b)}→${fmtF(c)}, ${fmtF(c)}→${fmtF(dd)} (3), HS×3→${fmtF(e)}→${fmtF(dd)} (3) = 6 steps.`,
  };
}

// ─── Exp generators ───────────────────────────────────────────────────────────

// Easy (1 step): (P∧Q)→R → P→(Q→R)
function genExpFwd(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return {
    difficulty: 1, title: "Exportation (∧→ to →→)",
    description: `Export the conjunction in the antecedent of ${fmtF(imp(and(a, b), c))}.`,
    premises: [imp(and(a, b), c)],
    goal: imp(a, imp(b, c)),
    hint: `Apply Exp to (${fmtF(a)}∧${fmtF(b)})→${fmtF(c)}.`,
  };
}

// Easy (1 step): P→(Q→R) → (P∧Q)→R
function genExpRev(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return {
    difficulty: 1, title: "Exportation (→→ to ∧→)",
    description: `Import ${fmtF(imp(a, imp(b, c)))} into a single implication with a conjunction.`,
    premises: [imp(a, imp(b, c))],
    goal: imp(and(a, b), c),
    hint: `Apply Exp to ${fmtF(a)}→(${fmtF(b)}→${fmtF(c)}).`,
  };
}

// Easy (3 steps): Exp + MP×2
// (a∧b)→c, a, b  →  Exp→a→(b→c), MP→b→c, MP→c
function genExpMP(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return {
    difficulty: 1, title: "Exp + MP",
    description: `From ${fmtF(imp(and(a, b), c))}, ${fmtF(a)}, and ${fmtF(b)}, derive ${fmtF(c)}.`,
    premises: [imp(and(a, b), c), a, b],
    goal: c,
    hint: `Exp→${fmtF(a)}→(${fmtF(b)}→${fmtF(c)}) (1), MP×2→${fmtF(c)} (2) = 3 steps.`,
  };
}

// Medium (8 steps): Exp + MP×3 + MI×2 + ∧I×1
// (a∧b)→c, a, b, ¬c∨d, ¬d∨e, x  →  e∧x
function genExpMIMP(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, x] = pickAtoms(6);
  return {
    difficulty: d, title: "Exp + MI Chain (8)",
    description: `Unpack the nested implication with Exp, then follow a chain of disguised implications (MI) to reach ${fmtF(e)}, and combine.`,
    premises: [imp(and(a, b), c), a, b, or(not(c), dd), or(not(dd), e), x],
    goal: and(e, x),
    hint: `Exp (1), MP×2→${fmtF(c)} (2), MI×2→${fmtF(c)}→${fmtF(dd)},${fmtF(dd)}→${fmtF(e)} (2), MP×1→${fmtF(e)} (1)? No—MP→${fmtF(dd)} then MP→${fmtF(e)}: total MP×3 (1+1+1), ∧I (1) = 8 steps.`,
  };
}

// ─── DNI generators ───────────────────────────────────────────────────────────

// Easy (1 step): P → ¬¬P
function genDNIBasic(): PuzzleTemplate {
  const [a] = pickAtoms(1);
  return {
    difficulty: 1, title: "Double Negation Intro",
    description: `Wrap ${fmtF(a)} in a double negation.`,
    premises: [a],
    goal: not(not(a)),
    hint: `Apply ¬¬I to ${fmtF(a)}.`,
  };
}

// Easy (3 steps): DNI + DS + MP
// a, a∨b → DNI(a)→¬¬a, then use ¬¬a with a∨b... Actually better:
// DNI(a)→¬¬a, use ¬¬a with DS on ¬a∨c?
// Simpler: DNI + MP chain
// ¬¬a→b, a → DNI(a)→¬¬a, MP→b (2 steps, DNI+MP)
function genDNIMP(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "DNI + MP",
    description: `From ${fmtF(a)} and ${fmtF(imp(not(not(a)), b))}, derive ${fmtF(b)}.`,
    premises: [a, imp(not(not(a)), b)],
    goal: b,
    hint: `¬¬I on ${fmtF(a)} gives ¬¬${fmtF(a)} (1), then MP (1) = 2 steps.`,
  };
}

// ─── CD generators ────────────────────────────────────────────────────────────

// Easy (1 step, 3 lines): a→b, c→d, a∨c  →  b∨d
function genCDBasic(): PuzzleTemplate {
  const [a, b, c, dd] = pickAtoms(4);
  return {
    difficulty: 1, title: "Constructive Dilemma",
    description: `From ${fmtF(imp(a, b))}, ${fmtF(imp(c, dd))}, and ${fmtF(or(a, c))}, derive ${fmtF(or(b, dd))}.`,
    premises: [imp(a, b), imp(c, dd), or(a, c)],
    goal: or(b, dd),
    hint: `Select all 3 lines and apply CD.`,
  };
}

// Medium (6 steps): CD + DS + MP×3 + ∧I
// a→b, c→d, a∨c, ¬d, b→e, e→f, f→g, x  →  g∧x
function genCDDSMP(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, f, g, x] = pickAtoms(8);
  return {
    difficulty: d, title: "Constructive Dilemma + Chain (6)",
    description: `Use CD to open a disjunction, DS to pick a branch, then follow the implication chain.`,
    premises: [imp(a, b), imp(c, dd), or(a, c), not(dd), imp(b, e), imp(e, f), imp(f, g), x],
    goal: and(g, x),
    hint: `CD (1), DS→${fmtF(b)} (1), MP×3→${fmtF(g)} (3), ∧I (1) = 6 steps. Select all 3 lines for CD.`,
  };
}

// ─── Comm generators ──────────────────────────────────────────────────────────

// Easy (1 step): a∨b → b∨a
function genCommOrBasic(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "Commutation (∨)",
    description: `Swap the sides of ${fmtF(or(a, b))}.`,
    premises: [or(a, b)],
    goal: or(b, a),
    hint: `Apply Com to ${fmtF(a)}∨${fmtF(b)}.`,
  };
}

// Easy (1 step): a∧b → b∧a
function genCommAndBasic(): PuzzleTemplate {
  const [a, b] = pickAtoms(2);
  return {
    difficulty: 1, title: "Commutation (∧)",
    description: `Swap the sides of ${fmtF(and(a, b))}.`,
    premises: [and(a, b)],
    goal: and(b, a),
    hint: `Apply Com to ${fmtF(a)}∧${fmtF(b)}.`,
  };
}

// Easy (3 steps): Comm + DS + MP
// b∨a, ¬a, b→c  →  Com→a∨b, DS→b, MP→c
function genCommDS(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return {
    difficulty: 1, title: "Comm + DS + MP",
    description: `The disjunction is in the wrong order for DS. Use Comm first, then DS, then MP.`,
    premises: [or(b, a), not(a), imp(b, c)],
    goal: c,
    hint: `Com→${fmtF(a)}∨${fmtF(b)} (1), DS→${fmtF(b)} (1), MP→${fmtF(c)} (1) = 3 steps.`,
  };
}

// ─── Dist generators ──────────────────────────────────────────────────────────

// Easy (1 step): a∧(b∨c) → (a∧b)∨(a∧c)
function genDistAndFwd(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return {
    difficulty: 1, title: "Distribution (∧ over ∨)",
    description: `Distribute ${fmtF(and(a, or(b, c)))} to get a disjunction of conjunctions.`,
    premises: [and(a, or(b, c))],
    goal: or(and(a, b), and(a, c)),
    hint: `Apply Dist to ${fmtF(a)}∧(${fmtF(b)}∨${fmtF(c)}).`,
  };
}

// Easy (1 step): a∨(b∧c) → (a∨b)∧(a∨c)
function genDistOrFwd(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  return {
    difficulty: 1, title: "Distribution (∨ over ∧)",
    description: `Distribute ${fmtF(or(a, and(b, c)))} to get a conjunction of disjunctions.`,
    premises: [or(a, and(b, c))],
    goal: and(or(a, b), or(a, c)),
    hint: `Apply Dist to ${fmtF(a)}∨(${fmtF(b)}∧${fmtF(c)}).`,
  };
}

// Easy (2 steps): Dist + ∧E
// a∨(b∧c) → Dist→(a∨b)∧(a∨c) → ∧E→a∨b
function genDistOrAndE(): PuzzleTemplate {
  const [a, b, c] = pickAtoms(3);
  const pickLeft = Math.random() < 0.5;
  const target = pickLeft ? or(a, b) : or(a, c);
  return {
    difficulty: 1, title: "Dist + Extract",
    description: `From ${fmtF(or(a, and(b, c)))}, derive ${fmtF(target)}.`,
    premises: [or(a, and(b, c))],
    goal: target,
    hint: `Dist→(${fmtF(a)}∨${fmtF(b)})∧(${fmtF(a)}∨${fmtF(c)}) (1), ∧E (1) = 2 steps.`,
  };
}

// Medium (7 steps): Dist + ∧E + DS + MP×3 + ∧I
// a∨(b∧c), ¬b, a→d, d→e, e→f, g  →  f∧g
function genDistDSMP(d: DifficultyLevel): PuzzleTemplate {
  const [a, b, c, dd, e, f, g] = pickAtoms(7);
  return {
    difficulty: d, title: "Distribution + DS + Chain (7)",
    description: `Distribute the disjunction, extract a sub-disjunction, use DS to isolate ${fmtF(a)}, then follow the chain.`,
    premises: [or(a, and(b, c)), not(b), imp(a, dd), imp(dd, e), imp(e, f), g],
    goal: and(f, g),
    hint: `Dist→(${fmtF(a)}∨${fmtF(b)})∧(${fmtF(a)}∨${fmtF(c)}) (1), ∧E→${fmtF(a)}∨${fmtF(b)} (1), DS→${fmtF(a)} (1), MP×3→${fmtF(f)} (3), ∧I (1) = 7 steps.`,
  };
}

// ─── Main puzzle generator ────────────────────────────────────────────────────
function generatePuzzle(difficulty: DifficultyLevel): PuzzleTemplate {
  if (difficulty === 1) {
    return pickOne(shuffleArr<() => PuzzleTemplate>([
      // Single-rule (1 step each)
      genSingleMP, genSingleMT, genAndEL, genAndER, genDS, genDNE, genAndI, genHS,
      genDMBasicAnd, genDMBasicOr,
      genMIBasic, genMIRevBasic, genCPBasic, genExpFwd, genExpRev, genDNIBasic, genCDBasic,
      genCommOrBasic, genCommAndBasic, genDistAndFwd, genDistOrFwd,
      // Two-rule combos (2–3 steps)
      genAndEMP, genDSMP, genCrossExtract, genMPAndI, genDNEDS, genDMOrAndE, genDMAndDS,
      genMIRevMP, genCPMP, genExpMP, genDNIMP, genCommDS, genDistOrAndE,
      () => genHSMTCombo(2, 1),            // HS×1 + MT×1 = 2 steps ✓
      () => genHSMTCombo(3, 1),            // HS×2 + MT×1 = 3 steps ✓
      // Short chains — each rule used ≤3 times
      () => genMPChain(2, 1),              // MP×2 ✓
      () => genMPChain(3, 1),              // MP×3 ✓
      () => genMTChain(2, 1),              // MT×2 ✓
      () => genMTChain(3, 1),              // MT×3 ✓
      () => genDNEMPChain(2, 1),           // DNE + MP×2 ✓
      () => genDNEMPChain(3, 1),           // DNE + MP×3 ✓ (wait: n=3 → MP×2 ✓)
      () => genDSMPChain(2, 1),            // DS + MP×2 ✓
      () => genDSMPChain(3, 1),            // DS + MP×3 ✓
      // Mixed-rule puzzles (3–4 steps)
      () => genDNEDSMPCombo(3, 1),         // DNE + MP×1 + DS ✓
      () => genAndEHSMTAndI(4, 1),         // ∧E×2 + MT×1 + ∧I×1 ✓
      () => genMPMTAndI(1, 1, 1),          // MP×1 + MT×1 + ∧I×1 = 3 steps ✓
      () => genMPMTAndI(2, 1, 1),          // MP×2 + MT×1 + ∧I×1 = 4 steps ✓
      () => genMPMTAndI(1, 2, 1),          // MP×1 + MT×2 + ∧I×1 = 4 steps ✓
    ]))();
  }

  if (difficulty === 2) {
    // All generators below are verified: no rule used more than 3 times.
    return pickOne(shuffleArr<() => PuzzleTemplate>([
      // ── 6 steps ──────────────────────────────────────────────────────────
      () => genMPMTAndI(2, 3, 2),          // MP×2 + MT×3 + ∧I ✓
      () => genMPMTAndI(3, 2, 2),          // MP×3 + MT×2 + ∧I ✓
      () => genDSMPMTAndI(1, 3, 2),        // DS + MP×1 + MT×3 + ∧I ✓
      () => genDSMPMTAndI(3, 1, 2),        // DS + MP×3 + MT×1 + ∧I ✓
      () => genAndEHSMTAndI(6, 2),         // ∧E×2 + HS×2 + MT×1 + ∧I ✓
      () => genTwinChains(6, 2),           // ∧E×2 + MP×3 + ∧I ✓
      () => genDNE2TwinChains(6, 2),       // DNE×2 + MP×3 + ∧I ✓ (MP total = 3)
      () => genDNEAndETwinChains(6, 2),    // DNE + ∧E×2 + MP×2 + ∧I ✓
      () => genDMOrMTAndI(2),              // DM + ∧E + MT×3 + ∧I ✓
      () => genDMAndDSMPAndI(2),           // DM + DS + MP×3 + ∧I ✓
      () => genDMTwice(2),                 // DM×2 + DS + ∧E + MT + ∧I ✓
      // ── New-rule medium combos ─────────────────────────────────────────
      () => genMIHSMP(2),                  // MI×3 + HS×2 + MP = 6 steps ✓
      () => genCPHS(2),                    // CP×3 + HS×3 = 6 steps ✓
      () => genExpMIMP(2),                 // Exp + MI×2 + MP×3 + ∧I = 8 steps ✓
      () => genCDDSMP(2),                  // CD + DS + MP×3 + ∧I = 6 steps ✓
      () => genDistDSMP(2),                // Dist + ∧E + DS + MP×3 + ∧I = 7 steps ✓
      // ── 7 steps ──────────────────────────────────────────────────────────
      () => genMPMTAndI(3, 3, 2),          // MP×3 + MT×3 + ∧I ✓
      () => genDSMPMTAndI(2, 3, 2),        // DS + MP×2 + MT×3 + ∧I ✓
      () => genDSMPMTAndI(3, 2, 2),        // DS + MP×3 + MT×2 + ∧I ✓
      () => genAndEHSMTAndI(7, 2),         // ∧E×2 + HS×3 + MT×1 + ∧I ✓
      () => genDNEAndETwinChains(7, 2),    // DNE + ∧E×2 + MP×3 + ∧I ✓
      () => genDMCombo7(2),                // DM×2 + DS + ∧E + MT×2 + ∧I ✓
      // ── 8 steps ──────────────────────────────────────────────────────────
      () => genDSMPMTAndI(3, 3, 2),        // DS + MP×3 + MT×3 + ∧I ✓
      () => genMix8(2),                    // ¬¬E + DS + MP×2 + MT×2 + ∧I×2 ✓
      () => genDMCombo8(2),                // DM×2 + DS + ∧E + MT×3 + ∧I ✓
      // ── 9 steps ──────────────────────────────────────────────────────────
      () => genMix9(2),                    // ¬¬E + DS + HS×2 + MP + MT×2 + ∧I×2 ✓
    ]))();
  }

  // Hard: 11–13 steps; every rule used ≤ 3 times (verified by construction).
  // genHardCompound(hsK, mtK): fwd(6) + hsK HS + mtK MT + final ∧I = hsK+mtK+7 steps
  // Rule counts: ¬¬E:1, ∧E:2, MP:2, ∧I:2, HS:hsK≤3, MT:mtK≤3 — all ≤3 ✓
  return pickOne(shuffleArr<() => PuzzleTemplate>([
    () => genHardCompound(2, 2, 3),        // 11 steps, 9 atoms ✓
    () => genHardCompound(3, 2, 3),        // 12 steps, 10 atoms ✓
    () => genHardCompound(3, 3, 3),        // 13 steps, 11 atoms ✓
    () => genDMHard(3),                    // DM×2+DS+MP+∧E+HS×2+MT×2+∧I×2 = 11 steps ✓
  ]))();
}

const STREAK_TO_LEVEL_UP = 2;

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = { 1: "Easy", 2: "Medium", 3: "Hard" };
const DIFFICULTY_COLOR: Record<DifficultyLevel, string> = {
  1: "bg-green-100 text-green-700 border-green-300",
  2: "bg-yellow-100 text-yellow-800 border-yellow-300",
  3: "bg-red-100 text-red-700 border-red-300",
};

// ─── Proof Line ───────────────────────────────────────────────────────────────
type ProofLine = {
  id: number;
  formula: Formula;
  justification: string;
};

function initProof(puzzle: PuzzleTemplate): ProofLine[] {
  return puzzle.premises.map((f, i) => ({
    id: i + 1,
    formula: f,
    justification: "Premise",
  }));
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Use a static inline puzzle as SSR-safe initial value; randomize on client via useEffect.
const INITIAL_PUZZLE: PuzzleTemplate = {
  difficulty: 1,
  title: "Single MP",
  description: "P → Q holds and P is true. What can you conclude?",
  premises: [imp(atom("P"), atom("Q")), atom("P")],
  goal: atom("Q"),
  hint: "Select Modus Ponens, then click P → Q and P.",
};

export default function NaturalDeductionGame() {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleTemplate>(INITIAL_PUZZLE);
  const [proofLines, setProofLines] = useState<ProofLine[]>(() => initProof(INITIAL_PUZZLE));
  const [nextLineId, setNextLineId] = useState(INITIAL_PUZZLE.premises.length + 1);
  const [selectedRule, setSelectedRule] = useState<RuleId | null>(null);
  const [selectedLineIds, setSelectedLineIds] = useState<number[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);

  const ruleInfo = RULES.find((r) => r.id === selectedRule);
  const maxLines = ruleInfo?.lines ?? 0;

  // Randomize puzzle on first client render (avoids SSR/client hydration mismatch)
  useEffect(() => { loadPuzzle(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function loadPuzzle(diff: DifficultyLevel) {
    const next = generatePuzzle(diff);
    setCurrentPuzzle(next);
    setProofLines(initProof(next));
    setNextLineId(next.premises.length + 1);
    setSelectedRule(null);
    setSelectedLineIds([]);
    setCandidates([]);
    setError(null);
    setShowHint(false);
    setSolved(false);
  }

  function resetProof() {
    setProofLines(initProof(currentPuzzle));
    setNextLineId(currentPuzzle.premises.length + 1);
    setSelectedRule(null);
    setSelectedLineIds([]);
    setCandidates([]);
    setError(null);
  }

  function selectRule(id: RuleId) {
    setSelectedRule(id);
    setSelectedLineIds([]);
    setCandidates([]);
    setError(null);
  }

  function toggleLine(lineId: number) {
    setError(null);
    setCandidates([]);
    setSelectedLineIds((prev) => {
      if (prev.includes(lineId)) return prev.filter((id) => id !== lineId);
      if (prev.length >= maxLines) return [...prev.slice(1), lineId];
      return [...prev, lineId];
    });
  }

  function handleApply() {
    if (!selectedRule) { setError("Please select an inference rule first."); return; }
    const selLines = selectedLineIds.map((id) => proofLines.find((l) => l.id === id)!).filter(Boolean);
    if (selLines.length < maxLines) {
      setError(`This rule requires ${maxLines} line${maxLines > 1 ? "s" : ""}. Select ${maxLines - selLines.length} more.`);
      return;
    }
    const result = applyRule(selectedRule, selLines);
    if (result.length === 0) {
      setError("That rule doesn't apply here. Check that you selected the right lines.");
      return;
    }
    if (result.length === 1) {
      addLine(result[0]);
    } else {
      setCandidates(result);
    }
  }

  function addLine(c: Candidate) {
    const newLine: ProofLine = { id: nextLineId, formula: c.formula, justification: c.justification };
    setProofLines((prev) => [...prev, newLine]);
    setNextLineId((n) => n + 1);
    setSelectedRule(null);
    setSelectedLineIds([]);
    setCandidates([]);
    setError(null);

    if (eq(c.formula, currentPuzzle.goal)) {
      setSolved(true);
      setScore((s) => s + 1);
      const newStreak = streak + 1;
      if (newStreak >= STREAK_TO_LEVEL_UP && difficulty < 3) {
        setDifficulty((d) => (d + 1) as DifficultyLevel);
        setStreak(0);
      } else {
        setStreak(newStreak);
      }
    }
  }

  function handleNext() {
    loadPuzzle(difficulty);
  }

  function handleEasier() {
    const newDiff = Math.max(1, difficulty - 1) as DifficultyLevel;
    setDifficulty(newDiff);
    setStreak(0);
    loadPuzzle(newDiff);
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Natural Deduction</h1>
        <p className="text-sm text-gray-500">
          Apply inference rules step-by-step to derive the goal from the premises.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${DIFFICULTY_COLOR[difficulty]}`}>
          {DIFFICULTY_LABEL[difficulty]}
        </span>
        <span className="text-sm text-gray-600 font-semibold">
          🏆 Score: <span className="text-violet-700">{score}</span>
        </span>
        {difficulty < 3 ? (
          <span className="text-sm text-gray-600 font-semibold">
            🔥 Streak: <span className="text-orange-500">{streak}/{STREAK_TO_LEVEL_UP}</span>
            <span className="text-gray-400 font-normal"> to level up</span>
          </span>
        ) : (
          <span className="text-xs text-red-500 font-semibold">🔥 Max difficulty!</span>
        )}
      </div>

      {/* Puzzle Info */}
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 mb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-violet-800 text-lg">{currentPuzzle.title}</h2>
            <p className="text-sm text-violet-700 mt-0.5">{currentPuzzle.description}</p>
          </div>
          <button
            onClick={() => setShowHint((h) => !h)}
            className="shrink-0 text-xs px-3 py-1 bg-violet-200 hover:bg-violet-300 text-violet-800 rounded-full font-medium transition"
          >
            {showHint ? "Hide Hint" : "Hint 💡"}
          </button>
        </div>
        {showHint && (
          <p className="mt-2 text-sm text-violet-600 bg-violet-100 rounded-xl px-3 py-2">
            {currentPuzzle.hint}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-violet-500 uppercase tracking-wide">Goal:</span>
          <span className="font-mono font-bold text-violet-900 text-base bg-white px-3 py-0.5 rounded-lg border border-violet-200">
            {fmtF(currentPuzzle.goal)}
          </span>
        </div>
      </div>

      {/* Solved banner */}
      {solved && (
        <div className="mb-5 p-4 bg-green-100 border border-green-300 rounded-2xl text-center">
          <div className="text-2xl mb-1">🎉</div>
          <p className="font-bold text-green-800">Goal derived! Puzzle solved!</p>
          {streak === 0 && difficulty > 1 && (
            <p className="text-sm text-green-700 mt-0.5">
              ⬆️ Levelled up to <strong>{DIFFICULTY_LABEL[difficulty]}</strong>!
            </p>
          )}
          <div className="mt-3 flex justify-center gap-2 flex-wrap">
            <button
              onClick={handleNext}
              className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold text-sm transition"
            >
              Next Puzzle →
            </button>
            {difficulty > 1 && (
              <button
                onClick={handleEasier}
                className="px-5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-semibold text-sm transition"
              >
                Too Hard? Go Easier
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Rules Panel ── */}
        <div>
          <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase tracking-wide">Inference Rules</h3>
          <div className="space-y-1.5">
            {RULES.map((rule) => (
              <button
                key={rule.id}
                onClick={() => selectRule(rule.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all
                  ${selectedRule === rule.id
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/50"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-mono font-bold text-sm w-10 shrink-0
                    ${selectedRule === rule.id ? "text-violet-700" : "text-gray-500"}`}>
                    {rule.sym}
                  </span>
                  <span className={`font-semibold text-sm
                    ${selectedRule === rule.id ? "text-violet-800" : "text-gray-700"}`}>
                    {rule.name}
                  </span>
                </div>
                <p className="font-mono text-xs text-gray-400 mt-0.5 ml-12">{rule.schema}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Proof Panel ── */}
        <div>
          <h3 className="font-bold text-gray-700 mb-2 text-sm uppercase tracking-wide">Proof</h3>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-3">
            {proofLines.map((line) => {
              const isSelected = selectedLineIds.includes(line.id);
              const isGoal = eq(line.formula, currentPuzzle.goal);
              return (
                <button
                  key={line.id}
                  onClick={() => selectedRule && !solved ? toggleLine(line.id) : undefined}
                  disabled={!selectedRule || solved}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 border-gray-50 text-left transition-all
                    ${isSelected
                      ? "bg-violet-100 border-violet-200"
                      : isGoal && solved
                      ? "bg-green-50"
                      : "hover:bg-gray-50"
                    } ${selectedRule && !solved ? "cursor-pointer" : "cursor-default"}`}
                >
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{line.id}</span>
                  <span className={`font-mono text-sm flex-1 font-semibold
                    ${isSelected ? "text-violet-800" : isGoal && solved ? "text-green-700" : "text-gray-800"}`}>
                    {fmtF(line.formula)}
                    {isGoal && solved && " ✓"}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{line.justification}</span>
                </button>
              );
            })}
          </div>

          {/* Selection status */}
          {selectedRule && !solved && (
            <div className="text-xs text-gray-500 mb-2 px-1">
              {ruleInfo && (
                <span>
                  <strong>{ruleInfo.name}</strong> needs{" "}
                  <strong>{maxLines} line{maxLines > 1 ? "s" : ""}</strong> — selected{" "}
                  <strong>{selectedLineIds.length}/{maxLines}</strong>.{" "}
                  {selectedLineIds.length < maxLines ? "Click a line above." : ""}
                </span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              ⚠️ {error}
            </div>
          )}

          {/* Candidates (multiple choices, e.g. ∧E) */}
          {candidates.length > 1 && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">Choose which formula to derive:</p>
              <div className="flex flex-wrap gap-2">
                {candidates.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => addLine(c)}
                    className="font-mono text-sm px-3 py-1.5 bg-white border-2 border-amber-300 hover:border-amber-500 hover:bg-amber-50 text-amber-800 rounded-lg font-semibold transition"
                  >
                    {fmtF(c.formula)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!solved && (
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                disabled={!selectedRule || selectedLineIds.length < maxLines}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition"
              >
                Apply Rule
              </button>
              <button
                onClick={resetProof}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition"
              >
                Reset
              </button>
              {difficulty > 1 && (
                <button
                  onClick={handleEasier}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition"
                >
                  Easier
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
