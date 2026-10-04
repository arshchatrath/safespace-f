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
    <section id="contributors" aria-labelledby="team-heading" className="scroll-mt-16 bg-sage-soft/30 py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <Reveal className="grid gap-6 lg:grid-cols-12">
          <p className="eyebrow lg:col-span-4">(04) The team</p>
          <h2 id="team-heading" className="font-display text-4xl leading-[1.05] tracking-[-0.02em] text-ink sm:text-5xl lg:col-span-8">
            Built by people who&rsquo;d also
            <br className="hidden sm:block" /> like to <span className="italic text-pine">stress less.</span>
          </h2>
        </Reveal>

        <ul className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:mt-12 lg:grid-cols-4 lg:gap-y-10">
          {contributors.map((contributor, i) => (
            <Reveal as="li" key={contributor.name} delay={(i % 4) * 70} className="flex h-full">
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
    <article className="group flex h-full w-full flex-col rounded-xl border border-ink/10 bg-paper/70 p-2 transition-colors hover:bg-card">
      <div
        className={`overflow-hidden rounded-lg bg-muted transition-transform duration-500 ease-soft ${tilt} motion-safe:group-hover:-translate-y-1`}
      >
        <img
          src={`/${contributor.img}`}
          alt={contributor.name}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover object-[center_24%] transition-transform duration-700 ease-soft motion-safe:group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex flex-1 flex-col px-2 pb-2 pt-3">
        <div className="flex min-h-12 items-start justify-between gap-2">
          <h3 className="font-display text-base leading-tight text-ink sm:text-lg">{contributor.name}</h3>
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
        <ul className="mt-2 flex min-h-[3.25rem] content-start flex-wrap gap-1.5" aria-label={`${contributor.name} contributions`}>
          {contributor.expertise.map((keyword, index) => (
            <li
              key={keyword}
              className={`rounded-full px-2 py-1 text-[0.65rem] font-medium leading-tight sm:text-xs ${
                index % 3 === 0 ? "bg-sage-soft text-pine-deep" : index % 3 === 1 ? "bg-clay-soft text-clay-deep" : "bg-ochre-soft text-ochre-deep"
              }`}
            >
              {keyword}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
