"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Card, Rank, Suit } from "@/lib/types"

// Shoe state interface
interface ShoeState {
  cards: Card[]
  originalCount: number
  burnedCards: Card[]
  cutPosition: number
  isShuffled: boolean
  isReady: boolean
  penetrationMarkerPosition: number // Position of red cut card (0-1), set by casino/dealer
}

// Shoe context interface
interface ShoeContextType {
  shoe: ShoeState
  startNewShoe: (decks: number) => Card[]
  cutDeck: (position: number) => void
  setPenetrationMarker: (penetration: number) => void // New: dealer sets this
  burnTopCard: () => Card | null
  dealNextCard: (faceUp?: boolean) => Card | null
  cardsRemaining: number
  penetration: number
  needsReshuffle: boolean
  setShoeReady: () => void
  skipAnimations: boolean
  setSkipAnimations: (skip: boolean) => void
}

const ShoeContext = createContext<ShoeContextType | null>(null)

// Constants
const suits: Suit[] = ["♠", "♥", "♦", "♣"]
const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]

// Cryptographically strong Fisher-Yates shuffle
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  const length = shuffled.length

  // Use crypto.getRandomValues for true randomness
  const randomValues = new Uint32Array(length)
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomValues)
  } else {
    // Fallback for SSR - still use Fisher-Yates but with Math.random
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 0xffffffff)
    }
  }

  // Fisher-Yates shuffle using cryptographic random values
  for (let i = length - 1; i > 0; i--) {
    // Convert random value to index in range [0, i]
    const j = randomValues[i] % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

// Create a single deck of 52 cards
function createSingleDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, faceUp: false })
    }
  }
  return deck
}

// Create multi-deck shoe (unshuffled)
function createMultiDeckShoe(numDecks: number): Card[] {
  const shoe: Card[] = []
  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createSingleDeck())
  }
  return shoe
}

// Provider component
export function ShoeProvider({ children }: { children: ReactNode }) {
  const [shoe, setShoe] = useState<ShoeState>({
    cards: [],
    originalCount: 0,
    burnedCards: [],
    cutPosition: 0,
    isShuffled: false,
    isReady: false,
    // Default penetration - casino typically leaves 0.5-1 deck undealt
    // 75% = deal 75% of cards before reshuffle (1.5 decks behind in 6-deck)
    penetrationMarkerPosition: 0.75,
  })

  const [skipAnimations, setSkipAnimations] = useState(false)

  // Start a new shoe with the specified number of decks
  const startNewShoe = useCallback((decks: number): Card[] => {
    // Create all cards from X decks
    const allCards = createMultiDeckShoe(decks)

    // Perform cryptographically strong Fisher-Yates shuffle
    // Shuffle multiple times for extra randomness (like a real dealer)
    let shuffledCards = fisherYatesShuffle(allCards)
    shuffledCards = fisherYatesShuffle(shuffledCards)
    shuffledCards = fisherYatesShuffle(shuffledCards)

    setShoe({
      cards: shuffledCards,
      originalCount: shuffledCards.length,
      burnedCards: [],
      cutPosition: 0,
      isShuffled: true,
      isReady: false,
      penetrationMarkerPosition: 0.75, // Reset to default, will be set by dealer
    })

    return shuffledCards
  }, [])

  // Cut the deck at the specified position (0-1 range)
  // This ONLY reorganizes the cards - player's cut action
  // The red penetration card is inserted separately by the dealer
  const cutDeck = useCallback((position: number) => {
    setShoe((prev) => {
      if (!prev.isShuffled || prev.cards.length === 0) return prev

      // Clamp position between 10% and 90%
      const clampedPosition = Math.max(0.1, Math.min(0.9, position))
      const cutIndex = Math.floor(prev.cards.length * clampedPosition)

      // Rotate the array: cards after cut position move to the front
      // This simulates completing the cut - bottom portion goes on top
      const topPortion = prev.cards.slice(0, cutIndex)
      const bottomPortion = prev.cards.slice(cutIndex)
      const cutCards = [...bottomPortion, ...topPortion]

      return {
        ...prev,
        cards: cutCards,
        cutPosition: clampedPosition,
        // NOTE: penetrationMarkerPosition stays unchanged
        // The player's cut does NOT determine where the red card goes
      }
    })
  }, [])

  // Set the penetration marker position (dealer inserts red cut card)
  // Called after player cuts - dealer places red card near back of deck
  // Typically leaves 0.5-1 deck undealt (75-85% penetration)
  const setPenetrationMarker = useCallback((penetration: number) => {
    setShoe((prev) => ({
      ...prev,
      // Clamp between 65% and 90% (realistic casino range)
      penetrationMarkerPosition: Math.max(0.65, Math.min(0.9, penetration)),
    }))
  }, [])

  // Burn the top card
  const burnTopCard = useCallback((): Card | null => {
    let burnedCard: Card | null = null

    setShoe((prev) => {
      if (prev.cards.length === 0) return prev

      burnedCard = { ...prev.cards[0], faceUp: false }

      return {
        ...prev,
        cards: prev.cards.slice(1),
        burnedCards: [...prev.burnedCards, burnedCard],
      }
    })

    return burnedCard
  }, [])

  // Deal the next card from the shoe
  const dealNextCard = useCallback((faceUp = true): Card | null => {
    let dealtCard: Card | null = null

    setShoe((prev) => {
      if (prev.cards.length === 0) return prev

      dealtCard = { ...prev.cards[0], faceUp }

      return {
        ...prev,
        cards: prev.cards.slice(1),
      }
    })

    return dealtCard
  }, [])

  // Set shoe as ready after shuffling and cutting
  const setShoeReady = useCallback(() => {
    setShoe((prev) => ({ ...prev, isReady: true }))
  }, [])

  // Calculate cards remaining
  const cardsRemaining = shoe.cards.length

  // Calculate penetration (how deep into the shoe we are)
  const penetration = shoe.originalCount > 0 ? 1 - shoe.cards.length / shoe.originalCount : 0

  // Check if we need to reshuffle (past penetration marker)
  const needsReshuffle = penetration >= shoe.penetrationMarkerPosition

  return (
    <ShoeContext.Provider
      value={{
        shoe,
        startNewShoe,
        cutDeck,
        setPenetrationMarker,
        burnTopCard,
        dealNextCard,
        cardsRemaining,
        penetration,
        needsReshuffle,
        setShoeReady,
        skipAnimations,
        setSkipAnimations,
      }}
    >
      {children}
    </ShoeContext.Provider>
  )
}

// Custom hook to use the shoe context
export function useShoe() {
  const context = useContext(ShoeContext)
  if (!context) {
    throw new Error("useShoe must be used within a ShoeProvider")
  }
  return context
}
