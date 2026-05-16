import Image from "next/image"

const IMAGES = [
  {
    src: "/images/classroom.png",
    alt: "Teacher in a physical classroom interacting with students face to face",
    label: "Physical Environment",
    word: "PHYSICAL",
  },
  {
    src: "/images/virtual.jpg",
    alt: "Virtual reality and digital screens representing virtual learning spaces",
    label: "Virtual Learning",
    word: "VIRTUAL",
  },
  {
    src: "/images/facilitator.jpg",
    alt: "Teacher guiding and facilitating student learning collaboratively",
    label: "Facilitator Role",
    word: "FACILITATOR",
  },
  {
    src: "/images/online-education.png",
    alt: "Person interacting with online education platform with books and graduation cap",
    label: "Online Education",
    word: "AUTONOMY",
  },
  {
    src: "/images/ecommerce.png",
    alt: "Shopping cart with packages on a laptop representing ecommerce learning environment",
    label: "E-Commerce Context",
    word: "ECOMMERCE",
  },
  {
    src: "/images/autonomy.jpg",
    alt: "Student studying independently at home representing self-directed learning",
    label: "Student Autonomy",
    word: "PERSONALIZATION",
  },
]

export function ImageGallery() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-foreground md:text-2xl font-sans">
          Visual Hints
        </h2>
        <p className="text-sm text-muted-foreground">
          These images relate to some of the crossword answers. Can you match them?
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {IMAGES.map((img) => (
          <div
            key={img.word}
            className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="absolute bottom-2 left-2 right-2 rounded-md bg-primary/90 px-2 py-1 text-center text-xs font-semibold text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {img.label}
              </span>
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground text-center truncate">
                {img.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
