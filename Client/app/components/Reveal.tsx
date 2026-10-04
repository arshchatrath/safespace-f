"use client"

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react"

interface RevealProps {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
}

// Fades content up once when it scrolls into view. Reduced-motion users get it immediately (see globals.css).
export default function Reveal({ children, as: Tag = "div", className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-visible")
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible")
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  )
}
