import { CrosswordGrid } from "@/components/crossword-grid"

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <CrosswordGrid />
      </div>
    </main>
  )
}
