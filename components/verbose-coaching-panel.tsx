"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Volume2,
  VolumeX,
  GraduationCap,
  TrendingUp,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Hash,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Hand, GameSettings, Card, Player } from "@/lib/types"
import { calculateHandValue, canDouble, canSplit } from "@/lib/blackjack"
import { getBasicStrategyAdvice } from "@/lib/basic-strategy"
import { calculateBetAmount, bettingStyles } from "@/lib/betting-styles"
import { getIndexPlay, calculatePlayerEdge } from "@/lib/index-plays"
import { getHouseEdgeFromSettings } from "@/lib/rule-variants"
import type { BettingStyle } from "@/lib/types"
import { countingSystems } from "@/lib/card-counting"

function calculateOdds(handValue: number, trueCount: number, decksRemaining: number) {
  const cardsPerDeck = 52
  const totalCards = Math.round(decksRemaining * cardsPerDeck)

  const baseTenPercent = 30.77
  const baseAcePercent = 7.69
  const baseLowPercent = 38.46

  const countAdjustment = trueCount * 0.5

  const adjustedTenPercent = Math.min(45, Math.max(20, baseTenPercent + countAdjustment))
  const adjustedAcePercent = Math.min(12, Math.max(4, baseAcePercent + countAdjustment * 0.25))
  const adjustedLowPercent = Math.min(50, Math.max(25, baseLowPercent - countAdjustment))

  let bustPercent = 0
  const safeCardMax = 21 - handValue

  if (handValue >= 21) {
    bustPercent = 0
  } else if (handValue >= 12) {
    if (safeCardMax >= 10) {
      bustPercent = 0
    } else if (safeCardMax >= 9) {
      bustPercent = adjustedTenPercent
    } else if (safeCardMax >= 8) {
      bustPercent = adjustedTenPercent + 7.69
    } else if (safeCardMax >= 7) {
      bustPercent = adjustedTenPercent + 15.38
    } else if (safeCardMax >= 6) {
      bustPercent = adjustedTenPercent + 23.08
    } else if (safeCardMax >= 5) {
      bustPercent = 100 - adjustedLowPercent + 7.69
    } else if (safeCardMax >= 4) {
      bustPercent = 100 - adjustedLowPercent + 15.38
    } else if (safeCardMax >= 3) {
      bustPercent = 100 - adjustedLowPercent + 23.08
    } else if (safeCardMax >= 2) {
      bustPercent = 100 - 7.69
    } else {
      bustPercent = 100
    }
  }

  const dealerBustByUpCard: Record<number, number> = {
    2: 35.3,
    3: 37.6,
    4: 40.3,
    5: 42.9,
    6: 42.1,
    7: 26.2,
    8: 23.9,
    9: 23.3,
    10: 21.4,
    11: 11.7,
  }

  return {
    bustPercent: Math.round(bustPercent),
    safePercent: Math.round(100 - bustPercent),
    highCardPercent: Math.round(adjustedTenPercent + adjustedAcePercent),
    lowCardPercent: Math.round(adjustedLowPercent),
    tenPercent: Math.round(adjustedTenPercent),
    acePercent: Math.round(adjustedAcePercent),
    getDealerBustPercent: (upCard: number) => dealerBustByUpCard[upCard] || 25,
  }
}

function generateCountExplanation(
  allVisibleCards: Card[],
  countingSystem: GameSettings["countingSystem"],
  runningCount: number,
  decksRemaining: number,
): string {
  const system = countingSystems[countingSystem]
  const systemName = system.name

  if (allVisibleCards.length === 0) {
    return ""
  }

  const lowCards: string[] = []
  const highCards: string[] = []
  const neutralCards: string[] = []

  let totalCount = 0

  for (const card of allVisibleCards) {
    if (!card.faceUp) continue
    const value = system.values[card.rank]
    totalCount += value

    const cardName = card.rank === "10" ? "10" : card.rank
    if (value > 0) {
      lowCards.push(`${cardName}${value > 1 ? ` (+${value})` : ""}`)
    } else if (value < 0) {
      highCards.push(`${cardName}${value < -1 ? ` (${value})` : ""}`)
    } else {
      neutralCards.push(cardName)
    }
  }

  let explanation = `Using ${systemName}: `

  if (lowCards.length > 0) {
    const lowCount = lowCards.length
    explanation += `I see ${lowCount} low card${lowCount > 1 ? "s" : ""} (${lowCards.join(", ")}) - that's plus ${lowCards.reduce(
      (sum, c) => {
        const match = c.match(/\+(\d+)/)
        return sum + (match ? Number.parseInt(match[1]) : 1)
      },
      0,
    )}. `
  }

  if (highCards.length > 0) {
    const highCount = highCards.length
    explanation += `I see ${highCount} high card${highCount > 1 ? "s" : ""} (${highCards.join(", ")}) - that's minus ${Math.abs(
      highCards.reduce((sum, c) => {
        const match = c.match(/-(\d+)/)
        return sum + (match ? -Number.parseInt(match[1]) : -1)
      }, 0),
    )}. `
  }

  if (neutralCards.length > 0) {
    explanation += `The ${neutralCards.join(", ")} ${neutralCards.length > 1 ? "are" : "is"} neutral (0). `
  }

  explanation += `Running count is now ${runningCount >= 0 ? "+" : ""}${runningCount}. `

  if (system.needsTrueCount && decksRemaining > 0) {
    const trueCount = Math.round((runningCount / decksRemaining) * 10) / 10
    explanation += `Divide by ${decksRemaining.toFixed(1)} decks remaining = true count of ${trueCount >= 0 ? "+" : ""}${trueCount.toFixed(1)}. `

    if (trueCount >= 2) {
      explanation += `That's in our favor - increase bets to ${Math.min(8, Math.max(1, Math.floor(trueCount)))}x minimum!`
    } else if (trueCount >= 1) {
      explanation += `Slightly favorable - bet 1-2x minimum.`
    } else if (trueCount <= -2) {
      explanation += `That favors the house - bet minimum or consider leaving.`
    } else {
      explanation += `Neutral count - stick with minimum bets.`
    }
  }

  return explanation
}

interface VerboseCoachingPanelProps {
  playerHand: Hand
  dealerUpCard: Card | null
  dealerHand: Hand | null
  trueCount: number
  runningCount: number
  decksRemaining: number
  minBet: number
  maxBet: number
  bankroll: number
  bettingStyle: BettingStyle
  lastBet: number
  lastHandWon: boolean
  phase: string
  visible: boolean
  settings: GameSettings
  readAloud: boolean
  onToggleReadAloud: (enabled: boolean) => void
  allPlayers?: Player[]
  isHumanTurn?: boolean
}

export function VerboseCoachingPanel({
  playerHand,
  dealerUpCard,
  dealerHand,
  trueCount,
  runningCount,
  decksRemaining,
  minBet,
  maxBet,
  bankroll,
  bettingStyle,
  lastBet,
  lastHandWon,
  phase,
  visible,
  settings,
  readAloud,
  onToggleReadAloud,
  allPlayers = [],
  isHumanTurn = false,
}: VerboseCoachingPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [currentMessage, setCurrentMessage] = useState<string>("")
  const lastSpokenRef = useRef<string>("")
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const baseHouseEdge = getHouseEdgeFromSettings(settings)
  const playerEdge = calculatePlayerEdge(trueCount, baseHouseEdge)
  const handValue = playerHand.cards.length > 0 ? calculateHandValue(playerHand.cards) : null

  const dealerValue = dealerUpCard
    ? dealerUpCard.rank === "A"
      ? 11
      : ["J", "Q", "K"].includes(dealerUpCard.rank)
        ? 10
        : Number.parseInt(dealerUpCard.rank)
    : null

  const advice =
    dealerUpCard && playerHand.cards.length > 0
      ? getBasicStrategyAdvice(
          playerHand.cards,
          dealerUpCard,
          canSplit(playerHand),
          canDouble(playerHand),
          settings.allowDoubleAfterSplit,
        )
      : null

  const indexPlay =
    dealerUpCard && playerHand.cards.length > 0
      ? getIndexPlay(
          handValue?.value || 0,
          playerHand.cards,
          dealerUpCard.rank === "A"
            ? 11
            : ["J", "Q", "K"].includes(dealerUpCard.rank)
              ? 10
              : Number.parseInt(dealerUpCard.rank),
          trueCount,
          settings.lateSurrender,
        )
      : null

  const suggestedBetResult = calculateBetAmount(trueCount, minBet, maxBet, bankroll, bettingStyle, lastBet, lastHandWon)
  const suggestedBet = suggestedBetResult.amount
  const betReason = suggestedBetResult.reason

  const odds = handValue ? calculateOdds(handValue.value, trueCount, decksRemaining) : null

  const allVisibleCards: Card[] = []

  // Add dealer's face-up cards
  if (dealerHand) {
    for (const card of dealerHand.cards) {
      if (card.faceUp) {
        allVisibleCards.push(card)
      }
    }
  }

  // Add all players' cards
  for (const player of allPlayers) {
    for (const hand of player.hands) {
      for (const card of hand.cards) {
        if (card.faceUp) {
          allVisibleCards.push(card)
        }
      }
    }
  }

  const countExplanation = settings.countAloud
    ? generateCountExplanation(allVisibleCards, settings.countingSystem, runningCount, decksRemaining)
    : ""

  const speakText = (text: string) => {
    if (!readAloud || typeof window === "undefined" || !window.speechSynthesis || !isHumanTurn) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = settings.speechSpeed ?? 1.25
    utterance.pitch = 1.0
    utterance.volume = 1.0
    speechSynthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const coachingContent: { title: string; content: string; icon: React.ReactNode }[] = []

  if (settings.countAloud && countExplanation && phase === "player-turn") {
    coachingContent.push({
      title: "Counting the Cards",
      content: countExplanation,
      icon: <Hash className="w-4 h-4 text-purple-400" />,
    })
  }

  const getCountBasedMultiplier = (tc: number): number => {
    if (tc >= 5) return 8
    if (tc >= 4) return 6
    if (tc >= 3) return 4
    if (tc >= 2) return 2
    if (tc >= 1) return 1
    return 1
  }

  const countBasedMultiplier = getCountBasedMultiplier(trueCount)
  const countBasedBet = Math.min(minBet * countBasedMultiplier, maxBet)

  if (phase === "betting") {
    const styleInfo = bettingStyles[bettingStyle]
    const edgePercent = playerEdge.toFixed(2)

    let betExplanation = ""
    if (trueCount >= 2) {
      const strategyBet = suggestedBet
      const strategyMultiplier = minBet > 0 ? Math.round(strategyBet / minBet) : 1

      if (bettingStyle === "flat") {
        // Flat betting selected but count is favorable - give count-based advice
        betExplanation = `The true count is +${trueCount}, giving you a ${edgePercent}% edge! With this advantage, optimal play is to bet ${countBasedMultiplier}x minimum ($${countBasedBet.toLocaleString()}). However, you have Flat Betting selected which bets $${minBet.toLocaleString()} every hand. Consider switching to Kelly or Conservative spread to capitalize on favorable counts!`
      } else {
        betExplanation = `The true count is +${trueCount}, giving you a ${edgePercent}% edge! This is the time to increase your bet. Using the ${styleInfo?.name || "current"} strategy, bet $${strategyBet.toLocaleString()} (${strategyMultiplier}x minimum). ${betReason}`
      }
    } else if (trueCount >= 1) {
      const betMultiplier = minBet > 0 ? Math.round(suggestedBet / minBet) : 1
      betExplanation = `The true count is +${trueCount}, a slight advantage (${edgePercent}% edge). The ${styleInfo?.name || "current"} strategy suggests betting $${suggestedBet.toLocaleString()} (${betMultiplier}x minimum). Stay patient - bigger counts will come.`
    } else if (trueCount <= -2) {
      betExplanation = `The true count is ${trueCount}, meaning the house has the edge (${edgePercent}% player edge). Bet the minimum ($${minBet.toLocaleString()}) to preserve your bankroll. Some pros would "wong out" (leave) at this count.`
    } else {
      betExplanation = `The count is neutral (${trueCount >= 0 ? "+" : ""}${trueCount}). Player edge is ${edgePercent}%. Bet minimum ($${minBet.toLocaleString()}) and wait for the count to swing in your favor.`
    }

    coachingContent.push({
      title: "Betting Strategy",
      content: betExplanation,
      icon: <TrendingUp className="w-4 h-4 text-neon-gold" />,
    })
  }

  if (phase === "insurance") {
    let insuranceAdvice = ""
    if (trueCount >= 3) {
      insuranceAdvice = `TAKE INSURANCE! At a true count of +${trueCount}, there are enough 10-value cards remaining to make insurance profitable. The 2:1 payout beats the odds when TC >= +3.`
    } else {
      insuranceAdvice = `DECLINE INSURANCE. At a true count of ${trueCount}, insurance is a losing bet. The dealer needs a 10 underneath, and there aren't enough remaining to make the 2:1 payout profitable. Insurance has a 5-7% house edge at neutral counts!`
    }
    coachingContent.push({
      title: trueCount >= 3 ? "Take Insurance" : "No Insurance",
      content: insuranceAdvice,
      icon: <Target className="w-4 h-4 text-cyan-400" />,
    })
  }

  if (phase === "player-turn" && advice) {
    const actionExplanations: Record<string, string> = {
      H: `HIT - Your ${handValue?.value} against dealer's ${dealerValue} is weak. ${dealerValue && dealerValue >= 7 ? "The dealer likely has a strong hand (17+), so you need to improve." : "Even though the dealer shows a weak card, your hand needs improvement."}`,
      S: `STAND - Your ${handValue?.value} is strong enough. ${dealerValue && dealerValue <= 6 ? `The dealer shows ${dealerValue}, a "bust card." Let them draw and potentially bust.` : "Taking another card risks busting."}`,
      D: `DOUBLE DOWN - Perfect situation! Your ${handValue?.value} against dealer's ${dealerValue} is ideal for doubling. You'll get exactly one more card with 2x the bet. ${handValue?.value === 11 ? "With 11, any card helps and a 10 gives you 21!" : handValue?.value === 10 ? "With 10, you're hoping for a face card or ace." : "The math strongly favors this play."}`,
      P: `SPLIT - You have a pair! Splitting ${playerHand.cards[0]?.rank}s against dealer's ${dealerValue} gives you two chances to win. ${playerHand.cards[0]?.rank === "A" ? "Aces are always split - two chances at 21!" : playerHand.cards[0]?.rank === "8" ? "Always split 8s - 16 is the worst hand, but two 8s have potential." : "This split improves your expected value."}`,
      R: `SURRENDER - This is a losing hand (${handValue?.value} vs ${dealerValue}). Surrendering saves half your bet. It's better to lose $${(playerHand.bet / 2).toFixed(0)} now than likely lose $${playerHand.bet} playing it out.`,
    }

    const rawAction = indexPlay?.indexAction || advice.action
    // Normalize action to single letter for comparison
    const actionMap: Record<string, string> = {
      H: "H",
      hit: "H",
      S: "S",
      stand: "S",
      D: "D",
      double: "D",
      P: "P",
      split: "P",
      R: "R",
      surrender: "R",
    }
    const normalizedAction = actionMap[rawAction] || "H"

    // If surrender is suggested but not allowed at this casino, fall back to hit
    const action = normalizedAction === "R" && !settings.lateSurrender ? "H" : normalizedAction

    const actionNames: Record<string, string> = {
      H: "HIT",
      S: "STAND",
      D: "DOUBLE",
      P: "SPLIT",
      R: "SURRENDER",
    }

    coachingContent.push({
      title: `Play: ${actionNames[action] || "HIT"}`,
      content:
        actionExplanations[action] ||
        `Basic strategy says: ${action === "H" ? "hit" : action === "S" ? "stand" : action === "D" ? "double" : action === "P" ? "split" : "surrender"}`,
      icon: <Target className="w-4 h-4 text-cyan-400" />,
    })

    if (indexPlay?.isDeviation) {
      coachingContent.push({
        title: `Deviation: ${actionNames[indexPlay.deviationAction] || "HIT"}`,
        content: `INDEX PLAY DEVIATION! Basic strategy says ${actionNames[advice.action] || "HIT"}, but with a true count of ${trueCount >= 0 ? "+" : ""}${trueCount}, the math changes. ${indexPlay.explanation} This deviation gains approximately +${((indexPlay.expectedGain || 0) * 100).toFixed(2)}% edge. These are the advanced plays that separate pros from amateurs!`,
        icon: <Lightbulb className="w-4 h-4 text-yellow-400" />,
      })
    }

    // Add odds section
    if (odds && handValue && handValue.value < 21) {
      let oddsExplanation = `Bust probability: ${odds.bustPercent.toFixed(0)}% chance of busting if you hit. `
      oddsExplanation += `Safe card probability: ${odds.safePercent.toFixed(0)}% chance of a safe card. `
      oddsExplanation += `Card distribution (adjusted for count): ${odds.highCardPercent.toFixed(0)}% high cards (10,J,Q,K,A), ${odds.lowCardPercent.toFixed(0)}% low cards (2-6). `

      if (dealerValue) {
        oddsExplanation += `Dealer shows ${dealerValue} with ${odds.getDealerBustPercent(dealerValue).toFixed(0)}% chance of busting. `

        // Explain the decision math
        if (action === "S") {
          oddsExplanation += `Standing makes sense because your ${odds.bustPercent.toFixed(0)}% bust risk is worse than waiting for dealer to play.`
        } else if (action === "H") {
          oddsExplanation += `Hitting makes sense because ${odds.safePercent.toFixed(0)}% safe card odds beat standing with ${handValue.value} against dealer's ${dealerValue}.`
        }
      }

      coachingContent.push({
        title: "The Math & Odds",
        content: oddsExplanation,
        icon: <BarChart3 className="w-4 h-4 text-green-400" />,
      })
    }
  }

  useEffect(() => {
    // Only allow speech during betting phase or when it's the human player's turn
    const canSpeak = phase === "betting" || phase === "insurance" || (phase === "player-turn" && isHumanTurn)

    if (!canSpeak) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      return
    }

    if (!readAloud || coachingContent.length === 0) return

    let textToSpeak = ""

    if (phase === "player-turn" && isHumanTurn && settings.countAloud && countExplanation) {
      textToSpeak += countExplanation + " "
    }

    if (phase === "player-turn" && isHumanTurn) {
      const playContent = coachingContent.find((c) => c.title.startsWith("Play:"))
      const oddsContent = coachingContent.find((c) => c.title === "The Math & Odds")
      const deviationContent = coachingContent.find((c) => c.title.startsWith("Deviation:"))

      if (playContent) textToSpeak += playContent.content + " "
      if (deviationContent) textToSpeak += deviationContent.content + " "
      if (oddsContent) textToSpeak += oddsContent.content + " "
    } else if (phase === "betting" || phase === "insurance") {
      textToSpeak = coachingContent[0]?.content || ""
    }

    if (textToSpeak && textToSpeak !== lastSpokenRef.current) {
      lastSpokenRef.current = textToSpeak
      speakText(textToSpeak)
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [phase, trueCount, advice?.action, readAloud, coachingContent, countExplanation, settings.countAloud, isHumanTurn])

  if (!visible) return null

  return (
    <div className="glass-panel rounded-lg md:rounded-xl overflow-hidden max-h-[40vh] md:max-h-[60vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 md:p-3 border-b border-slate-700/50 sticky top-0 bg-slate-900/95 z-10">
        <div className="flex items-center gap-1.5 md:gap-2">
          <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
          <span className="text-sm md:text-base font-semibold text-cyan-400">Card Counting Coach</span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={() => onToggleReadAloud(!readAloud)}
            className={cn(
              "p-1.5 md:p-2 rounded-lg transition-colors",
              readAloud ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300",
            )}
          >
            {readAloud ? (
              <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
          </button>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 md:p-2 text-slate-400 hover:text-white">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-2 md:p-3 space-y-2 md:space-y-3 overflow-y-auto flex-1">
          {coachingContent.map((section, index) => (
            <div
              key={index}
              onClick={() => {
                if (readAloud) {
                  // Cancel any ongoing speech and speak this section
                  window.speechSynthesis?.cancel()
                  const textToSpeak = `${section.title}. ${section.content}`
                  const utterance = new SpeechSynthesisUtterance(textToSpeak)
                  utterance.rate = settings.speechSpeed ?? 1.25
                  utterance.pitch = 1.0
                  utterance.volume = 1.0
                  window.speechSynthesis?.speak(utterance)
                }
              }}
              className={cn(
                "space-y-0.5 md:space-y-1",
                index > 0 && "pt-1.5 md:pt-2 border-t border-slate-700/30",
                readAloud && "cursor-pointer hover:bg-slate-700/30 rounded-lg p-1.5 -m-1.5 transition-colors",
              )}
              title={readAloud ? "Click to replay this section" : undefined}
            >
              <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium text-slate-300">
                {section.icon}
                {section.title}
                {readAloud && <Volume2 className="w-3 h-3 text-slate-500 ml-auto opacity-0 group-hover:opacity-100" />}
              </div>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
