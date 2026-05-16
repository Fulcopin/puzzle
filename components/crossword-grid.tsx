"use client"

import { useCallback, useRef, useState } from "react"

// ---------- TYPES ----------
interface WordPlacement {
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

// ---------- DATASET (Tema 3) ----------
const WORDS: WordPlacement[] = [
  // ACROSS
  { word: "PHYSICAL", clue: "Entorno presencial tradicional donde la interacci\u00f3n ocurre en un lugar f\u00edsico espec\u00edfico.", direction: "across", row: 0, col: 0, number: 1 },
  { word: "INFORMAL", clue: "Aprendizaje que ocurre fuera de estructuras institucionales, a trav\u00e9s de la vida diaria y el trabajo.", direction: "across", row: 2, col: 4, number: 3 },
  { word: "FLEXIBILITY", clue: "Capacidad del entorno para adaptarse a diferentes estilos de aprendizaje, tiempos y necesidades.", direction: "across", row: 4, col: 1, number: 5 },
  { word: "INTERACTIVITY", clue: "Comunicaci\u00f3n activa entre estudiantes, tutores y recursos digitales.", direction: "across", row: 6, col: 0, number: 7 },
  { word: "ACCESSIBILITY", clue: "Garantizar que los recursos educativos sean alcanzables sin importar ubicaci\u00f3n o limitaciones.", direction: "across", row: 8, col: 0, number: 9 },
  { word: "PERSONALIZATION", clue: "Adaptar la experiencia de aprendizaje a metas individuales y conocimiento previo.", direction: "across", row: 10, col: 0, number: 11 },
  { word: "AUTONOMY", clue: "Capacidad del estudiante para hacerse cargo de su propio proceso de aprendizaje.", direction: "across", row: 12, col: 3, number: 13 },
  { word: "FEEDBACK", clue: "Proveer evaluaci\u00f3n oportuna y constructiva para mejorar el rendimiento.", direction: "across", row: 14, col: 4, number: 15 },
  // DOWN
  { word: "VIRTUAL", clue: "Espacio digital que usa tecnolog\u00eda para facilitar el aprendizaje sin presencia f\u00edsica.", direction: "down", row: 0, col: 4, number: 2 },
  { word: "MODEL", clue: "Marco estructural donde el \u00e9xito es compartido entre estudiante, tutor y campo profesional.", direction: "down", row: 2, col: 8, number: 4 },
  { word: "REGULATION", clue: "Proceso cognitivo donde los estudiantes monitorean y controlan sus comportamientos acad\u00e9micos.", direction: "down", row: 4, col: 2, number: 6 },
  { word: "FACILITATOR", clue: "Rol del tutor de guiar y apoyar al estudiante en lugar de solo entregar informaci\u00f3n.", direction: "down", row: 4, col: 6, number: 8 },
  { word: "DESIGNER", clue: "Rol del tutor responsable de crear y organizar el espacio de aprendizaje.", direction: "down", row: 6, col: 10, number: 10 },
  { word: "CONTEXT", clue: "Componente del campo profesional que proporciona escenarios del mundo real.", direction: "down", row: 8, col: 3, number: 12 },
  { word: "ECOMMERCE", clue: "Entorno de aprendizaje basado en transacciones de negocio en mercados digitales.", direction: "down", row: 6, col: 0, number: 14 },
]

// ---------- GRID BUILDER ----------
const ROWS = 16
const COLS = 15

function buildGrid(): CellData[][] {
  const grid: CellData[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      letter: "",
      isBlack: true,
      number: null,
      acrossIdx: null,
      downIdx: null,
    }))
  )

  WORDS.forEach((wp, idx) => {
    for (let i = 0; i < wp.word.length; i++) {
      const r = wp.direction === "down" ? wp.row + i : wp.row
      const c = wp.direction === "across" ? wp.col + i : wp.col
      if (r < ROWS && c < COLS) {
        grid[r][c].letter = wp.word[i]
        grid[r][c].isBlack = false
        if (i === 0) {
          grid[r][c].number = wp.number
        }
        if (wp.direction === "across") {
          grid[r][c].acrossIdx = idx
        } else {
          grid[r][c].downIdx = idx
        }
      }
    }
  })

  return grid
}

const SOLUTION_GRID = buildGrid()

// ---------- COMPONENT ----------
export function CrosswordGrid() {
  const [userInput, setUserInput] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  )
  const [validation, setValidation] = useState<(null | "correct" | "incorrect")[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  )
  const [selectedClue, setSelectedClue] = useState<number | null>(null)
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  )

  const totalLetters = WORDS.reduce((sum, w) => sum + w.word.length, 0)

  const handleInput = useCallback((row: number, col: number, value: string) => {
    const char = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1)
    setUserInput(prev => {
      const next = prev.map(r => [...r])
      next[row][col] = char
      return next
    })
    setValidation(prev => {
      const next = prev.map(r => [...r])
      next[row][col] = null
      return next
    })

    if (char) {
      // advance to next cell in the same word
      const cell = SOLUTION_GRID[row][col]
      if (cell.acrossIdx !== null && selectedClue !== null && WORDS[selectedClue]?.direction === "across") {
        const nextCol = col + 1
        if (nextCol < COLS && !SOLUTION_GRID[row][nextCol].isBlack) {
          inputRefs.current[row][nextCol]?.focus()
        }
      } else if (cell.downIdx !== null) {
        const nextRow = row + 1
        if (nextRow < ROWS && !SOLUTION_GRID[nextRow][col].isBlack) {
          inputRefs.current[nextRow][col]?.focus()
        }
      } else {
        // default: try across first
        const nextCol = col + 1
        if (nextCol < COLS && !SOLUTION_GRID[row][nextCol].isBlack) {
          inputRefs.current[row][nextCol]?.focus()
        }
      }
    }
  }, [selectedClue])

  const handleKeyDown = useCallback((row: number, col: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !userInput[row][col]) {
      // move back
      const cell = SOLUTION_GRID[row][col]
      if (cell.acrossIdx !== null) {
        const prevCol = col - 1
        if (prevCol >= 0 && !SOLUTION_GRID[row][prevCol].isBlack) {
          inputRefs.current[row][prevCol]?.focus()
        }
      } else if (cell.downIdx !== null) {
        const prevRow = row - 1
        if (prevRow >= 0 && !SOLUTION_GRID[prevRow][col].isBlack) {
          inputRefs.current[prevRow][col]?.focus()
        }
      }
    }
  }, [userInput])

  const verify = useCallback(() => {
    let correct = 0
    const newValidation: (null | "correct" | "incorrect")[][] =
      Array.from({ length: ROWS }, () => Array(COLS).fill(null))

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!SOLUTION_GRID[r][c].isBlack) {
          if (userInput[r][c] === SOLUTION_GRID[r][c].letter) {
            newValidation[r][c] = "correct"
            correct++
          } else if (userInput[r][c]) {
            newValidation[r][c] = "incorrect"
          }
        }
      }
    }

    setValidation(newValidation)
    setScore({ correct, total: totalLetters })
    setIsComplete(correct === totalLetters)
  }, [userInput, totalLetters])

  const reset = useCallback(() => {
    setUserInput(Array.from({ length: ROWS }, () => Array(COLS).fill("")))
    setValidation(Array.from({ length: ROWS }, () => Array(COLS).fill(null)))
    setScore(null)
    setIsComplete(false)
    setSelectedClue(null)
  }, [])

  const revealAll = useCallback(() => {
    const newInput = Array.from({ length: ROWS }, () => Array(COLS).fill(""))
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!SOLUTION_GRID[r][c].isBlack) {
          newInput[r][c] = SOLUTION_GRID[r][c].letter
        }
      }
    }
    setUserInput(newInput)
    setValidation(Array.from({ length: ROWS }, () => Array(COLS).fill(null)))
    setScore(null)
  }, [])

  const highlightCells = (wordIdx: number): Set<string> => {
    const cells = new Set<string>()
    const wp = WORDS[wordIdx]
    for (let i = 0; i < wp.word.length; i++) {
      const r = wp.direction === "down" ? wp.row + i : wp.row
      const c = wp.direction === "across" ? wp.col + i : wp.col
      cells.add(`${r}-${c}`)
    }
    return cells
  }

  const highlightedCells = selectedClue !== null ? highlightCells(selectedClue) : new Set<string>()

  const acrossClues = WORDS.filter(w => w.direction === "across").sort((a, b) => a.number - b.number)
  const downClues = WORDS.filter(w => w.direction === "down").sort((a, b) => a.number - b.number)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-primary md:text-3xl text-balance text-center">
          Crucigrama - Tema 3: Entornos de Aprendizaje
        </h1>
        <p className="text-sm text-muted-foreground text-center text-pretty">
          Completa el crucigrama con los conceptos clave sobre entornos de aprendizaje
        </p>
      </div>

      {/* Score + Actions Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={verify}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Verificar
        </button>
        <button
          onClick={revealAll}
          className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          Revelar
        </button>
        <button
          onClick={reset}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Reiniciar
        </button>
        {score && (
          <div className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground">
            {score.correct}/{score.total} letras correctas
          </div>
        )}
      </div>

      {isComplete && (
        <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-center">
          <p className="text-lg font-bold text-foreground">
            {"Crucigrama completado correctamente!"}
          </p>
        </div>
      )}

      {/* Grid + Clues */}
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        {/* Grid */}
        <div className="w-full overflow-x-auto lg:w-auto">
          <div
            className="mx-auto inline-grid gap-0 border border-foreground/20 rounded-md"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: ROWS }).map((_, r) =>
              Array.from({ length: COLS }).map((_, c) => {
                const cell = SOLUTION_GRID[r][c]
                if (cell.isBlack) {
                  return (
                    <div
                      key={`${r}-${c}`}
                      className="h-8 w-8 bg-foreground/10 md:h-9 md:w-9"
                    />
                  )
                }

                const cellKey = `${r}-${c}`
                const isHighlighted = highlightedCells.has(cellKey)
                const vState = validation[r][c]

                let bgClass = "bg-card"
                if (vState === "correct") bgClass = "bg-success/20"
                else if (vState === "incorrect") bgClass = "bg-destructive/15"
                else if (isHighlighted) bgClass = "bg-primary/10"

                return (
                  <div key={cellKey} className={`relative h-8 w-8 border border-foreground/15 md:h-9 md:w-9 ${bgClass}`}>
                    {cell.number && (
                      <span className="absolute left-0.5 top-0 text-[8px] font-bold text-primary leading-none md:text-[9px]">
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={el => { inputRefs.current[r][c] = el }}
                      type="text"
                      maxLength={1}
                      value={userInput[r][c]}
                      aria-label={`Celda fila ${r + 1} columna ${c + 1}`}
                      className="absolute inset-0 h-full w-full bg-transparent text-center text-sm font-bold text-foreground outline-none caret-primary focus:ring-2 focus:ring-primary/50 focus:ring-inset md:text-base uppercase"
                      onChange={e => handleInput(r, c, e.target.value)}
                      onKeyDown={e => handleKeyDown(r, c, e)}
                      onFocus={() => {
                        const acIdx = cell.acrossIdx
                        const dnIdx = cell.downIdx
                        if (acIdx !== null) setSelectedClue(acIdx)
                        else if (dnIdx !== null) setSelectedClue(dnIdx)
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
          {/* Across */}
          <div>
            <h2 className="mb-3 text-lg font-bold text-primary">Horizontales (Across)</h2>
            <ol className="flex flex-col gap-2">
              {acrossClues.map(w => {
                const idx = WORDS.indexOf(w)
                const isActive = selectedClue === idx
                return (
                  <li key={w.number}>
                    <button
                      onClick={() => {
                        setSelectedClue(idx)
                        inputRefs.current[w.row][w.col]?.focus()
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="font-bold text-primary mr-2">{w.number}.</span>
                      {w.clue}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Down */}
          <div>
            <h2 className="mb-3 text-lg font-bold text-primary">Verticales (Down)</h2>
            <ol className="flex flex-col gap-2">
              {downClues.map(w => {
                const idx = WORDS.indexOf(w)
                const isActive = selectedClue === idx
                return (
                  <li key={w.number}>
                    <button
                      onClick={() => {
                        setSelectedClue(idx)
                        inputRefs.current[w.row][w.col]?.focus()
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="font-bold text-primary mr-2">{w.number}.</span>
                      {w.clue}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
