"use client"

import { useCallback, useRef, useState, useMemo, useEffect } from "react"
import confetti from "canvas-confetti"

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */
interface PlacedWord {
  word: string
  clue: string
  direction: "across" | "down"
  row: number
  col: number
  number: number
}

interface CellData {
  letter: string
  isBlack: boolean
  number: number | null
  acrossIdx: number | null
  downIdx: number | null
}

/* ------------------------------------------------------------------ */
/*  CROSSWORD SOLVER                                                   */
/* ------------------------------------------------------------------ */
function solveCrossword(
  wordList: { word: string; clue: string }[]
): { placements: PlacedWord[]; rows: number; cols: number } {
  const MAX = 25
  const grid: (string | null)[][] = Array.from({ length: MAX }, () => Array(MAX).fill(null))
  const placed: PlacedWord[] = []
  let numCounter = 1

  const sorted = [...wordList].sort((a, b) => b.word.length - a.word.length)

  const sr = Math.floor(MAX / 2)
  const sc = Math.floor((MAX - sorted[0].word.length) / 2)
  for (let i = 0; i < sorted[0].word.length; i++) grid[sr][sc + i] = sorted[0].word[i]
  placed.push({ ...sorted[0], direction: "across", row: sr, col: sc, number: numCounter++ })

  for (let wi = 1; wi < sorted.length; wi++) {
    const w = sorted[wi]
    let best: PlacedWord | null = null
    let bestScore = -1

    for (let li = 0; li < w.word.length; li++) {
      const ch = w.word[li]
      for (let r = 0; r < MAX; r++) {
        for (let c = 0; c < MAX; c++) {
          if (grid[r][c] !== ch) continue
          const dr = r - li
          if (dr >= 0 && dr + w.word.length <= MAX && canPlace(grid, w.word, "down", dr, c, MAX)) {
            const s = crossings(grid, w.word, "down", dr, c, MAX)
            if (s > bestScore) { bestScore = s; best = { ...w, direction: "down", row: dr, col: c, number: numCounter } }
          }
          const ac = c - li
          if (ac >= 0 && ac + w.word.length <= MAX && canPlace(grid, w.word, "across", r, ac, MAX)) {
            const s = crossings(grid, w.word, "across", r, ac, MAX)
            if (s > bestScore) { bestScore = s; best = { ...w, direction: "across", row: r, col: ac, number: numCounter } }
          }
        }
      }
    }

    if (best) {
      for (let i = 0; i < w.word.length; i++) {
        const pr = best.direction === "down" ? best.row + i : best.row
        const pc = best.direction === "across" ? best.col + i : best.col
        grid[pr][pc] = w.word[i]
      }
      placed.push(best)
      numCounter++
    }
  }

  let minR = MAX, maxR = 0, minC = MAX, maxC = 0
  for (let r = 0; r < MAX; r++)
    for (let c = 0; c < MAX; c++)
      if (grid[r][c] !== null) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c) }

  const norm = placed.map(p => ({ ...p, row: p.row - minR, col: p.col - minC }))
  const starts = [...new Set(norm.map(p => `${p.row}-${p.col}`))].map(k => {
    const [r, c] = k.split("-").map(Number)
    return { r, c, key: k }
  }).sort((a, b) => a.r !== b.r ? a.r - b.r : a.c - b.c)

  const numMap = new Map<string, number>()
  let n = 1
  for (const s of starts) numMap.set(s.key, n++)
  const final = norm.map(p => ({ ...p, number: numMap.get(`${p.row}-${p.col}`) ?? p.number }))

  return { placements: final, rows: maxR - minR + 1, cols: maxC - minC + 1 }
}

function canPlace(g: (string | null)[][], w: string, dir: "across" | "down", sr: number, sc: number, max: number): boolean {
  let crosses = 0
  for (let i = 0; i < w.length; i++) {
    const r = dir === "down" ? sr + i : sr
    const c = dir === "across" ? sc + i : sc
    if (r < 0 || r >= max || c < 0 || c >= max) return false
    const ex = g[r][c]
    if (ex !== null) {
      if (ex !== w[i]) return false
      crosses++
    } else {
      if (dir === "across") {
        if (r > 0 && g[r - 1][c] !== null) return false
        if (r < max - 1 && g[r + 1][c] !== null) return false
      } else {
        if (c > 0 && g[r][c - 1] !== null) return false
        if (c < max - 1 && g[r][c + 1] !== null) return false
      }
    }
  }
  if (crosses === 0 || crosses === w.length) return false
  if (dir === "across") {
    if (sc > 0 && g[sr][sc - 1] !== null) return false
    if (sc + w.length < max && g[sr][sc + w.length] !== null) return false
  } else {
    if (sr > 0 && g[sr - 1][sc] !== null) return false
    if (sr + w.length < max && g[sr + w.length][sc] !== null) return false
  }
  return true
}

function crossings(g: (string | null)[][], w: string, dir: "across" | "down", sr: number, sc: number, max: number): number {
  let n = 0
  for (let i = 0; i < w.length; i++) {
    const r = dir === "down" ? sr + i : sr
    const c = dir === "across" ? sc + i : sc
    if (r >= 0 && r < max && c >= 0 && c < max && g[r][c] === w[i]) n++
  }
  return n
}

/* ------------------------------------------------------------------ */
/*  WORD LIST                                                          */
/* ------------------------------------------------------------------ */
const WORD_LIST = [
  { word: "PERSONALIZATION", clue: "Tailoring the learning experience to individual goals and prior knowledge." },
  { word: "INTERACTIVITY",   clue: "Active communication between students, tutors, and digital resources." },
  { word: "ACCESSIBILITY",   clue: "Ensuring educational resources are reachable regardless of location or limitations." },
  { word: "FACILITATOR",     clue: "Tutor's role of guiding and supporting the student rather than just delivering information." },
  { word: "FLEXIBILITY",     clue: "The environment's capacity to adapt to different learning styles, times, and needs." },
  { word: "REGULATION",      clue: "Cognitive process where students monitor and control their own behaviors for academic goals." },
  { word: "ECOMMERCE",       clue: "Learning environment modeled after digital marketplace business transactions." },
  { word: "PHYSICAL",        clue: "Traditional face-to-face setting where interaction occurs in a specific location." },
  { word: "INFORMAL",        clue: "Learning occurring outside institutional structures, through daily life and work." },
  { word: "FEEDBACK",        clue: "Providing timely and constructive evaluation to improve student performance." },
  { word: "AUTONOMY",        clue: "Student's capacity to take charge of their own learning process." },
  { word: "DESIGNER",        clue: "Tutor's role responsible for creating and organizing the learning space." },
  { word: "VIRTUAL",         clue: "A digital space using technology to facilitate learning without physical presence." },
  { word: "CONTEXT",         clue: "Professional field component providing real-world scenarios for academic success." },
  { word: "MODEL",           clue: "Structural framework where success is shared between student, tutor, and professional field." },
]

/* ------------------------------------------------------------------ */
/*  COMPUTED LAYOUT                                                    */
/* ------------------------------------------------------------------ */
const LAYOUT = solveCrossword(WORD_LIST)

function buildGrid(placements: PlacedWord[], rows: number, cols: number): CellData[][] {
  const grid: CellData[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ letter: "", isBlack: true, number: null, acrossIdx: null, downIdx: null }))
  )
  placements.forEach((wp, idx) => {
    for (let i = 0; i < wp.word.length; i++) {
      const r = wp.direction === "down" ? wp.row + i : wp.row
      const c = wp.direction === "across" ? wp.col + i : wp.col
      if (r < rows && c < cols) {
        grid[r][c].letter = wp.word[i]
        grid[r][c].isBlack = false
        if (i === 0) grid[r][c].number = wp.number
        if (wp.direction === "across") grid[r][c].acrossIdx = idx
        else grid[r][c].downIdx = idx
      }
    }
  })
  return grid
}

const SOLUTION = buildGrid(LAYOUT.placements, LAYOUT.rows, LAYOUT.cols)
const TOTAL_CELLS = (() => {
  const s = new Set<string>()
  LAYOUT.placements.forEach(wp => {
    for (let i = 0; i < wp.word.length; i++) {
      const r = wp.direction === "down" ? wp.row + i : wp.row
      const c = wp.direction === "across" ? wp.col + i : wp.col
      s.add(`${r}-${c}`)
    }
  })
  return s.size
})()

/* ------------------------------------------------------------------ */
/*  REACT COMPONENT                                                    */
/* ------------------------------------------------------------------ */
export { CrosswordGame as CrosswordGrid }

function CrosswordGame() {
  const R = LAYOUT.rows
  const C = LAYOUT.cols

  const [userInput, setUserInput] = useState(() => Array.from({ length: R }, () => Array(C).fill("")))
  const [validation, setValidation] = useState<(null | "correct" | "incorrect")[][]>(() => Array.from({ length: R }, () => Array(C).fill(null)))
  const [selectedClue, setSelectedClue] = useState<number | null>(null)
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [filledCount, setFilledCount] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: R }, () => Array(C).fill(null)))
  const clueRefs = useRef<(HTMLButtonElement | null)[]>(Array(LAYOUT.placements.length).fill(null))

  // Track filled cells for progress
  useEffect(() => {
    let count = 0
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++)
        if (!SOLUTION[r][c].isBlack && userInput[r][c]) count++
    setFilledCount(count)
  }, [userInput, R, C])

  const handleInput = useCallback((row: number, col: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1)
    setUserInput(prev => { const n = prev.map(r => [...r]); n[row][col] = char; return n })
    setValidation(prev => { const n = prev.map(r => [...r]); n[row][col] = null; return n })

    if (char) {
      const cell = SOLUTION[row][col]
      const isAcross = selectedClue !== null && LAYOUT.placements[selectedClue]?.direction === "across"
      if (isAcross || (cell.acrossIdx !== null && cell.downIdx === null)) {
        const nc = col + 1
        if (nc < C && !SOLUTION[row][nc].isBlack) inputRefs.current[row]?.[nc]?.focus()
      } else {
        const nr = row + 1
        if (nr < R && !SOLUTION[nr][col].isBlack) inputRefs.current[nr]?.[col]?.focus()
      }
    }
  }, [selectedClue, R, C])

  const handleKeyDown = useCallback((row: number, col: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !userInput[row][col]) {
      const isAcross = selectedClue !== null && LAYOUT.placements[selectedClue]?.direction === "across"
      if (isAcross || (SOLUTION[row][col].acrossIdx !== null && SOLUTION[row][col].downIdx === null)) {
        const pc = col - 1
        if (pc >= 0 && !SOLUTION[row][pc].isBlack) inputRefs.current[row]?.[pc]?.focus()
      } else {
        const pr = row - 1
        if (pr >= 0 && !SOLUTION[pr][col].isBlack) inputRefs.current[pr]?.[col]?.focus()
      }
    }
  }, [userInput, selectedClue])

  const verify = useCallback(() => {
    let correct = 0
    const nv: (null | "correct" | "incorrect")[][] = Array.from({ length: R }, () => Array(C).fill(null))
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++)
        if (!SOLUTION[r][c].isBlack) {
          if (userInput[r][c] === SOLUTION[r][c].letter) { nv[r][c] = "correct"; correct++ }
          else if (userInput[r][c]) nv[r][c] = "incorrect"
        }
    setValidation(nv)
    setScore({ correct, total: TOTAL_CELLS })
    if (correct === TOTAL_CELLS) {
      setIsComplete(true)
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } })
      setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { x: 0.2, y: 0.5 } }), 400)
      setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { x: 0.8, y: 0.5 } }), 800)
    }
  }, [userInput, R, C])

  const reset = useCallback(() => {
    setUserInput(Array.from({ length: R }, () => Array(C).fill("")))
    setValidation(Array.from({ length: R }, () => Array(C).fill(null)))
    setScore(null); setIsComplete(false); setSelectedClue(null)
  }, [R, C])

  const revealAll = useCallback(() => {
    const ni = Array.from({ length: R }, () => Array(C).fill(""))
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (!SOLUTION[r][c].isBlack) ni[r][c] = SOLUTION[r][c].letter
    setUserInput(ni)
    setValidation(Array.from({ length: R }, () => Array(C).fill(null)))
    setScore(null)
  }, [R, C])

  const revealWord = useCallback(() => {
    if (selectedClue === null) return
    const wp = LAYOUT.placements[selectedClue]
    setUserInput(prev => {
      const n = prev.map(r => [...r])
      for (let i = 0; i < wp.word.length; i++) {
        const r = wp.direction === "down" ? wp.row + i : wp.row
        const c = wp.direction === "across" ? wp.col + i : wp.col
        n[r][c] = wp.word[i]
      }
      return n
    })
    setShowHint(false)
  }, [selectedClue])

  const highlighted = useMemo(() => {
    if (selectedClue === null) return new Set<string>()
    const s = new Set<string>()
    const wp = LAYOUT.placements[selectedClue]
    for (let i = 0; i < wp.word.length; i++) {
      const r = wp.direction === "down" ? wp.row + i : wp.row
      const c = wp.direction === "across" ? wp.col + i : wp.col
      s.add(`${r}-${c}`)
    }
    return s
  }, [selectedClue])

  const acrossClues = useMemo(() =>
    LAYOUT.placements.map((w, i) => ({ ...w, idx: i })).filter(w => w.direction === "across").sort((a, b) => a.number - b.number),
  [])
  const downClues = useMemo(() =>
    LAYOUT.placements.map((w, i) => ({ ...w, idx: i })).filter(w => w.direction === "down").sort((a, b) => a.number - b.number),
  [])

  const progressPercent = Math.round((filledCount / TOTAL_CELLS) * 100)

  return (
    <div className="flex flex-col gap-8">
      {/* Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Progress</span>
          <span className="font-semibold text-primary">{filledCount}/{TOTAL_CELLS} cells filled ({progressPercent}%)</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <button
          onClick={verify}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
        >
          Verify Answers
        </button>
        <button
          onClick={() => setShowHint(!showHint)}
          disabled={selectedClue === null}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Reveal Word
        </button>
        <button
          onClick={revealAll}
          className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-95"
        >
          Reveal All
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-95"
        >
          Reset
        </button>
        {score && !isComplete && (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-foreground">
              {score.correct}/{score.total} correct
            </span>
          </div>
        )}
      </div>

      {/* Hint confirmation */}
      {showHint && selectedClue !== null && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
          <p className="text-sm text-foreground">
            Reveal <strong>{LAYOUT.placements[selectedClue].number} {LAYOUT.placements[selectedClue].direction}</strong>?
          </p>
          <button onClick={revealWord} className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
            Yes, reveal
          </button>
          <button onClick={() => setShowHint(false)} className="rounded-md border border-border px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
            Cancel
          </button>
        </div>
      )}

      {/* Success banner */}
      {isComplete && (
        <div className="rounded-xl bg-accent/10 border-2 border-accent/30 p-6 text-center shadow-sm">
          <p className="text-2xl font-bold text-foreground">Congratulations!</p>
          <p className="text-sm text-muted-foreground mt-1">You completed the crossword perfectly!</p>
        </div>
      )}

      {/* Grid + Clues */}
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        {/* Grid */}
        <div className="w-full overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-sm lg:w-auto lg:p-4">
          <div
            className="mx-auto inline-grid gap-0 rounded-lg overflow-hidden border border-foreground/20"
            style={{ gridTemplateColumns: `repeat(${C}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: R }).map((_, r) =>
              Array.from({ length: C }).map((_, c) => {
                const cell = SOLUTION[r][c]
                if (cell.isBlack) return <div key={`${r}-${c}`} className="h-9 w-9 bg-card md:h-11 md:w-11" />

                const key = `${r}-${c}`
                const hl = highlighted.has(key)
                const v = validation[r][c]
                let bg = "bg-card"
                if (v === "correct") bg = "bg-emerald-100"
                else if (v === "incorrect") bg = "bg-red-100"
                else if (hl) bg = "bg-primary/10"

                return (
                  <div key={key} className={`relative h-9 w-9 border border-foreground/12 transition-colors duration-200 md:h-11 md:w-11 ${bg}`}>
                    {cell.number && (
                      <span className="absolute left-0.5 top-0 text-[9px] font-bold text-primary leading-none md:text-[11px] select-none">
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={el => { inputRefs.current[r][c] = el }}
                      type="text"
                      maxLength={1}
                      value={userInput[r][c]}
                      aria-label={`Cell row ${r + 1} column ${c + 1}`}
                      className="absolute inset-0 h-full w-full bg-transparent text-center text-sm font-bold text-foreground outline-none caret-primary focus:ring-2 focus:ring-primary/40 focus:ring-inset focus:bg-primary/5 md:text-base uppercase transition-all"
                      onChange={e => handleInput(r, c, e.target.value)}
                      onKeyDown={e => handleKeyDown(r, c, e)}
                      onFocus={() => {
                        const ai = cell.acrossIdx, di = cell.downIdx
                        if (selectedClue !== null) {
                          const cur = LAYOUT.placements[selectedClue]
                          if (cur.direction === "across" && ai !== null && ai === selectedClue) return
                          if (cur.direction === "down" && di !== null && di === selectedClue) return
                        }
                        if (ai !== null) setSelectedClue(ai)
                        else if (di !== null) setSelectedClue(di)
                      }}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Clues */}
        <div className="flex w-full flex-col gap-6 lg:w-[420px] shrink-0">
          {/* Across */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                {"→"}
              </span>
              Across
            </h2>
            <ol className="flex flex-col gap-1">
              {acrossClues.map(w => (
                <li key={w.number}>
                  <button
                    ref={el => { clueRefs.current[w.idx] = el }}
                    onClick={() => { setSelectedClue(w.idx); inputRefs.current[w.row]?.[w.col]?.focus() }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm leading-relaxed transition-all ${
                      selectedClue === w.idx
                        ? "bg-primary/10 text-foreground font-medium shadow-sm ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="font-bold text-primary mr-1.5">{w.number}.</span>
                    {w.clue}
                    <span className="ml-1 text-xs text-muted-foreground">({w.word.length})</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {/* Down */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                {"↓"}
              </span>
              Down
            </h2>
            <ol className="flex flex-col gap-1">
              {downClues.map(w => (
                <li key={w.number}>
                  <button
                    ref={el => { clueRefs.current[w.idx] = el }}
                    onClick={() => { setSelectedClue(w.idx); inputRefs.current[w.row]?.[w.col]?.focus() }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm leading-relaxed transition-all ${
                      selectedClue === w.idx
                        ? "bg-primary/10 text-foreground font-medium shadow-sm ring-1 ring-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="font-bold text-primary mr-1.5">{w.number}.</span>
                    {w.clue}
                    <span className="ml-1 text-xs text-muted-foreground">({w.word.length})</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
