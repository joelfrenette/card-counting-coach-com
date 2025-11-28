"use client"

import Image from "next/image"
import { useState } from "react"

interface LandingSplashProps {
  onStart: () => void
}

export function LandingSplash({ onStart }: LandingSplashProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.png"
          alt="Casino table with cards and chips"
          fill
          className={`object-cover object-center transition-opacity duration-700 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority
          loading="eager"
          sizes="100vw"
          quality={75}
          onLoad={() => setImageLoaded(true)}
        />
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Title Banner */}
        <div className="mb-12 rounded-lg bg-black/80 px-8 py-4 backdrop-blur-sm">
          <h1 className="text-4xl font-bold tracking-wider text-white md:text-5xl lg:text-6xl">CARD COUNTING COACH</h1>
        </div>

        {/* Animated Start Button */}
        <button
          onClick={onStart}
          className="group relative animate-wiggle rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40 md:text-xl"
        >
          <span className="relative z-10">Click Here to Start Training</span>
          {/* Glow effect */}
          <div className="absolute inset-0 animate-pulse rounded-lg bg-emerald-400/20" />
        </button>
      </div>
    </div>
  )
}
