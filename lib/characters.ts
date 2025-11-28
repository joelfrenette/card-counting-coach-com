import type { BettingStyle } from "./types"

export type BankrollLevel = "low" | "mid" | "high"

export interface CharacterProfile {
  id: string
  name: string
  nickname: string
  bankrollLevel: BankrollLevel
  bankroll: number
  countingSystem: "hi-lo" | "ko" | "hi-opt-i" | "hi-opt-ii" | "zen" | "omega-ii" | "halves"
  bettingStyle: BettingStyle
  specialFeatures: string[]
  minBet: number
  maxBet: number
  betSpreadRatio: number
  coverStrategy: string
  inspiredBy: string
  style: string
  description: string
}

export const CHARACTERS: CharacterProfile[] = [
  // Low-Budget / Grinder Archetypes ($2k–$10k bankroll)
  {
    id: "dusty-schmidt",
    name: "Dustin 'Dusty' Schmidt",
    nickname: "The Grinder",
    bankrollLevel: "low",
    bankroll: 5000,
    countingSystem: "hi-lo",
    bettingStyle: "conservative",
    specialFeatures: ["Full indices", "Level-1 count", "Acts drunk"],
    minBet: 5,
    maxBet: 50,
    betSpreadRatio: 10,
    coverStrategy: "Acts like a drunk tourist, talks sports nonstop",
    inspiredBy: "Colin Jones (Holy Rollers)",
    style: "Classic lone-wolf grinder",
    description:
      "Grinds out profits with disciplined Hi-Lo counting on low-limit tables. Patient and consistent with excellent cover play.",
  },
  {
    id: "maya-chen",
    name: "Maya Chen",
    nickname: "The Student",
    bankrollLevel: "low",
    bankroll: 8000,
    countingSystem: "hi-lo",
    bettingStyle: "kelly",
    specialFeatures: ["Ace side count", "MIT-style", "Young female cover"],
    minBet: 10,
    maxBet: 200,
    betSpreadRatio: 12,
    coverStrategy: "Cute college girl with fake ID, giggles a lot, tips heavily",
    inspiredBy: "MIT Blackjack Team (early 2000s)",
    style: "MIT-style student on summer break",
    description:
      "Uses MIT team techniques with Hi-Lo plus ace tracking. Leverages youth and charm for incredible camouflage.",
  },
  {
    id: "tommy-wong",
    name: "Tommy Wong",
    nickname: "The Tourist",
    bankrollLevel: "low",
    bankroll: 6000,
    countingSystem: "ko",
    bettingStyle: "wonging",
    specialFeatures: ["Unbalanced count", "No true count needed", "Wong out strategy"],
    minBet: 5,
    maxBet: 60,
    betSpreadRatio: 12,
    coverStrategy: "Quiet Asian tourist who only plays one spot and drinks tea",
    inspiredBy: "Stanford Wong",
    style: "Modern low-roller using KO",
    description:
      "Masters the KO count system for its simplicity and power. Blends in perfectly as a casual tourist player.",
  },

  // Mid-Stakes Professional Archetypes ($25k–$100k bankroll)
  {
    id: "kevin-upton",
    name: "Dr. Kevin Upton",
    nickname: "The Professor",
    bankrollLevel: "mid",
    bankroll: 50000,
    countingSystem: "hi-opt-ii",
    bettingStyle: "kelly",
    specialFeatures: ["Level-3 count", "Team signals", "Disguises"],
    minBet: 25,
    maxBet: 400,
    betSpreadRatio: 16,
    coverStrategy: "Wears disguises (fake beard, glasses), uses team big-player signals",
    inspiredBy: "Ken Uston",
    style: "Brilliant mathematician with team coordination",
    description:
      "Uses the powerful Hi-Opt II system with ace side counts. Employs sophisticated team tactics and disguises.",
  },
  {
    id: "al-francesco",
    name: "Al 'The Suit' Francesco",
    nickname: "The Big Player",
    bankrollLevel: "mid",
    bankroll: 75000,
    countingSystem: "hi-opt-i",
    bettingStyle: "aggressive",
    specialFeatures: ["Ace side count", "Big player role", "High-roller image"],
    minBet: 100,
    maxBet: 2000,
    betSpreadRatio: 20,
    coverStrategy: "Flashy businessman in Armani, tips $100 chips to cocktail waitresses",
    inspiredBy: "Al Francesco (1970s legend)",
    style: "Original big player",
    description:
      "Invented the team big-player concept in the 1970s. Plays the high-roller role with style and sophistication.",
  },
  {
    id: "james-grosjean",
    name: "James 'Ghost' Grosjean",
    nickname: "The Ghost",
    bankrollLevel: "mid",
    bankroll: 100000,
    countingSystem: "hi-lo",
    bettingStyle: "kelly",
    specialFeatures: ["Full illustrious 18", "Hole-card play", "Heat avoidance"],
    minBet: 100,
    maxBet: 1500,
    betSpreadRatio: 15,
    coverStrategy: "Leaves immediately when penetration drops below 75% or heat appears",
    inspiredBy: "James Grosjean",
    style: "Elite advantage player",
    description:
      "Only plays perfect games with ideal conditions. Master of multiple advantage play techniques beyond counting.",
  },

  // High-Roller / Whale Archetypes ($250k+ bankroll)
  {
    id: "don-johnson",
    name: "Don 'The Don' Johnson",
    nickname: "The Whale",
    bankrollLevel: "high",
    bankroll: 500000,
    countingSystem: "hi-lo",
    bettingStyle: "flat",
    specialFeatures: ["Loss rebates", "Rule negotiations", "Whale image"],
    minBet: 100,
    maxBet: 500,
    betSpreadRatio: 4,
    coverStrategy: "Negotiates 20% loss rebates and special rules with casino management",
    inspiredBy: "Don Johnson (beat AC for $15M+)",
    style: "Ultra high-roller with negotiation power",
    description:
      "Beat Atlantic City for $15 million using loss rebates and negotiated rules. Plays simple Hi-Lo with massive bankroll.",
  },
  {
    id: "zoltan-hungarian",
    name: "Zoltan 'The Hungarian'",
    nickname: "The European",
    bankrollLevel: "high",
    bankroll: 300000,
    countingSystem: "zen",
    bettingStyle: "aggressive",
    specialFeatures: ["International play", "Multiple languages", "Eccentric cover"],
    minBet: 50,
    maxBet: 1000,
    betSpreadRatio: 20,
    coverStrategy: "Chain-smokes, speaks broken English, wears loud shirts",
    inspiredBy: "European traveling pros",
    style: "Modern European traveling pro",
    description:
      "Travels the world hitting casinos from Monte Carlo to Macau. Uses advanced Zen count with perfect eccentric cover.",
  },
]

export function getCharactersByBankroll(level: BankrollLevel): CharacterProfile[] {
  return CHARACTERS.filter((char) => char.bankrollLevel === level)
}

export function getCharacterById(id: string): CharacterProfile | undefined {
  return CHARACTERS.find((char) => char.id === id)
}
