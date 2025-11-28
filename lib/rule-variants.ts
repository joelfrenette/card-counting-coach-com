import type { GameSettings } from "./types"

export interface RuleVariant {
  name: string
  description: string
  baseHouseEdge: number // House edge with perfect basic strategy
  key: string
}

// Common rule configurations for basic strategy
export const RULE_VARIANTS: RuleVariant[] = [
  {
    name: "4-8 Decks, H17, DAS, No Surrender",
    description: "Standard multi-deck game, dealer hits soft 17",
    baseHouseEdge: 0.64,
    key: "multi-h17-das",
  },
  {
    name: "4-8 Decks, S17, DAS, Late Surrender",
    description: "Vegas Strip rules - dealer stands on soft 17",
    baseHouseEdge: 0.5,
    key: "strip-s17-ls",
  },
  {
    name: "1-2 Decks, S17, DAS",
    description: "Double-deck premium game",
    baseHouseEdge: 0.35,
    key: "dd-s17-das",
  },
  {
    name: "6 Decks, H17, DAS",
    description: "Common casino standard",
    baseHouseEdge: 0.56,
    key: "6d-h17-das",
  },
  {
    name: "8 Decks, S17, DAS, Resplit Aces",
    description: "Liberal 8-deck rules",
    baseHouseEdge: 0.4,
    key: "8d-s17-rsa",
  },
  {
    name: "2 Decks, H17, DAS",
    description: "Double-deck with dealer hits soft 17",
    baseHouseEdge: 0.46,
    key: "dd-h17-das",
  },
]

// Get the house edge based on current game settings
export function getHouseEdgeFromSettings(settings: GameSettings): number {
  let baseEdge = 0.5 // Start with a baseline

  // Deck count impact
  if (settings.numberOfDecks === 1) baseEdge -= 0.15
  else if (settings.numberOfDecks === 2) baseEdge -= 0.1
  else if (settings.numberOfDecks === 6) baseEdge += 0.02
  else if (settings.numberOfDecks === 8) baseEdge += 0.04

  // Dealer hits soft 17
  if (settings.dealerHitsSoft17) baseEdge += 0.2

  // Double after split allowed
  if (settings.allowDoubleAfterSplit) baseEdge -= 0.14

  // Late surrender
  if (settings.lateSurrender) baseEdge -= 0.08

  // Resplit aces
  if (settings.resplitAces) baseEdge -= 0.06

  return Math.round(baseEdge * 100) / 100
}

// Get rule variant name based on settings
export function getRuleVariantName(settings: GameSettings): string {
  const deckCount = settings.numberOfDecks
  const h17 = settings.dealerHitsSoft17
  const das = settings.allowDoubleAfterSplit
  const ls = settings.lateSurrender
  const rsa = settings.resplitAces

  let name = `${deckCount} Deck${deckCount > 1 ? "s" : ""}`
  name += h17 ? ", H17" : ", S17"
  if (das) name += ", DAS"
  if (ls) name += ", LS"
  if (rsa) name += ", RSA"

  return name
}
