export type Suit = "♠" | "♥" | "♦" | "♣"
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K"

export interface Card {
  suit: Suit
  rank: Rank
  faceUp: boolean
}

export interface Hand {
  cards: Card[]
  bet: number
  isActive: boolean
  isDoubled: boolean
  isSplit: boolean
}

export type CountingSystem = "hi-lo" | "ko" | "hi-opt-i" | "hi-opt-ii" | "zen" | "omega-ii" | "halves"

export interface CountingSystemConfig {
  name: string
  description: string
  level: number
  needsTrueCount: boolean
  needsAceSideCount: boolean
  values: Record<Rank, number>
}

export type PlayerType = "human" | "npc"

export interface Player {
  id: string
  name: string
  type: PlayerType
  seatNumber: number
  hands: Hand[]
  currentHandIndex: number
  bankroll: number
  currentBet: number
  isActive: boolean
  insuranceBet?: number
}

export type BettingStyle =
  | "flat" // Same bet every hand
  | "kelly" // Kelly Criterion based on count
  | "aggressive" // Large spread, rapid escalation
  | "conservative" // Small spread, slow ramp
  | "martingale" // Double after loss (not recommended)
  | "oscar" // Oscar's Grind system
  | "wonging" // Only play positive counts

export interface BettingStyleConfig {
  name: string
  description: string
  spreadMultiplier: number // How aggressive the spread is
  minCountToPlay: number // Minimum true count to play (for wonging)
  riskLevel: "low" | "medium" | "high"
}

export interface GameSettings {
  numberOfDecks: 1 | 2 | 6 | 8
  penetrationPercent: number
  minBet: number
  maxBet: number
  bankroll: number
  allowSplit: boolean
  allowDouble: boolean
  allowDoubleAfterSplit: boolean
  dealerHitsSoft17: boolean
  numberOfPlayers: number
  countingSystem: CountingSystem
  showCount: boolean
  showDownCards: boolean
  showCoaching: boolean
  showOdds: boolean
  showPlayerStats: boolean // Added showPlayerStats setting
  showVerboseCoaching: boolean // Added verbose coaching setting
  readAloud: boolean // Added read aloud setting
  countAloud: boolean // Added countAloud setting for verbal count explanation
  speechSpeed: number // Added speechSpeed setting for Read Aloud speed control
  playWithNPCs: boolean
  numberOfSeats: number
  playerSeat: number
  playSpeed: "slow" | "normal" | "fast"
  casinoName?: string
  lateSurrender: boolean
  resplitAces: boolean
  maxResplitHands: number
  bettingStyle: BettingStyle // Added betting style to game settings
  showIndexPlays: boolean // Added toggle for showing index plays
}

export type GamePhase = "setup" | "betting" | "dealing" | "insurance" | "player-turn" | "dealer-turn" | "round-end"

export interface GameState {
  phase: GamePhase
  shoe: Card[]
  dealerHand: Hand
  players: Player[]
  currentPlayerIndex: number
  runningCount: number
  trueCount: number
  decksRemaining: number
  settings: GameSettings
  allPlayersWin?: boolean // Added to track if all players won for dealer bust messaging
}

export interface ShoeState {
  cards: Card[]
  originalCount: number
  burnedCards: Card[]
  cutPosition: number
  isShuffled: boolean
  isReady: boolean
  penetrationMarkerPosition: number
}
