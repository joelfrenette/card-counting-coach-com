"use client"

import type { Player } from "@/lib/types"
import { PlayingCard } from "@/components/playing-card"
import { calculateHandValue, isBlackjack } from "@/lib/blackjack"
import { User, Bot } from "lucide-react"

interface PlayerSeatProps {
  player: Player
  isCurrentPlayer: boolean
  isHumanPlayer: boolean
  showDownCards: boolean
}

export function PlayerSeat({ player, isCurrentPlayer, isHumanPlayer, showDownCards }: PlayerSeatProps) {
  const hasSplitHands = player.hands.length > 1

  return (
    <div
      className={`flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-lg transition-all ${
        isCurrentPlayer ? "ring-2 md:ring-4 ring-primary bg-primary/5 scale-105" : "bg-card/30"
      }`}
    >
      {/* Player Info */}
      <div className="flex items-center gap-1 md:gap-2">
        {isHumanPlayer ? (
          <User className="h-3 w-3 md:h-4 md:w-4 text-primary" />
        ) : (
          <Bot className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        )}
        <span className="text-xs md:text-sm font-semibold text-foreground">{isHumanPlayer ? "You" : player.name}</span>
      </div>

      {/* Hands */}
      <div className={`flex ${hasSplitHands ? "flex-row-reverse gap-2 md:gap-6" : "gap-2 md:gap-4"}`}>
        {player.hands.map((hand, idx) => {
          const isActiveHand = isCurrentPlayer && idx === player.currentHandIndex && hand.isActive

          return (
            <div
              key={idx}
              className={`flex flex-col items-center gap-1 md:gap-2 ${hasSplitHands ? "p-1 md:p-2 rounded-lg transition-all" : ""} ${
                isActiveHand
                  ? "ring-2 ring-secondary bg-secondary/10"
                  : hasSplitHands && !hand.isActive && player.currentHandIndex > idx
                    ? "opacity-60"
                    : ""
              }`}
            >
              {hasSplitHands && (
                <div
                  className={`text-[10px] md:text-xs font-medium ${isActiveHand ? "text-secondary" : "text-muted-foreground"}`}
                >
                  Hand {idx + 1} {isActiveHand && "▶"}
                </div>
              )}

              <div className="flex gap-0.5 md:gap-1">
                {hand.cards.map((card, cardIdx) => (
                  <PlayingCard key={cardIdx} card={{ ...card, faceUp: true }} size="responsive" />
                ))}
              </div>
              {hand.cards.length > 0 && (
                <div className="text-center">
                  <div className="text-xs md:text-sm font-bold text-foreground">
                    {calculateHandValue(hand.cards).value}
                    {isBlackjack(hand) && <span className="text-secondary text-[10px] md:text-xs ml-1">BJ</span>}
                    {hand.isSplit && calculateHandValue(hand.cards).value > 21 && (
                      <span className="text-destructive text-[10px] md:text-xs ml-1">BUST</span>
                    )}
                  </div>
                  {hand.bet > 0 && (
                    <div className="text-[10px] md:text-xs text-muted-foreground">
                      ${hand.bet} {hand.isDoubled && "(2x)"}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Seat Number */}
      <div className="text-[10px] md:text-xs text-muted-foreground">Seat {player.seatNumber}</div>
    </div>
  )
}
