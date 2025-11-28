import type { BettingStyle, BettingStyleConfig } from "./types"

export const bettingStyles: Record<BettingStyle, BettingStyleConfig> = {
  flat: {
    name: "Flat Betting",
    description: "Bet the same amount every hand regardless of count. Safest but lowest edge.",
    spreadMultiplier: 1,
    minCountToPlay: -999,
    riskLevel: "low",
  },
  kelly: {
    name: "Kelly Criterion",
    description: "Mathematically optimal bet sizing based on your edge from the count. Balanced risk/reward.",
    spreadMultiplier: 1,
    minCountToPlay: -999,
    riskLevel: "medium",
  },
  aggressive: {
    name: "Aggressive Ramp",
    description: "Large bet spreads (1-20 units) with rapid escalation. High variance, high returns, high heat.",
    spreadMultiplier: 1.5,
    minCountToPlay: -999,
    riskLevel: "high",
  },
  conservative: {
    name: "Conservative Spread",
    description: "Small spread (1-6 units) with slow ramp. Lower risk, less heat, but smaller edge.",
    spreadMultiplier: 0.6,
    minCountToPlay: -999,
    riskLevel: "low",
  },
  martingale: {
    name: "Martingale System",
    description: "Double bet after each loss. NOT RECOMMENDED - high risk of ruin, ignores count.",
    spreadMultiplier: 2,
    minCountToPlay: -999,
    riskLevel: "high",
  },
  oscar: {
    name: "Oscar's Grind",
    description: "Increase bet by 1 unit after wins, reset after reaching profit goal. Conservative system.",
    spreadMultiplier: 0.8,
    minCountToPlay: -999,
    riskLevel: "low",
  },
  wonging: {
    name: "Wonging (Back-Counting)",
    description: "Only play when count is favorable (+2 or higher). Leave table on negative counts.",
    spreadMultiplier: 1.2,
    minCountToPlay: 2,
    riskLevel: "medium",
  },
}

export function calculateBetAmount(
  trueCount: number,
  minBet: number,
  maxBet: number,
  bankroll: number,
  bettingStyle: BettingStyle,
  lastBet: number,
  lastHandWon: boolean,
): { amount: number; reason: string } {
  const style = bettingStyles[bettingStyle]

  // Wonging: Only play favorable counts
  if (bettingStyle === "wonging" && trueCount < style.minCountToPlay) {
    return {
      amount: 0,
      reason: `Count is ${trueCount > 0 ? "+" : ""}${trueCount} - Wong out (sit out) until count improves`,
    }
  }

  switch (bettingStyle) {
    case "flat":
      return {
        amount: minBet,
        reason: "Flat betting - same amount every hand for low variance",
      }

    case "kelly": {
      // Kelly Criterion: bet = bankroll * edge / variance
      // Approximate edge from true count: each +1 true count = ~0.5% edge
      const edge = trueCount * 0.005
      if (edge <= 0) {
        return {
          amount: minBet,
          reason: "No advantage - Kelly says minimum bet",
        }
      }
      // Simplified Kelly with standard deviation ~1.15 for blackjack
      const kellyBet = Math.floor((bankroll * edge) / 1.3)
      const bet = Math.min(Math.max(kellyBet, minBet), maxBet)
      return {
        amount: bet,
        reason: `Kelly Criterion: ${(edge * 100).toFixed(2)}% edge = $${bet} optimal bet`,
      }
    }

    case "aggressive": {
      // Large spread based on count
      if (trueCount >= 5) {
        return {
          amount: Math.min(minBet * 20, maxBet),
          reason: `TC +${trueCount} - Aggressive max bet!`,
        }
      }
      if (trueCount >= 4) {
        return {
          amount: Math.min(minBet * 12, maxBet),
          reason: `TC +${trueCount} - Large aggressive bet`,
        }
      }
      if (trueCount >= 3) {
        return {
          amount: Math.min(minBet * 8, maxBet),
          reason: `TC +${trueCount} - Ramping up aggressively`,
        }
      }
      if (trueCount >= 2) {
        return {
          amount: Math.min(minBet * 4, maxBet),
          reason: `TC +${trueCount} - Moderate aggressive bet`,
        }
      }
      return {
        amount: minBet,
        reason: trueCount < 0 ? "Negative count - min bet" : "Neutral count - min bet",
      }
    }

    case "conservative": {
      // Small spread, slow ramp
      if (trueCount >= 5) {
        return {
          amount: Math.min(minBet * 6, maxBet),
          reason: `TC +${trueCount} - Conservative max bet`,
        }
      }
      if (trueCount >= 4) {
        return {
          amount: Math.min(minBet * 5, maxBet),
          reason: `TC +${trueCount} - Gradual increase`,
        }
      }
      if (trueCount >= 3) {
        return {
          amount: Math.min(minBet * 4, maxBet),
          reason: `TC +${trueCount} - Moderate conservative bet`,
        }
      }
      if (trueCount >= 2) {
        return {
          amount: Math.min(minBet * 2, maxBet),
          reason: `TC +${trueCount} - Small increase`,
        }
      }
      return {
        amount: minBet,
        reason: "Conservative style - keeping bets low",
      }
    }

    case "martingale": {
      // Double after loss (dangerous!)
      if (!lastHandWon && lastBet > 0) {
        const doubleBet = Math.min(lastBet * 2, maxBet)
        return {
          amount: doubleBet,
          reason: "Martingale: doubling after loss (WARNING: high risk!)",
        }
      }
      return {
        amount: minBet,
        reason: "Martingale: reset to min after win",
      }
    }

    case "oscar": {
      // Oscar's Grind: +1 unit after win, stay same after loss
      if (lastHandWon && lastBet > 0) {
        const newBet = Math.min(lastBet + minBet, maxBet)
        return {
          amount: newBet,
          reason: "Oscar's Grind: +1 unit after win",
        }
      }
      return {
        amount: lastBet > 0 ? lastBet : minBet,
        reason: "Oscar's Grind: maintain bet after loss",
      }
    }

    case "wonging": {
      // Already handled above, but play normally once in
      if (trueCount >= 5) {
        return {
          amount: Math.min(minBet * 10, maxBet),
          reason: `Wonging: TC +${trueCount} - big bet while here`,
        }
      }
      if (trueCount >= 3) {
        return {
          amount: Math.min(minBet * 6, maxBet),
          reason: `Wonging: TC +${trueCount} - solid advantage`,
        }
      }
      return {
        amount: Math.min(minBet * 3, maxBet),
        reason: `Wonging: TC +${trueCount} - playing favorable count`,
      }
    }

    default:
      return {
        amount: minBet,
        reason: "Standard minimum bet",
      }
  }
}
