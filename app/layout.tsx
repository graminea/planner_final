import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, DM_Serif_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _dmSans = DM_Sans({ subsets: ["latin"] })
const _dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400" })

export const metadata: Metadata = {
  title: "NestList - Household Purchase Tracker for Couples",
  description:
    "Track household items, compare prices, and plan your move together. The perfect app for couples building their home.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
