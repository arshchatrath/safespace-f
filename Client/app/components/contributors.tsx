"use client"

import { Github, Linkedin } from "lucide-react"
import Reveal from "./Reveal"

interface Contributor {
  name: string
  img: string
  expertise: string[]
  github?: string
  linkedin?: string
}

const contributors: Contributor[] = [
  {
    name: "Dr. Rajendra Kumar Roul",
    img: "sir.jpg",
    expertise: ["Machine Learning", "DSA", "Computer Vision"],
  },
  {
    name: "Arsh Chatrath",
    github: "arshchatrath",
    linkedin: "arshchatrath",
    img: "Arsh.jpg",
    expertise: ["Machine Learning", "NLP", "Computer Vision"],
  },
  {
    name: "Kabir Oberoi",
    github: "kabiroberoi",
    linkedin: "kabir-oberoi-2a8480299",
    img: "Kabir.png",
    expertise: ["Edge Computing", "IoT", "Distributed Systems"],
  },
  {
    name: "Devansh",
    github: "devanshkumar",
    linkedin: "devansh-kumar",
    img: "Devansh.png",
    expertise: ["DSP", "Audio Processing", "Algorithm Design"],
  },
  {
    name: "Durvish",
    github: "durvishkhurana",
    linkedin: "durvishkhurana",
    img: "durvish.png",
    expertise: ["Voice Analysis", "Audio ML", "Speech Recognition"],
  },
  {
    name: "Lakshita",
    github: "lakshitasharma",
    linkedin: "lakshita-sharma",
    img: "lakshita.jpg",
    expertise: ["User Experience", "Interface Design", "Design Systems"],
  },
  {
    name: "Khushpreet",
    github: "khushpreet",
    linkedin: "khushpreet",
    img: "khushpreet.jpg",
    expertise: ["React", "Node.js", "System Architecture"],
  },
  {
    name: "Samya Aggarwal",
    github: "Samya-Agg",
    linkedin: "samya-aggarwal-5729182a6",
    img: "samya.png",
    expertise: ["Django", "FastAPI", "Research"],
  },
]

export default function ContributorsSection() {
  return (
    <section id="contributors" aria-labelledby="team-heading" className="scroll-mt-16 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal className="grid gap-6 lg:grid-cols-12">
          <p className="eyebrow lg:col-span-4">(04) The team</p>
          <h2 id="team-heading" className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl lg:col-span-8">
            Built by people who&rsquo;d also
            <br className="hidden sm:block" /> like to <span className="italic text-pine">stress less.</span>
          </h2>
        </Reveal>

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:mt-20 lg:grid-cols-4 lg:gap-y-14">
          {contributors.map((contributor, i) => (
            <Reveal as="li" key={contributor.name} delay={(i % 4) * 70} className={i % 2 === 1 ? "lg:mt-10" : ""}>
              <ContributorCard contributor={contributor} tilt={i % 2 === 0 ? "motion-safe:group-hover:-rotate-[1.5deg]" : "motion-safe:group-hover:rotate-[1.5deg]"} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ContributorCard({ contributor, tilt }: { contributor: Contributor; tilt: string }) {
  return (
    <article className="group">
      <div
        className={`overflow-hidden rounded-2xl bg-muted transition-transform duration-500 ease-soft ${tilt} motion-safe:group-hover:-translate-y-1`}
      >
        <img
          src={`/${contributor.img}`}
          alt={contributor.name}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-soft motion-safe:group-hover:scale-[1.04]"
        />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight text-ink sm:text-xl">{contributor.name}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {contributor.expertise.join(" · ")}
          </p>
        </div>
        {(contributor.linkedin || contributor.github) && (
          <div className="flex shrink-0 gap-0.5">
            {contributor.linkedin && (
              <a
                href={`https://linkedin.com/in/${contributor.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${contributor.name} on LinkedIn (opens in a new tab)`}
                className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {contributor.github && (
              <a
                href={`https://github.com/${contributor.github}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${contributor.name} on GitHub (opens in a new tab)`}
                className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
