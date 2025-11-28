import type { Card, Rank, Suit, Hand } from "./types"

const suits: Suit[] = ["♠", "♥", "♦", "♣"]
const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, faceUp: false })
    }
  }
  return deck
}

export function createShoe(numDecks: number): Card[] {
  const shoe: Card[] = []
  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createDeck())
  }
  return shuffleDeck(shoe)
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function getCardNumericValue(rank: Rank): number {
  if (rank === "A") return 11
  if (["J", "Q", "K"].includes(rank)) return 10
  return Number.parseInt(rank)
}

export function calculateHandValue(cards: Card[]): { value: number; soft: boolean } {
  let value = 0
  let aces = 0

  for (const card of cards) {
    const numValue = getCardNumericValue(card.rank)
    value += numValue
    if (card.rank === "A") aces++
  }

  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10
    aces--
  }

  const soft = aces > 0 && value <= 21
  return { value, soft }
}

export function isBlackjack(hand: Hand): boolean {
  return hand.cards.length === 2 && calculateHandValue(hand.cards).value === 21 && !hand.isSplit
}

export function canSplit(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false
  return getCardNumericValue(hand.cards[0].rank) === getCardNumericValue(hand.cards[1].rank)
}

export function canDouble(hand: Hand): boolean {
  return hand.cards.length === 2 && !hand.isDoubled
}

export function shouldDealerHit(dealerHand: Hand, hitSoft17: boolean): boolean {
  const { value, soft } = calculateHandValue(dealerHand.cards)
  if (value < 17) return true
  if (value === 17 && soft && hitSoft17) return true
  return false
}
