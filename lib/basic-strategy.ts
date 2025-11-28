import type { Rank } from "./types"
import { calculateHandValue } from "./blackjack"

type Action = "hit" | "stand" | "double" | "split"

interface StrategyAdvice {
  action: Action
  reason: string
  expectedValue?: string
}

export function getBasicStrategyAction(
  playerCards: { rank: Rank }[],
  dealerValue: number,
): "Hit" | "Stand" | "Double" | "Split" {
  const handValue = calculateHandValue(playerCards)

  // Check for pairs
  if (playerCards.length === 2) {
    const firstCard = playerCards[0].rank
    const secondCard = playerCards[1].rank

    if (firstCard === secondCard) {
      const cardValue = getDealerCardValue(firstCard)

      // Always split Aces and 8s
      if (firstCard === "A" || firstCard === "8") return "Split"

      // Never split 10s or 5s
      if (["10", "J", "Q", "K"].includes(firstCard) || firstCard === "5") {
        // Treat as hard hand
      } else {
        // Check split conditions for other pairs
        if (["2", "3"].includes(firstCard) && dealerValue >= 2 && dealerValue <= 7) return "Split"
        if (firstCard === "6" && dealerValue >= 2 && dealerValue <= 6) return "Split"
        if (firstCard === "7" && dealerValue >= 2 && dealerValue <= 7) return "Split"
        if (firstCard === "9" && ((dealerValue >= 2 && dealerValue <= 6) || dealerValue === 8 || dealerValue === 9))
          return "Split"
      }
    }
  }

  // Soft hands
  if (handValue.soft) {
    if (handValue.value >= 19) return "Stand"
    if (handValue.value === 18) {
      if (dealerValue >= 9 || dealerValue === 11) return "Hit"
      if (dealerValue >= 2 && dealerValue <= 6) return "Double"
      return "Stand"
    }
    if (handValue.value >= 13 && handValue.value <= 17) {
      if (dealerValue >= 4 && dealerValue <= 6) return "Double"
      return "Hit"
    }
    return "Hit"
  }

  // Hard hands
  if (handValue.value >= 17) return "Stand"
  if (handValue.value >= 13 && handValue.value <= 16) {
    if (dealerValue >= 2 && dealerValue <= 6) return "Stand"
    return "Hit"
  }
  if (handValue.value === 12) {
    if (dealerValue >= 4 && dealerValue <= 6) return "Stand"
    return "Hit"
  }
  if (handValue.value === 11) return "Double"
  if (handValue.value === 10) {
    if (dealerValue <= 9) return "Double"
    return "Hit"
  }
  if (handValue.value === 9) {
    if (dealerValue >= 3 && dealerValue <= 6) return "Double"
    return "Hit"
  }

  return "Hit"
}

export function getBasicStrategyAdvice(
  playerCards: { rank: Rank }[],
  dealerUpCard: Rank,
  canDouble: boolean,
  canSplit: boolean,
): StrategyAdvice {
  const handValue = calculateHandValue(playerCards)
  const dealerValue = getDealerCardValue(dealerUpCard)

  // Check for pairs
  if (canSplit && playerCards.length === 2) {
    const firstCard = playerCards[0].rank
    const secondCard = playerCards[1].rank

    if (firstCard === secondCard) {
      const pairAdvice = getPairStrategy(firstCard, dealerUpCard)
      if (pairAdvice.action === "split") {
        return pairAdvice
      }
    }
  }

  // Check for soft hands (with Ace counted as 11)
  if (handValue.soft) {
    return getSoftHandStrategy(handValue.value, dealerValue, canDouble)
  }

  // Hard hands
  return getHardHandStrategy(handValue.value, dealerValue, canDouble)
}

function getDealerCardValue(rank: Rank): number {
  if (rank === "A") return 11
  if (["J", "Q", "K"].includes(rank)) return 10
  return Number.parseInt(rank)
}

function getPairStrategy(pairRank: Rank, dealerUpCard: Rank): StrategyAdvice {
  const dealerValue = getDealerCardValue(dealerUpCard)

  // Always split Aces and 8s
  if (pairRank === "A") {
    return {
      action: "split",
      reason: "Always split Aces - gives you two chances at 21",
    }
  }

  if (pairRank === "8") {
    return {
      action: "split",
      reason: "16 is a terrible hand. Split 8s to improve your position",
    }
  }

  // Never split 10s, 5s, or 4s
  if (["10", "J", "Q", "K"].includes(pairRank)) {
    return {
      action: "stand",
      reason: "20 is too strong to split. Stand and win",
    }
  }

  if (pairRank === "5") {
    if (dealerValue <= 9) {
      return {
        action: "double",
        reason: "Double down on 10 against weak dealer card",
      }
    }
    return {
      action: "hit",
      reason: "Hit your 10 against strong dealer card",
    }
  }

  // Split 2s, 3s, 6s, 7s, 9s based on dealer card
  if (["2", "3"].includes(pairRank)) {
    if (dealerValue >= 2 && dealerValue <= 7) {
      return {
        action: "split",
        reason: "Split small pairs against weak dealer",
      }
    }
  }

  if (pairRank === "6") {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return {
        action: "split",
        reason: "Split 6s when dealer shows 2-6",
      }
    }
  }

  if (pairRank === "7") {
    if (dealerValue >= 2 && dealerValue <= 7) {
      return {
        action: "split",
        reason: "Split 7s against dealer 2-7",
      }
    }
  }

  if (pairRank === "9") {
    if ((dealerValue >= 2 && dealerValue <= 6) || dealerValue === 8 || dealerValue === 9) {
      return {
        action: "split",
        reason: "Split 9s against weak cards (avoid 7, 10, A)",
      }
    }
    return {
      action: "stand",
      reason: "18 is strong against dealer 7, 10, or Ace",
    }
  }

  return {
    action: "hit",
    reason: "Hit this pair against strong dealer card",
  }
}

function getSoftHandStrategy(value: number, dealerValue: number, canDouble: boolean): StrategyAdvice {
  // Soft 19-21: Always stand
  if (value >= 19) {
    return {
      action: "stand",
      reason: `Soft ${value} is very strong - stand`,
    }
  }

  // Soft 18
  if (value === 18) {
    if (dealerValue >= 2 && dealerValue <= 6 && canDouble) {
      return {
        action: "double",
        reason: "Double soft 18 against weak dealer (or stand)",
      }
    }
    if (dealerValue >= 9 || dealerValue === 11) {
      return {
        action: "hit",
        reason: "Soft 18 is weak against 9, 10, A - hit to improve",
      }
    }
    return {
      action: "stand",
      reason: "Soft 18 is decent against mid-range dealer cards",
    }
  }

  // Soft 17 and below
  if (value >= 13 && value <= 17) {
    if (dealerValue >= 4 && dealerValue <= 6 && canDouble) {
      return {
        action: "double",
        reason: `Double soft ${value} against dealer's weak ${dealerValue}`,
      }
    }
    return {
      action: "hit",
      reason: `Soft ${value} needs improvement - hit`,
    }
  }

  return {
    action: "hit",
    reason: "Hit to improve your soft hand",
  }
}

function getHardHandStrategy(value: number, dealerValue: number, canDouble: boolean): StrategyAdvice {
  // 17 and above: Always stand
  if (value >= 17) {
    return {
      action: "stand",
      reason: `${value} is too risky to hit - stand`,
    }
  }

  // 13-16: Stand on dealer 2-6, hit on 7+
  if (value >= 13 && value <= 16) {
    if (dealerValue >= 2 && dealerValue <= 6) {
      return {
        action: "stand",
        reason: `Stand on ${value} - let dealer bust with weak ${dealerValue}`,
      }
    }
    return {
      action: "hit",
      reason: `${value} is too weak against dealer ${dealerValue} - must hit`,
    }
  }

  // 12: Hit except against dealer 4-6
  if (value === 12) {
    if (dealerValue >= 4 && dealerValue <= 6) {
      return {
        action: "stand",
        reason: "Stand on 12 vs weak dealer 4-6",
      }
    }
    return {
      action: "hit",
      reason: "Hit 12 - only 4 cards bust you",
    }
  }

  // 11: Always double if possible
  if (value === 11) {
    if (canDouble) {
      return {
        action: "double",
        reason: "11 is the best double down hand - high chance of 21",
      }
    }
    return {
      action: "hit",
      reason: "Hit your 11 to get closer to 21",
    }
  }

  // 10: Double against dealer 2-9
  if (value === 10) {
    if (canDouble && dealerValue <= 9) {
      return {
        action: "double",
        reason: "Double 10 against dealer weak/mid cards",
      }
    }
    return {
      action: "hit",
      reason: "Hit 10 against strong dealer card",
    }
  }

  // 9: Double against dealer 3-6
  if (value === 9) {
    if (canDouble && dealerValue >= 3 && dealerValue <= 6) {
      return {
        action: "double",
        reason: "Double 9 against weak dealer 3-6",
      }
    }
    return {
      action: "hit",
      reason: "Hit 9 to build a stronger hand",
    }
  }

  // 8 or less: Always hit
  return {
    action: "hit",
    reason: `${value} is too low - always hit`,
  }
}

export function getBettingAdvice(trueCount: number, minBet: number): { betAmount: number; reason: string } {
  // Kelly Criterion approximation for bet sizing
  if (trueCount >= 5) {
    return {
      betAmount: minBet * 8,
      reason: `True count +${trueCount} is very favorable - max bet!`,
    }
  }

  if (trueCount >= 4) {
    return {
      betAmount: minBet * 6,
      reason: `True count +${trueCount} gives you strong edge - big bet`,
    }
  }

  if (trueCount >= 3) {
    return {
      betAmount: minBet * 4,
      reason: `True count +${trueCount} is favorable - increase bet`,
    }
  }

  if (trueCount >= 2) {
    return {
      betAmount: minBet * 2,
      reason: `True count +${trueCount} gives slight edge - moderate bet`,
    }
  }

  if (trueCount <= -2) {
    return {
      betAmount: minBet,
      reason: `Negative count - minimize losses with min bet`,
    }
  }

  return {
    betAmount: minBet,
    reason: "Neutral count - bet minimum",
  }
}

export function getBasicStrategyRecommendation(
  playerCards: { rank: Rank }[],
  dealerUpCard: { rank: Rank },
): { action: string; reason: string } | null {
  if (!playerCards || playerCards.length === 0 || !dealerUpCard) {
    return null
  }

  const dealerValue = getDealerCardValue(dealerUpCard.rank)
  const canDouble = playerCards.length === 2
  const canSplit = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank

  const advice = getBasicStrategyAdvice(playerCards, dealerUpCard.rank, canDouble, canSplit)

  return {
    action: advice.action.charAt(0).toUpperCase() + advice.action.slice(1),
    reason: advice.reason,
  }
}
