import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans, DM_Serif_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { FigueiraWatermark } from "@/components/FigueiraWatermark"
import { CoupleWatermark } from "@/components/CoupleWatermark"
import "./globals.css"

const _dmSans = DM_Sans({ subsets: ["latin"] })
const _dmSerif = DM_Serif_Display({ subsets: ["latin"], weight: "400" })

export const metadata: Metadata = {
  title: "Nossa listinha momo",
  description:
    "Planejar hihihihihihihi casa casa casa",
  }

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#8B5CF6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'figueira', 'couple', 'dark', 'tokyo-night', 'monokai', 'catppuccin', 'nord', 'gruvbox', 'dracula']}
        >
          <FigueiraWatermark />
          <CoupleWatermark />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
