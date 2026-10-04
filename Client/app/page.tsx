"use client"

import { useRef } from "react"
import HeroSection from "./components/HeroSection"
import AboutSection from "./components/AboutSection"
import ContributorsSection from "./components/contributors"
import Footer from "./components/Footer"

export default function Home() {
  const infoRef = useRef<HTMLDivElement>(null)

  const scrollToInfo = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    infoRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })
  }

  return (
    <>
      <main id="main" className="min-h-screen">
        <HeroSection onLearnMore={scrollToInfo} />
        <div ref={infoRef} className="scroll-mt-16">
          <AboutSection />
        </div>
        <ContributorsSection />
      </main>
      <Footer />
    </>
  )
}
