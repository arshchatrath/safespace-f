"use client"

import Link from "next/link"
import { ArrowRight, Github } from "lucide-react"
import { Wordmark } from "./Logo"

export default function Footer() {
  return (
    <footer className="grain overflow-hidden bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8 lg:px-10 lg:pt-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="font-display text-[clamp(2.4rem,6vw,4.75rem)] leading-[1] tracking-[-0.03em]">
              Take a breath.
              <br />
              <span className="italic text-sage">Then take the check.</span>
            </p>
            <Link href="/check" className="btn group mt-10 bg-paper text-ink hover:bg-sage-soft">
              Start the check
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3 lg:col-start-10">
            <ul className="space-y-3 text-paper/75">
              <li>
                <Link href="/#how-it-works" className="link-draw hover:text-paper">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/stress-buster" className="link-draw hover:text-paper">
                  StressBuster games
                </Link>
              </li>
              <li>
                <Link href="/#contributors" className="link-draw hover:text-paper">
                  Team
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/arshchatrath/SafeSpace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-draw inline-flex items-center gap-2 hover:text-paper"
                >
                  <Github className="h-4 w-4" aria-hidden="true" />
                  GitHub repository
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-paper/15 pt-8 text-sm text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark className="text-paper [&_svg]:text-sage" />
          <p className="max-w-md sm:text-right">
            A research prototype, not a medical diagnosis. Made by the SafeSpace AI team.
          </p>
        </div>
      </div>
    </footer>
  )
}
