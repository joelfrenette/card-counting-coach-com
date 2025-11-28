import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CARD-COUNTING-COACH.COM",
  description: "From basic strategy to pro-level counting, everything you need to play with an edge",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "CARD-COUNTING-COACH.COM",
    description: "From basic strategy to pro-level counting, everything you need to play with an edge",
    images: [
      {
        url: "/og-image.png",
        width: 1456,
        height: 816,
        alt: "Card Counting Coach - Blackjack training with chips and cards",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CARD-COUNTING-COACH.COM",
    description: "From basic strategy to pro-level counting, everything you need to play with an edge",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  )
}
