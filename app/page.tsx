import { CrosswordGrid } from "@/components/crossword-grid"
import { ImageGallery } from "@/components/image-gallery"
import Image from "next/image"

export default function Home() {
  return (
    <main
      className="min-h-screen relative"
      style={{ backgroundImage: "url(/images/bg-pattern.png)", backgroundSize: "600px", backgroundRepeat: "repeat" }}
    >
      {/* Overlay to soften the pattern */}
      <div className="absolute inset-0 bg-background/90" />

      <div className="relative z-10">
        {/* Hero Section */}
        <header className="relative overflow-hidden bg-primary/5 border-b border-border">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 md:flex-row md:gap-10 md:px-8 md:py-14">
            <div className="flex flex-col gap-4 text-center md:text-left md:flex-1">
              <span className="inline-block self-center rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-primary uppercase md:self-start">
                Topic 3
              </span>
              <h1 className="text-3xl font-bold text-foreground md:text-5xl text-balance leading-tight font-sans">
                Learning Environments
              </h1>
              <p className="text-base text-muted-foreground md:text-lg text-pretty leading-relaxed max-w-xl">
                Test your knowledge about pedagogical learning environments, educational roles, and virtual/physical learning spaces with this interactive crossword puzzle.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary">15 Words</span>
                <span className="rounded-md bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Interactive</span>
                <span className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">Auto-verify</span>
              </div>
            </div>
            <div className="relative w-64 h-52 md:w-80 md:h-64 shrink-0">
              <Image
                src="/images/hero-learning.png"
                alt="Illustration of online learning showing a student on a computer screen and a girl reading a book"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
          </div>
        </header>

        {/* Crossword Section */}
        <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
          <CrosswordGrid />
        </section>

        {/* Image Gallery Section */}
        <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
          <ImageGallery />
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-card/50 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Crossword Puzzle - Topic 3: Learning Environments
          </p>
        </footer>
      </div>
    </main>
  )
}
