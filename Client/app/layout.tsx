import type React from "react"
import type { Metadata } from "next"
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "./components/Navbar"

const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-display",
})

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "SafeSpace AI - Mental Health Empowered by AI",
  description: "Detect stress through voice, sensors, and psychology with SafeSpace AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <script async={false} src="https://cdn.botpress.cloud/webchat/v3.0/inject.js"></script>
      <script async={false} src="https://files.bpcontent.cloud/2025/07/11/16/20250711160316-693TLH0U.js"></script>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
