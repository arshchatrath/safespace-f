"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, Github, ArrowUpRight } from "lucide-react"
import { Wordmark } from "./Logo"

const GITHUB_URL = "https://github.com/arshchatrath/safespace-f"

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/stress-buster", label: "StressBuster" },
  { href: "/#contributors", label: "Team" },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ${
        scrolled || isOpen ? "border-b border-ink/10 bg-paper/90 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label="SafeSpace home" className="rounded-md text-ink">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="link-draw text-[0.95rem] font-medium text-ink/75 transition-colors hover:text-ink aria-[current=page]:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[0.95rem] font-medium text-ink/75 transition-colors hover:text-ink"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <Link href="/check" className="btn-primary !min-h-[40px] !px-5 !py-2 text-sm">
            Start the check
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {isOpen && (
        <div id="mobile-menu" className="border-t border-ink/10 bg-paper md:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-5 pb-6 pt-2 sm:px-8">
            {links.map((link, i) => (
              <li key={link.href} className="border-b border-ink/10">
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-baseline justify-between py-4 font-display text-2xl text-ink"
                >
                  {link.label}
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </Link>
              </li>
            ))}
            <li className="border-b border-ink/10">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between py-4 font-display text-2xl text-ink"
              >
                GitHub
                <ArrowUpRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
            <li className="pt-6">
              <Link href="/check" onClick={() => setIsOpen(false)} className="btn-primary w-full">
                Start the check
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
