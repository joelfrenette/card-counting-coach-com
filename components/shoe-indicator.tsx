"use client"

import { motion } from "framer-motion"
import { useShoe } from "@/contexts/shoe-context"

interface ShoeIndicatorProps {
  className?: string
}

export function ShoeIndicator({ className = "" }: ShoeIndicatorProps) {
  const { cardsRemaining, penetration, shoe, needsReshuffle } = useShoe()

  const penetrationPercent = Math.round(penetration * 100)
  const penetrationMarkerPercent = Math.round(shoe.penetrationMarkerPosition * 100)
  const nearCutCard = penetration >= shoe.penetrationMarkerPosition * 0.9 && !needsReshuffle

  // The cut card is at a fixed position in the original deck (penetrationMarkerPosition)
  // As cards are dealt (penetration increases), the cut card appears higher in the remaining stack
  // When penetration reaches penetrationMarkerPosition, the cut card is at the top (100%)
  const remainingFraction = 1 - penetration
  const cutCardAbsolutePosition = shoe.penetrationMarkerPosition

  // Position within remaining cards: 0 = bottom of remaining, 1 = top of remaining
  // Cut card position relative to remaining deck
  const cutCardInRemainingPercent =
    remainingFraction > 0 ? ((cutCardAbsolutePosition - penetration) / remainingFraction) * 100 : 0

  // Cut card is visible if it's still in the remaining deck (not yet dealt past)
  const cutCardVisible = penetration < shoe.penetrationMarkerPosition

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Realistic shoe visual - side view */}
      <div className="relative">
        <div className="absolute -top-4 left-0 right-0 text-center">
          <span className="text-[9px] text-white/40 uppercase tracking-wider">Shoe</span>
        </div>

        {/* Shoe housing - 3D perspective */}
        <div className="relative w-20 h-14 perspective-[200px]">
          {/* Back wall of shoe */}
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-sm border border-zinc-700/50" />

          {/* Card stack area */}
          <div className="absolute left-1 right-3 top-1 bottom-1 bg-zinc-950 rounded-sm overflow-hidden">
            {/* Dealt cards area (empty/dark) */}
            <div className="absolute top-0 left-0 right-0 bg-zinc-950" style={{ height: `${penetration * 100}%` }} />

            {/* Remaining cards stack */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 overflow-hidden"
              style={{ height: `${remainingFraction * 100}%` }}
              transition={{ duration: 0.3 }}
            >
              {/* Card backs stacked - multiple thin lines to show individual cards */}
              <div className="absolute inset-0 flex flex-col justify-end">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[3px] bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 border-b border-blue-900/50"
                    style={{
                      opacity: 0.7 + i * 0.025,
                    }}
                  />
                ))}
                {/* Main card mass */}
                <div className="flex-1 bg-gradient-to-b from-blue-800 via-blue-700 to-blue-600 min-h-[4px]" />
              </div>

              {/* As cards are dealt, this line moves UP toward the top of remaining cards */}
              {cutCardVisible && (
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-[0_0_6px_rgba(239,68,68,0.8)]"
                  style={{
                    // Position from bottom: 0% = at very bottom, 100% = at very top of remaining stack
                    bottom: `${Math.max(0, Math.min(100, cutCardInRemainingPercent))}%`,
                  }}
                  animate={
                    nearCutCard || needsReshuffle
                      ? {
                          boxShadow: [
                            "0 0 4px rgba(239,68,68,0.6)",
                            "0 0 10px rgba(239,68,68,1)",
                            "0 0 4px rgba(239,68,68,0.6)",
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                />
              )}
            </motion.div>
          </div>

          {/* Card exit slot on right */}
          <div className="absolute right-0 top-2 bottom-2 w-2 bg-gradient-to-l from-zinc-700 to-zinc-800 rounded-r-sm border-l border-zinc-600/30">
            {/* Slot opening */}
            <div className="absolute inset-y-1 left-0 w-0.5 bg-zinc-950" />
          </div>

          {/* Top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-500/30 to-transparent" />
        </div>
      </div>

      {/* Stats */}
      <div className="text-xs space-y-0.5">
        <div className="text-white/90 font-medium">{cardsRemaining} cards</div>
        <div className="text-white/50 text-[10px]">{penetrationPercent}% dealt</div>
        <div
          className={`text-[10px] flex items-center gap-1 ${
            needsReshuffle ? "text-red-400 font-semibold" : nearCutCard ? "text-yellow-400" : "text-white/40"
          }`}
        >
          <span className="inline-block w-2 h-0.5 bg-red-500 rounded-full" />
          Cut at {penetrationMarkerPercent}%
          {needsReshuffle && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
            >
              !
            </motion.span>
          )}
        </div>
      </div>
    </div>
  )
}
