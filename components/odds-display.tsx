"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface OddsDisplayProps {
  playerValue: number
  dealerUpCard: number
  visible: boolean
}

export function OddsDisplay({ playerValue, dealerUpCard, visible }: OddsDisplayProps) {
  if (!visible) return null

  // Simplified odds calculations
  const bustProbability = calculateBustProbability(playerValue)
  const winProbability = calculateWinProbability(playerValue, dealerUpCard)

  return (
    <Card className="p-4 bg-card/95 backdrop-blur space-y-3">
      <h3 className="font-semibold text-sm">Probability Analysis</h3>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Bust if hit:</span>
          <span className="font-bold">{bustProbability}%</span>
        </div>
        <Progress value={bustProbability} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Estimated win chance:</span>
          <span className="font-bold text-primary">{winProbability}%</span>
        </div>
        <Progress value={winProbability} className="h-2" />
      </div>
    </Card>
  )
}

function calculateBustProbability(handValue: number): number {
  if (handValue >= 21) return 0
  if (handValue <= 11) return 0

  // Approximation: Cards 10, J, Q, K are 16/52 of deck
  const bustCards = Math.max(0, 21 - handValue)
  const totalCards = 13

  if (handValue === 12) return 31 // Only 10, J, Q, K bust
  if (handValue === 13) return 38
  if (handValue === 14) return 46
  if (handValue === 15) return 54
  if (handValue === 16) return 62
  if (handValue === 17) return 69
  if (handValue === 18) return 77
  if (handValue === 19) return 85
  if (handValue === 20) return 92

  return 0
}

function calculateWinProbability(playerValue: number, dealerUpCard: number): number {
  // Simplified win probability based on basic strategy expectations
  if (playerValue > 21) return 0
  if (playerValue === 21) return 85
  if (playerValue === 20) return 80
  if (playerValue === 19) return 70

  // Dealer bust probabilities by up card
  const dealerBustProb: Record<number, number> = {
    2: 35,
    3: 37,
    4: 40,
    5: 42,
    6: 42,
    7: 26,
    8: 24,
    9: 23,
    10: 21,
    11: 17,
  }

  const dealerBust = dealerBustProb[dealerUpCard] || 25

  if (playerValue >= 17) {
    return dealerBust + Math.max(0, (playerValue - 17) * 5)
  }

  if (playerValue <= 11) return 45

  return 40 - (17 - playerValue) * 3
}
