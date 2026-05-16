"use client"

import { useCallback, useRef, useState, useMemo } from "react"

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
/*  CROSSWORD SOLVER – greedy placement with verified intersections    */
/* ------------------------------------------------------------------ */
function solveCrossword(
  wordList: { word: string; clue: string }[]
): { placements: PlacedWord[]; rows: number; cols: number } {
  const MAX = 25
  const grid: (string | null)[][] = Array.from({ length: MAX }, () => Array(MAX).fill(null))
  const placed: PlacedWord[] = []
  let numCounter = 1

  const sorted = [...wordList].sort((a, b) => b.word.length - a.word.length)

  // Place the first word across in the center
  const first = sorted[0]
  const sr = Math.floor(MAX / 2)
  const sc = Math.floor((MAX - first.word.length) / 2)
  for (let i = 0; i < first.word.length; i++) grid[sr][sc + i] = first.word[i]
  placed.push({ ...first, direction: "across", row: sr, col: sc, number: numCounter++ })

  // Place remaining words
  for (let wi = 1; wi < sorted.length; wi++) {
    const w = sorted[wi]
    let best: PlacedWord | null = null
    let bestScore = -1

    for (let li = 0; li < w.word.length; li++) {
      const ch = w.word[li]
      for (let r = 0; r < MAX; r++) {
        for (let c = 0; c < MAX; c++) {
          if (grid[r][c] !== ch) continue

          // Try DOWN
          const dr = r - li
          if (dr >= 0 && dr + w.word.length <= MAX && canPlace(grid, w.word, "down", dr, c, MAX)) {
            const s = crossings(grid, w.word, "down", dr, c, MAX)
            if (s > bestScore) { bestScore = s; best = { ...w, direction: "down", row: dr, col: c, number: numCounter } }
          }

          // Try ACROSS
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

  // Bounding box
  let minR = MAX, maxR = 0, minC = MAX, maxC = 0
  for (let r = 0; r < MAX; r++)
    for (let c = 0; c < MAX; c++)
      if (grid[r][c] !== null) { minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c) }

  // Normalize + renumber in reading order
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
      // No parallel adjacency
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
  // No letter directly before/after
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
/*  WORD LIST — Topic 3: Learning Environments                        */
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
/*  COMPUTED LAYOUT (runs once at module level)                        */
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
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: R }, () => Array(C).fill(null)))

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
    setIsComplete(correct === TOTAL_CELLS)
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-primary md:text-3xl text-balance text-center font-sans">
          Crossword Puzzle - Topic 3: Learning Environments
        </h1>
        <p className="text-sm text-muted-foreground text-center text-pretty">
          Complete the crossword with key concepts about learning environments
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={verify} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
          Verify
        </button>
        <button onClick={revealAll} className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
          Reveal All
        </button>
        <button onClick={reset} className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
          Reset
        </button>
        {score && (
          <span className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground">
            {score.correct}/{score.total} correct letters
          </span>
        )}
      </div>

      {isComplete && (
        <div className="rounded-lg bg-accent/10 border border-accent/30 p-4 text-center">
          <p className="text-lg font-bold text-foreground">Crossword completed correctly!</p>
        </div>
      )}

      {/* Grid + Clues */}
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        {/* Grid */}
        <div className="w-full overflow-x-auto lg:w-auto">
          <div
            className="mx-auto inline-grid gap-0 border border-foreground/20 rounded-md"
            style={{ gridTemplateColumns: `repeat(${C}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: R }).map((_, r) =>
              Array.from({ length: C }).map((_, c) => {
                const cell = SOLUTION[r][c]
                if (cell.isBlack) return <div key={`${r}-${c}`} className="h-8 w-8 bg-foreground/10 md:h-10 md:w-10" />

                const key = `${r}-${c}`
                const hl = highlighted.has(key)
                const v = validation[r][c]
                let bg = "bg-card"
                if (v === "correct") bg = "bg-accent/20"
                else if (v === "incorrect") bg = "bg-destructive/15"
                else if (hl) bg = "bg-primary/10"

                return (
                  <div key={key} className={`relative h-8 w-8 border border-foreground/15 md:h-10 md:w-10 ${bg}`}>
                    {cell.number && (
                      <span className="absolute left-0.5 top-0 text-[8px] font-bold text-primary leading-none md:text-[10px]">
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={el => { inputRefs.current[r][c] = el }}
                      type="text"
                      maxLength={1}
                      value={userInput[r][c]}
                      aria-label={`Cell row ${r + 1} column ${c + 1}`}
                      className="absolute inset-0 h-full w-full bg-transparent text-center text-sm font-bold text-foreground outline-none caret-primary focus:ring-2 focus:ring-primary/50 focus:ring-inset md:text-base uppercase"
                      onChange={e => handleInput(r, c, e.target.value)}
                      onKeyDown={e => handleKeyDown(r, c, e)}
                      onFocus={() => {
                        const ai = cell.acrossIdx, di = cell.downIdx
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
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:w-[420px] lg:grid-cols-1 shrink-0">
          <div>
            <h2 className="mb-3 text-lg font-bold text-primary">Across</h2>
            <ol className="flex flex-col gap-1.5">
              {acrossClues.map(w => (
                <li key={w.number}>
                  <button
                    onClick={() => { setSelectedClue(w.idx); inputRefs.current[w.row]?.[w.col]?.focus() }}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selectedClue === w.idx ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="font-bold text-primary mr-2">{w.number}.</span>
                    {w.clue} <span className="text-xs text-muted-foreground">({w.word.length})</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-bold text-primary">Down</h2>
            <ol className="flex flex-col gap-1.5">
              {downClues.map(w => (
                <li key={w.number}>
                  <button
                    onClick={() => { setSelectedClue(w.idx); inputRefs.current[w.row]?.[w.col]?.focus() }}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      selectedClue === w.idx ? "bg-primary/10 text-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="font-bold text-primary mr-2">{w.number}.</span>
                    {w.clue} <span className="text-xs text-muted-foreground">({w.word.length})</span>
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
