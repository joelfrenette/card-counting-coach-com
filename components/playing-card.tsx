import type { Card } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PlayingCardProps {
  card: Card
  size?: "sm" | "md" | "lg" | "responsive"
}

export function PlayingCard({ card, size = "md" }: PlayingCardProps) {
  const isRed = card.suit === "♥" || card.suit === "♦"

  const sizeClasses = {
    sm: "w-14 h-20",
    md: "w-20 h-28",
    lg: "w-24 h-32",
    responsive: "w-12 h-[68px] sm:w-14 sm:h-20 md:w-20 md:h-28",
  }

  const textSizes = {
    sm: { rank: "text-xs", suit: "text-sm", center: "text-2xl" },
    md: { rank: "text-sm", suit: "text-base", center: "text-3xl" },
    lg: { rank: "text-base", suit: "text-lg", center: "text-4xl" },
    responsive: {
      rank: "text-[10px] sm:text-xs md:text-sm",
      suit: "text-xs sm:text-sm md:text-base",
      center: "text-xl sm:text-2xl md:text-3xl",
    },
  }

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "relative rounded-md md:rounded-lg border-2 border-border",
          "bg-gradient-to-br from-blue-600 to-blue-800",
          "flex items-center justify-center overflow-hidden",
          sizeClasses[size],
        )}
      >
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <pattern id="card-back" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="currentColor" />
            </pattern>
            <rect width="100" height="100" fill="url(#card-back)" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative rounded-md md:rounded-lg border-2 border-border bg-white",
        "shadow-lg overflow-hidden",
        sizeClasses[size],
      )}
    >
      <div
        className={cn(
          "absolute top-0.5 left-0.5 md:left-1 font-bold leading-tight",
          textSizes[size].rank,
          isRed ? "text-red-600" : "text-black",
        )}
      >
        <div>{card.rank}</div>
        <div className={cn("leading-none", textSizes[size].suit)}>{card.suit}</div>
      </div>

      {/* Center suit watermark */}
      <div
        className={cn(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "opacity-20",
          textSizes[size].center,
          isRed ? "text-red-600" : "text-black",
        )}
      >
        {card.suit}
      </div>

      <div
        className={cn(
          "absolute bottom-0.5 right-0.5 md:right-1 font-bold leading-tight rotate-180",
          textSizes[size].rank,
          isRed ? "text-red-600" : "text-black",
        )}
      >
        <div>{card.rank}</div>
        <div className={cn("leading-none", textSizes[size].suit)}>{card.suit}</div>
      </div>
    </div>
  )
}
