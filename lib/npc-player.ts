import type { Player, Hand, Card } from "./types"
import { calculateHandValue } from "./blackjack"
import { getBasicStrategyAction } from "./basic-strategy"

export function createNPC(id: string, seatNumber: number, bankroll: number): Player {
  return {
    id,
    name: `Player ${seatNumber}`,
    type: "npc",
    seatNumber,
    hands: [{ cards: [], bet: 0, isActive: true, isDoubled: false, isSplit: false }],
    currentHandIndex: 0,
    bankroll,
    currentBet: 0,
    isActive: true,
  }
}

export function getNPCBet(player: Player, minBet: number, maxBet: number, trueCount: number): number {
  // NPCs use simple betting strategy based on true count
  let betMultiplier = 1

  if (trueCount >= 2) betMultiplier = 2
  if (trueCount >= 3) betMultiplier = 3
  if (trueCount >= 4) betMultiplier = 4

  const bet = Math.min(minBet * betMultiplier, maxBet, player.bankroll)
  return Math.floor(bet / minBet) * minBet // Round to nearest chip
}

export function getNPCAction(
  hand: Hand,
  dealerUpCard: Card | null,
  canSplitHand: boolean,
  canDoubleHand: boolean,
  hasBankroll: boolean,
): "hit" | "stand" | "double" | "split" {
  if (!dealerUpCard) return "stand"

  const dealerValue = getDealerCardValue(dealerUpCard.rank)

  // Check if NPC should split (if allowed and affordable)
  if (canSplitHand && hasBankroll) {
    const shouldSplit = shouldNPCSplit(hand, dealerValue)
    if (shouldSplit) return "split"
  }

  // Check if NPC should double (if allowed and affordable)
  if (canDoubleHand && hasBankroll) {
    const shouldDouble = shouldNPCDouble(hand, dealerValue)
    if (shouldDouble) return "double"
  }

  // Use basic strategy for hit/stand
  const action = getBasicStrategyAction(hand.cards, dealerValue)

  if (action === "Hit") return "hit"
  if (action === "Stand") return "stand"
  if (action === "Double" && canDoubleHand && hasBankroll) return "double"
  if (action === "Split" && canSplitHand && hasBankroll) return "split"

  // Default to basic hit/stand logic
  return action === "Hit" ? "hit" : "stand"
}

function getDealerCardValue(rank: string): number {
  if (rank === "A") return 11
  if (["J", "Q", "K"].includes(rank)) return 10
  return Number.parseInt(rank)
}

function shouldNPCSplit(hand: Hand, dealerValue: number): boolean {
  if (hand.cards.length !== 2) return false

  const cardValue = getDealerCardValue(hand.cards[0].rank)

  // Always split Aces and 8s
  if (cardValue === 11 || cardValue === 8) return true

  // Never split 5s, 10s
  if (cardValue === 5 || cardValue === 10) return false

  // Split 2s, 3s, 7s against dealer 2-7
  if ([2, 3, 7].includes(cardValue) && dealerValue >= 2 && dealerValue <= 7) return true

  // Split 6s against dealer 2-6
  if (cardValue === 6 && dealerValue >= 2 && dealerValue <= 6) return true

  // Split 9s against dealer 2-9 except 7
  if (cardValue === 9 && dealerValue >= 2 && dealerValue <= 9 && dealerValue !== 7) return true

  return false
}

function shouldNPCDouble(hand: Hand, dealerValue: number): boolean {
  if (hand.cards.length !== 2) return false

  const { value, soft } = calculateHandValue(hand.cards)

  // Hard totals
  if (!soft) {
    if (value === 11) return true
    if (value === 10 && dealerValue <= 9) return true
    if (value === 9 && dealerValue >= 3 && dealerValue <= 6) return true
  }

  // Soft totals
  if (soft) {
    if (value === 18 && dealerValue >= 3 && dealerValue <= 6) return true
    if (value === 17 && dealerValue >= 3 && dealerValue <= 6) return true
  }

  return false
}
