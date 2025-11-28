export interface IndexPlay {
  situation: string
  basicAction: "hit" | "stand" | "double" | "split" | "surrender"
  indexAction: "hit" | "stand" | "double" | "split" | "surrender"
  index: number // True count threshold
  description: string
  edgeGain: string // Approximate edge gained by this play
}

// The Illustrious 18 - most important index plays for Hi-Lo
export const ILLUSTRIOUS_18: IndexPlay[] = [
  {
    situation: "16 vs 10",
    basicAction: "hit",
    indexAction: "stand",
    index: 0,
    description: "Stand on 16 vs dealer 10 when TC ≥ 0",
    edgeGain: "+0.10%",
  },
  {
    situation: "15 vs 10",
    basicAction: "hit",
    indexAction: "stand",
    index: 4,
    description: "Stand on 15 vs dealer 10 when TC ≥ +4",
    edgeGain: "+0.08%",
  },
  {
    situation: "10,10 vs 5",
    basicAction: "stand",
    indexAction: "split",
    index: 5,
    description: "Split 10s vs dealer 5 when TC ≥ +5",
    edgeGain: "+0.07%",
  },
  {
    situation: "10,10 vs 6",
    basicAction: "stand",
    indexAction: "split",
    index: 4,
    description: "Split 10s vs dealer 6 when TC ≥ +4",
    edgeGain: "+0.08%",
  },
  {
    situation: "10 vs 10",
    basicAction: "hit",
    indexAction: "double",
    index: 4,
    description: "Double 10 vs dealer 10 when TC ≥ +4",
    edgeGain: "+0.05%",
  },
  {
    situation: "12 vs 3",
    basicAction: "hit",
    indexAction: "stand",
    index: 2,
    description: "Stand on 12 vs dealer 3 when TC ≥ +2",
    edgeGain: "+0.04%",
  },
  {
    situation: "12 vs 2",
    basicAction: "hit",
    indexAction: "stand",
    index: 3,
    description: "Stand on 12 vs dealer 2 when TC ≥ +3",
    edgeGain: "+0.03%",
  },
  {
    situation: "11 vs A",
    basicAction: "hit",
    indexAction: "double",
    index: 1,
    description: "Double 11 vs dealer Ace when TC ≥ +1",
    edgeGain: "+0.05%",
  },
  {
    situation: "9 vs 2",
    basicAction: "hit",
    indexAction: "double",
    index: 1,
    description: "Double 9 vs dealer 2 when TC ≥ +1",
    edgeGain: "+0.03%",
  },
  {
    situation: "10 vs A",
    basicAction: "hit",
    indexAction: "double",
    index: 4,
    description: "Double 10 vs dealer Ace when TC ≥ +4",
    edgeGain: "+0.04%",
  },
  {
    situation: "9 vs 7",
    basicAction: "hit",
    indexAction: "double",
    index: 3,
    description: "Double 9 vs dealer 7 when TC ≥ +3",
    edgeGain: "+0.02%",
  },
  {
    situation: "16 vs 9",
    basicAction: "hit",
    indexAction: "stand",
    index: 5,
    description: "Stand on 16 vs dealer 9 when TC ≥ +5",
    edgeGain: "+0.03%",
  },
  {
    situation: "13 vs 2",
    basicAction: "stand",
    indexAction: "hit",
    index: -1,
    description: "Hit 13 vs dealer 2 when TC ≤ -1",
    edgeGain: "+0.02%",
  },
  {
    situation: "12 vs 4",
    basicAction: "stand",
    indexAction: "hit",
    index: 0,
    description: "Hit 12 vs dealer 4 when TC ≤ 0",
    edgeGain: "+0.02%",
  },
  {
    situation: "12 vs 5",
    basicAction: "stand",
    indexAction: "hit",
    index: -2,
    description: "Hit 12 vs dealer 5 when TC ≤ -2",
    edgeGain: "+0.02%",
  },
  {
    situation: "13 vs 3",
    basicAction: "stand",
    indexAction: "hit",
    index: -2,
    description: "Hit 13 vs dealer 3 when TC ≤ -2",
    edgeGain: "+0.02%",
  },
  {
    situation: "A,8 vs 5",
    basicAction: "stand",
    indexAction: "double",
    index: 1,
    description: "Double soft 19 vs dealer 5 when TC ≥ +1",
    edgeGain: "+0.01%",
  },
  {
    situation: "A,8 vs 6",
    basicAction: "stand",
    indexAction: "double",
    index: 1,
    description: "Double soft 19 vs dealer 6 when TC ≥ +1",
    edgeGain: "+0.01%",
  },
]

// Fab 4 - most important surrender plays
export const FAB_4: IndexPlay[] = [
  {
    situation: "16 vs 10",
    basicAction: "hit",
    indexAction: "surrender",
    index: 0,
    description: "Surrender 16 vs dealer 10 when TC ≥ 0",
    edgeGain: "+0.07%",
  },
  {
    situation: "16 vs 9",
    basicAction: "hit",
    indexAction: "surrender",
    index: 2,
    description: "Surrender 16 vs dealer 9 when TC ≥ +2",
    edgeGain: "+0.02%",
  },
  {
    situation: "15 vs 10",
    basicAction: "hit",
    indexAction: "surrender",
    index: 0,
    description: "Surrender 15 vs dealer 10 when TC ≥ 0",
    edgeGain: "+0.06%",
  },
  {
    situation: "15 vs A",
    basicAction: "hit",
    indexAction: "surrender",
    index: 1,
    description: "Surrender 15 vs dealer Ace when TC ≥ +1",
    edgeGain: "+0.03%",
  },
]

export function getIndexPlay(
  playerValue: number,
  playerCards: { rank: string }[],
  dealerValue: number,
  trueCount: number,
  surrenderAllowed: boolean,
): IndexPlay | null {
  // Check if hand is a pair
  const isPair = playerCards.length === 2 && playerCards[0].rank === playerCards[1].rank

  // Build situation string
  let situation = ""

  if (isPair && playerCards[0].rank === "10") {
    situation = `10,10 vs ${dealerValue}`
  } else if (playerCards.length === 2 && playerCards.some((c) => c.rank === "A")) {
    // Soft hand
    const otherCard = playerCards.find((c) => c.rank !== "A")
    if (otherCard) {
      situation = `A,${otherCard.rank} vs ${dealerValue}`
    }
  } else {
    // Hard hand
    situation = `${playerValue} vs ${dealerValue}`
  }

  // Check Fab 4 surrender plays first if surrender is allowed
  if (surrenderAllowed) {
    const fab4Play = FAB_4.find((play) => play.situation === situation)
    if (fab4Play && trueCount >= fab4Play.index) {
      return fab4Play
    }
  }

  // Check Illustrious 18
  const i18Play = ILLUSTRIOUS_18.find((play) => play.situation === situation)
  if (i18Play) {
    // Check if true count meets threshold for deviation
    if (i18Play.index >= 0 && trueCount >= i18Play.index) {
      return i18Play
    } else if (i18Play.index < 0 && trueCount <= i18Play.index) {
      return i18Play
    }
  }

  return null
}

// Calculate player's edge based on true count
export function calculatePlayerEdge(
  trueCount: number,
  baseHouseEdge: number, // House edge from casino rules
): number {
  // Each true count point is worth approximately +0.5% player advantage
  const countAdvantage = trueCount * 0.5

  // Player edge = count advantage - house edge
  const playerEdge = countAdvantage - baseHouseEdge

  return Math.round(playerEdge * 100) / 100 // Round to 2 decimals
}

// Get optimal bet multiplier based on player edge and Kelly Criterion
export function getOptimalBetMultiplier(playerEdge: number, bankroll: number, unitSize: number): number {
  if (playerEdge <= 0) return 1 // Min bet when no advantage

  // Kelly Criterion: bet = (edge / variance) * bankroll
  // Blackjack variance ≈ 1.3
  const variance = 1.3
  const kellyFraction = playerEdge / 100 / variance

  // Use half-Kelly for safety (less aggressive)
  const halfKelly = kellyFraction / 2

  // Calculate bet as fraction of bankroll
  const optimalBet = Math.floor((halfKelly * bankroll) / unitSize)

  // Limit to reasonable spread (1-20 units)
  return Math.max(1, Math.min(20, optimalBet))
}
