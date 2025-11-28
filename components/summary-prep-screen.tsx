"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Table,
  BookOpen,
  Calculator,
  Brain,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
  Info,
  Loader2,
} from "lucide-react"
import type { CasinoRules } from "@/lib/casinos"
import type { CharacterProfile } from "@/lib/characters"
import type { TableSelection } from "@/components/table-selector"
import { countingSystems } from "@/lib/card-counting"
import { bettingStyles } from "@/lib/betting-styles"
import { ILLUSTRIOUS_18, FAB_4 } from "@/lib/index-plays"

interface SummaryPrepScreenProps {
  casino: CasinoRules | null
  character: CharacterProfile | null
  tableSelection: TableSelection | null
  onStartGame: () => void
  onBack: () => void
}

// Basic Strategy Mnemonics
const BASIC_STRATEGY_MNEMONICS = [
  {
    rule: "Always split Aces and 8s",
    mnemonic: "Aces and Eights - Don't Hesitate!",
    explanation: "Aces give you two chances at 21, and 16 (pair of 8s) is the worst hand in blackjack.",
  },
  {
    rule: "Never split 10s or 5s",
    mnemonic: "Tens stay together, Fives never sever",
    explanation: "20 is almost unbeatable. Two 5s = 10, which is great for doubling.",
  },
  {
    rule: "Stand on hard 17+",
    mnemonic: "17 is heaven, never hit it",
    explanation: "Risk of busting is too high. Even against dealer's strong card.",
  },
  {
    rule: "Hit on hard 12 vs 2-3",
    mnemonic: "Twelve vs Two or Three - Hit and Be Free",
    explanation: "Dealer's 2 and 3 aren't weak enough to stand on 12.",
  },
  {
    rule: "Double on 11 always",
    mnemonic: "Eleven is golden - Double and be bolden",
    explanation: "Best double down opportunity. Any 10-value card gives you 21.",
  },
  {
    rule: "Stand 13-16 vs 2-6",
    mnemonic: "Stiff vs Stiff - Let the Dealer Riff",
    explanation: "Let the dealer take the bust risk when they have weak cards.",
  },
  {
    rule: "Hit 13-16 vs 7+",
    mnemonic: "Stiff vs Pat - You Must Combat",
    explanation: "Dealer likely has 17+ already. You must try to improve.",
  },
  {
    rule: "Double soft 13-17 vs 5-6",
    mnemonic: "Soft hands are gold when dealer's cold",
    explanation: "Can't bust with soft hands, dealer's 5-6 are bust-prone.",
  },
]

// Card counting practice cards
const PRACTICE_CARDS = [
  { rank: "A", suit: "♠", value: -1 },
  { rank: "2", suit: "♥", value: 1 },
  { rank: "3", suit: "♦", value: 1 },
  { rank: "4", suit: "♣", value: 1 },
  { rank: "5", suit: "♠", value: 1 },
  { rank: "6", suit: "♥", value: 1 },
  { rank: "7", suit: "♦", value: 0 },
  { rank: "8", suit: "♣", value: 0 },
  { rank: "9", suit: "♠", value: 0 },
  { rank: "10", suit: "♥", value: -1 },
  { rank: "J", suit: "♦", value: -1 },
  { rank: "Q", suit: "♣", value: -1 },
  { rank: "K", suit: "♠", value: -1 },
]

export function SummaryPrepScreen({ casino, character, tableSelection, onStartGame, onBack }: SummaryPrepScreenProps) {
  console.log("[v0] SummaryPrepScreen props:", {
    casino: casino?.name ?? "null",
    character: character?.name ?? "null",
    characterCountingSystem: character?.countingSystem ?? "null",
    characterBettingStyle: character?.bettingStyle ?? "null",
    tableSelection: tableSelection?.tableConfig?.name ?? "null",
  })

  const [activeTab, setActiveTab] = useState("overview")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [practiceMode, setPracticeMode] = useState<"learn" | "test">("learn")
  const [practiceCards, setPracticeCards] = useState<typeof PRACTICE_CARDS>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [runningCount, setRunningCount] = useState(0)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  const countingSystem = useMemo(() => {
    console.log("[v0] Looking up counting system for key:", character?.countingSystem)
    if (!character?.countingSystem) return null
    const result = countingSystems[character.countingSystem] ?? null
    console.log("[v0] Counting system lookup result:", result?.name ?? "null")
    return result
  }, [character?.countingSystem])

  const bettingStyle = useMemo(() => {
    console.log("[v0] Looking up betting style for key:", character?.bettingStyle)
    if (!character?.bettingStyle) return null
    const result = bettingStyles[character.bettingStyle] ?? null
    console.log("[v0] Betting style lookup result:", result?.name ?? "null")
    return result
  }, [character?.bettingStyle])

  // Initialize practice cards
  useEffect(() => {
    shufflePracticeCards()
  }, [])

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const shufflePracticeCards = () => {
    const shuffled = [...PRACTICE_CARDS].sort(() => Math.random() - 0.5)
    setPracticeCards(shuffled)
    setCurrentCardIndex(0)
    setRunningCount(0)
    setUserAnswer(null)
    setShowAnswer(false)
    setCorrectCount(0)
    setTotalAttempts(0)
  }

  const getCardCountValue = (rank: string): number => {
    if (!countingSystem) return 0
    return countingSystem.values[rank as keyof typeof countingSystem.values] || 0
  }

  const handleCountAnswer = (answer: number) => {
    if (practiceCards.length === 0) return
    setUserAnswer(answer)
    setShowAnswer(true)
    setTotalAttempts((prev) => prev + 1)

    const correctValue = getCardCountValue(practiceCards[currentCardIndex]?.rank ?? "")
    if (answer === correctValue) {
      setCorrectCount((prev) => prev + 1)
      setRunningCount((prev) => prev + correctValue)
    }
  }

  const nextCard = () => {
    if (currentCardIndex < practiceCards.length - 1) {
      const correctValue = getCardCountValue(practiceCards[currentCardIndex]?.rank ?? "")
      if (!showAnswer) {
        setRunningCount((prev) => prev + correctValue)
      }
      setCurrentCardIndex((prev) => prev + 1)
      setUserAnswer(null)
      setShowAnswer(false)
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.75
      utterance.pitch = 1
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      speechRef.current = utterance
      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const speakOverview = () => {
    if (!casino || !character || !countingSystem || !bettingStyle) return
    const text = `
      Welcome to ${casino.name}. 
      You are playing as ${character.name}, a ${character.bankrollLevel} bankroll player.
      
      Casino Rules: This casino uses ${casino.numberOfDecks} decks.
      The dealer ${casino.dealerHitsSoft17 ? "hits" : "stands"} on soft 17.
      ${casino.lateSurrender ? "Late surrender is allowed." : "Surrender is not allowed."}
      
      Your counting system is ${countingSystem.name}, a level ${countingSystem.level} system.
      ${countingSystem.description}
      
      Your betting style is ${bettingStyle.name}.
      ${bettingStyle.description}
      
      Good luck at the tables!
    `
    speakText(text)
  }

  const speakStrategy = () => {
    if (!casino || !countingSystem) return
    const text = `
      Strategy Guide for ${casino.name}.
      
      Casino Rule Adjustments:
      ${
        casino.dealerHitsSoft17
          ? "The dealer hits on soft 17, which adds about 0.2% to the house edge. This means you should double down on 11 versus Ace, and surrender 15 and 17 versus Ace more often."
          : "The dealer stands on soft 17, which is better for you. Standard basic strategy applies."
      }
      
      ${
        casino.doubleAfterSplit
          ? "Double after split is allowed. This lets you split more aggressively, including 2s and 3s versus 2 through 7, 4s versus 5 and 6, and 6s versus 2 through 6."
          : "Double after split is not allowed. Be more conservative with splits."
      }
      
      ${
        casino.lateSurrender
          ? "Late surrender is available. Surrender 16 versus 9, 10, or Ace, and surrender 15 versus 10."
          : "Surrender is not available at this casino."
      }
      
      ${
        casino.resplitAces
          ? "You can re-split Aces if you get another Ace after splitting. This reduces house edge by about 0.08%."
          : "Re-splitting Aces is not allowed."
      }
      
      Key Basic Strategy Mnemonics:
      Always split Aces and 8s - Aces give you two chances at 21, and 16 is the worst hand.
      Never split 10s or 5s - 20 is almost unbeatable, and two 5s make 10, great for doubling.
      Stand on hard 17 or higher - 17 is heaven, never hit it. Bust risk is too high.
      Double on 11 always - Eleven is golden, double and be bolden.
    `
    speakText(text)
  }

  const speakCounting = () => {
    if (!countingSystem || !casino) return
    const positiveCards = Object.entries(countingSystem.values)
      .filter(([_, v]) => v > 0)
      .map(([k]) => k)
      .join(", ")
    const negativeCards = Object.entries(countingSystem.values)
      .filter(([_, v]) => v < 0)
      .map(([k]) => k)
      .join(", ")
    const neutralCards = Object.entries(countingSystem.values)
      .filter(([_, v]) => v === 0)
      .map(([k]) => k)
      .join(", ")

    const text = `
      Card Counting Guide using ${countingSystem.name}.
      
      ${countingSystem.description}
      
      This is a level ${countingSystem.level} system, meaning the count values range from negative ${countingSystem.level} to positive ${countingSystem.level}.
      
      Card Values:
      Low cards that add to the count: ${positiveCards}. These are good for the dealer when removed.
      High cards that subtract from the count: ${negativeCards}. These are good for the player.
      ${neutralCards ? `Neutral cards that don't affect the count: ${neutralCards}.` : ""}
      
      ${
        countingSystem.needsTrueCount
          ? `This system requires true count conversion. Divide your running count by the number of decks remaining. With ${casino.numberOfDecks} decks, estimate decks remaining by looking at the discard tray.`
          : "This system uses running count directly without true count conversion."
      }
      
      ${
        countingSystem.needsAceSideCount
          ? "This system benefits from an Ace side count for betting decisions."
          : "No Ace side count is needed for this system."
      }
      
      The Illustrious 18 index plays are deviations from basic strategy based on the true count.
      For example, take insurance when the true count is 3 or higher.
      Stand on 16 versus 10 when true count is 0 or higher.
      Stand on 12 versus 3 when true count is 2 or higher.
    `
    speakText(text)
  }

  const speakBetting = () => {
    if (!bettingStyle || !character || !casino) return
    const unitSize = Math.round(casino.minBet)
    const maxBet = unitSize * character.betSpreadRatio

    const text = `
      Betting Strategy using ${bettingStyle.name}.
      
      ${bettingStyle.description}
      
      Risk Level: ${bettingStyle.riskLevel}.
      
      Your bet spread is 1 to ${character.betSpreadRatio}, meaning your minimum bet is ${unitSize} dollars and your maximum bet is ${maxBet} dollars.
      
      Recommended Bet Ramp:
      At true count 0 or below, bet 1 unit or ${unitSize} dollars. The house has the edge.
      At true count plus 1, bet 1 unit. You're roughly even with the house.
      At true count plus 2, bet 2 units or ${unitSize * 2} dollars. You have a small edge.
      At true count plus 3, bet 4 units or ${unitSize * 4} dollars. Your edge is growing.
      At true count plus 4, bet 6 units or ${unitSize * 6} dollars. Strong player advantage.
      At true count plus 5 or higher, bet 8 units or ${unitSize * 8} dollars. Maximum advantage.
      
      Remember: Vary your bets naturally to avoid detection. Don't jump from minimum to maximum instantly.
      ${
        bettingStyle.riskLevel === "high"
          ? "Your aggressive style maximizes expected value but has higher variance. Prepare for swings."
          : bettingStyle.riskLevel === "low"
            ? "Your conservative style reduces variance but also reduces expected value. Good for longevity."
            : "Your balanced style offers a good mix of expected value and manageable risk."
      }
    `
    speakText(text)
  }

  console.log("[v0] Before null check:", {
    hasCasino: !!casino,
    hasCharacter: !!character,
    hasTableSelection: !!tableSelection,
    hasCountingSystem: !!countingSystem,
    hasBettingStyle: !!bettingStyle,
  })

  if (!casino || !character || !tableSelection || !countingSystem || !bettingStyle) {
    console.log("[v0] Showing loading state due to missing data")
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-slate-300">Loading session data...</p>
            <Button variant="outline" onClick={onBack} className="mt-4 bg-transparent">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  console.log("[v0] Rendering main content")

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Table Selection
            </Button>
            <h1 className="text-xl font-bold text-amber-400">Pre-Game Summary & Prep</h1>
            <Button
              onClick={onStartGame}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto bg-slate-800 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-600">
              <Building2 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="strategy" className="data-[state=active]:bg-amber-600">
              <BookOpen className="w-4 h-4 mr-2" />
              Strategy
            </TabsTrigger>
            <TabsTrigger value="counting" className="data-[state=active]:bg-amber-600">
              <Calculator className="w-4 h-4 mr-2" />
              Counting
            </TabsTrigger>
            <TabsTrigger value="betting" className="data-[state=active]:bg-amber-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              Betting
            </TabsTrigger>
            <TabsTrigger value="practice" className="data-[state=active]:bg-amber-600">
              <Brain className="w-4 h-4 mr-2" />
              Practice
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={isSpeaking ? stopSpeaking : speakOverview}
                className="border-amber-600 text-amber-400 hover:bg-amber-600/20 bg-transparent"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isSpeaking ? "Stop" : "Read Aloud"}
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Casino Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <Building2 className="w-5 h-5" />
                    Casino Selected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{casino.name}</h3>
                    <p className="text-slate-400 text-sm">{casino.location}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">House Edge:</span>
                      <Badge variant="outline" className="border-red-500 text-red-400">
                        {casino.houseEdge}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Decks:</span>
                      <span className="text-white">
                        {casino.numberOfDecks} {casino.numberOfDecks === 1 ? "deck" : "decks"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Table Limits:</span>
                      <span className="text-green-400">
                        ${casino.minBet.toLocaleString()} - ${casino.maxBet.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-300">House Rules:</h4>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {casino.dealerHitsSoft17 ? "H17" : "S17"}
                      </Badge>
                      {casino.doubleAfterSplit && (
                        <Badge variant="secondary" className="text-xs">
                          DAS
                        </Badge>
                      )}
                      {casino.resplitAces && (
                        <Badge variant="secondary" className="text-xs">
                          RSA
                        </Badge>
                      )}
                      {casino.lateSurrender && (
                        <Badge variant="secondary" className="text-xs">
                          LS
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Character Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <User className="w-5 h-5" />
                    Character Selected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{character.name}</h3>
                    <Badge
                      className={
                        character.level === "whale"
                          ? "bg-amber-600"
                          : character.level === "professional"
                            ? "bg-purple-600"
                            : "bg-blue-600"
                      }
                    >
                      {character.level}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-400">{character.backstory}</p>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Bankroll:</span>
                      <span className="text-green-400">${character.bankroll.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Bet Spread:</span>
                      <span className="text-yellow-400">1:{character.betSpreadRatio}</span>
                    </div>
                    <div className="text-xs text-slate-500 -mt-1">
                      (${character.minBet.toLocaleString()} min to ${character.maxBet.toLocaleString()} max)
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Counting:</span>
                      <span className="text-cyan-400">{countingSystem.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-emerald-400">
                    <Table className="w-5 h-5" />
                    Table Selected
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{tableSelection.tableConfig.name}</h3>
                    <p className="text-slate-400 text-sm">{tableSelection.tableConfig.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Your Seat:</span>
                      <span className="text-white">Position {tableSelection.playerSeat}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Table Size:</span>
                      <span className="text-white">{tableSelection.tableConfig.tableSize} seats</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Other Players:</span>
                      <span className="text-white">
                        {tableSelection.tableConfig.seats.filter((s) => s.isOccupied).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Play Speed:</span>
                      <Badge variant="outline" className="capitalize">
                        {tableSelection.playSpeed}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Tips */}
            <Card className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-400">
                  <Lightbulb className="w-5 h-5" />
                  Quick Tips for This Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {casino.dealerHitsSoft17
                        ? "Dealer hits soft 17 - slightly worse for you. Consider more conservative play on borderline hands."
                        : "Dealer stands on soft 17 - better rules for you. Take advantage with proper doubles."}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>
                      With {casino.numberOfDecks} decks and {casino.houseEdge}% house edge, you need a true count of +
                      {Math.ceil(casino.houseEdge / 0.5)} or higher to have an advantage.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>
                      {character.coverDescription ||
                        `As ${character.name}, remember to ${character.level === "whale" ? "play like the high roller you are" : "blend in and avoid detection"}.`}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={isSpeaking ? stopSpeaking : speakStrategy}
                className="border-amber-600 text-amber-400 hover:bg-amber-600/20 bg-transparent"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isSpeaking ? "Stop" : "Read Aloud"}
              </Button>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Info className="w-5 h-5" />
                  {casino.name} Rule Adjustments
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Know these casino-specific rules before playing - they affect your strategy decisions
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">
                      {casino.dealerHitsSoft17 ? "Dealer Hits Soft 17 (H17)" : "Dealer Stands Soft 17 (S17)"}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {casino.dealerHitsSoft17
                        ? "This adds ~0.2% to house edge. Double down on 11 vs Ace, and surrender 15/17 vs Ace more often."
                        : "Better for player. Standard basic strategy applies without H17 modifications."}
                    </p>
                  </div>

                  {casino.lateSurrender && (
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Late Surrender Available</h4>
                      <p className="text-sm text-slate-400">
                        Surrender 16 vs 9/10/A, and 15 vs 10. With counting, the Fab 4 surrender plays become even more
                        valuable.
                      </p>
                    </div>
                  )}

                  {casino.doubleAfterSplit && (
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Double After Split (DAS)</h4>
                      <p className="text-sm text-slate-400">
                        Split more aggressively! Split 2s/3s vs 2-7, 4s vs 5-6, and 6s vs 2-6 when DAS is allowed.
                      </p>
                    </div>
                  )}

                  {casino.resplitAces && (
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <h4 className="font-semibold text-white mb-2">Re-split Aces (RSA)</h4>
                      <p className="text-sm text-slate-400">
                        If you get another Ace after splitting, split again! This rule reduces house edge by ~0.08%.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Basic Strategy Mnemonics - now below rule adjustments */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                  Basic Strategy Mnemonics
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Memorize these key phrases to remember basic strategy at the table
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {BASIC_STRATEGY_MNEMONICS.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-amber-600/50 transition-colors"
                    >
                      <h4 className="font-semibold text-white mb-1">{item.rule}</h4>
                      <p className="text-amber-400 font-medium mb-2">"{item.mnemonic}"</p>
                      <p className="text-sm text-slate-400">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Counting Tab */}
          <TabsContent value="counting" className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={isSpeaking ? stopSpeaking : speakCounting}
                className="border-amber-600 text-amber-400 hover:bg-amber-600/20 bg-transparent"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isSpeaking ? "Stop" : "Read Aloud"}
              </Button>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Calculator className="w-5 h-5" />
                  {countingSystem.name} System
                </CardTitle>
                <p className="text-sm text-slate-400">{countingSystem.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Card Values Grid */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Card Values</h4>
                  <div className="grid grid-cols-13 gap-1">
                    {["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"].map((rank) => {
                      const value = countingSystem.values[rank as keyof typeof countingSystem.values]
                      return (
                        <div
                          key={rank}
                          className={`p-2 rounded text-center ${
                            value > 0
                              ? "bg-green-900/50 border border-green-700"
                              : value < 0
                                ? "bg-red-900/50 border border-red-700"
                                : "bg-slate-700/50 border border-slate-600"
                          }`}
                        >
                          <div className="text-xs text-slate-400">{rank}</div>
                          <div
                            className={`font-bold ${value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-slate-400"}`}
                          >
                            {value > 0 ? `+${value}` : value}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* System Details */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <h4 className="text-sm text-slate-400 mb-1">Level</h4>
                    <p className="text-2xl font-bold text-white">{countingSystem.level}</p>
                    <p className="text-xs text-slate-500">Higher = more accurate but harder</p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <h4 className="text-sm text-slate-400 mb-1">True Count Needed</h4>
                    <p className="text-2xl font-bold text-white">{countingSystem.needsTrueCount ? "Yes" : "No"}</p>
                    <p className="text-xs text-slate-500">
                      {countingSystem.needsTrueCount ? "Divide by decks remaining" : "Use running count directly"}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <h4 className="text-sm text-slate-400 mb-1">Ace Side Count</h4>
                    <p className="text-2xl font-bold text-white">{countingSystem.needsAceSideCount ? "Yes" : "No"}</p>
                    <p className="text-xs text-slate-500">
                      {countingSystem.needsAceSideCount ? "Track Aces separately for insurance" : "Not required"}
                    </p>
                  </div>
                </div>

                {/* Tips */}
                <div className="p-4 bg-cyan-900/20 border border-cyan-700/50 rounded-lg">
                  <h4 className="font-semibold text-cyan-400 mb-2">Quick Tips</h4>
                  <ul className="space-y-1 text-sm text-slate-300">
                    <li>• Low cards (2-6) are good for player when removed - count goes UP</li>
                    <li>• High cards (10-A) are bad for player when removed - count goes DOWN</li>
                    <li>• Positive count = more high cards left = advantage to player</li>
                    <li>• With {casino.numberOfDecks} decks: True Count = Running Count ÷ Decks Remaining</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Index Plays */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <Target className="w-5 h-5" />
                  Index Plays (Illustrious 18 + Fab 4)
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Deviate from basic strategy when the count reaches these thresholds
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold text-white">Top 10 Most Important</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {[...ILLUSTRIOUS_18.slice(0, 8), ...FAB_4.slice(0, 2)].map((play, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 flex justify-between items-center"
                      >
                        <div>
                          <span className="text-white font-medium">{play.situation}</span>
                          <span className="text-slate-400 mx-2">→</span>
                          <span className="text-amber-400 capitalize">{play.indexAction}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            play.index >= 0 ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                          }
                        >
                          TC {play.index >= 0 ? `≥+${play.index}` : `≤${play.index}`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Betting Tab */}
          <TabsContent value="betting" className="space-y-6">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={isSpeaking ? stopSpeaking : speakBetting}
                className="border-amber-600 text-amber-400 hover:bg-amber-600/20 bg-transparent"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                {isSpeaking ? "Stop" : "Read Aloud"}
              </Button>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="w-5 h-5" />
                  {bettingStyle.name}
                </CardTitle>
                <p className="text-sm text-slate-400">{bettingStyle.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <h4 className="text-sm text-slate-400 mb-1">Risk Level</h4>
                    <Badge
                      className={
                        bettingStyle.riskLevel === "high"
                          ? "bg-red-600"
                          : bettingStyle.riskLevel === "medium"
                            ? "bg-amber-600"
                            : "bg-green-600"
                      }
                    >
                      {bettingStyle.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg text-center">
                    <h4 className="text-sm text-slate-400 mb-1">Your Spread</h4>
                    <p className="text-xl font-bold text-white">1:{character.betSpreadRatio}</p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <h4 className="text-sm text-slate-400 mb-1">Unit Size</h4>
                    <p className="text-xl font-bold text-green-400">${casino.minBet.toLocaleString()}</p>
                  </div>
                </div>

                {/* Bet Ramp */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Recommended Bet Ramp</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400">True Count</th>
                          <th className="text-left py-2 px-3 text-slate-400">Player Edge</th>
                          <th className="text-left py-2 px-3 text-slate-400">Units</th>
                          <th className="text-left py-2 px-3 text-slate-400">Bet Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { tc: "≤0", edge: "-0.5%", units: 1, color: "text-red-400" },
                          { tc: "+1", edge: "0%", units: 1, color: "text-slate-400" },
                          { tc: "+2", edge: "+0.5%", units: 2, color: "text-green-400" },
                          { tc: "+3", edge: "+1.0%", units: 4, color: "text-green-400" },
                          { tc: "+4", edge: "+1.5%", units: 6, color: "text-green-400" },
                          { tc: "+5+", edge: "+2.0%+", units: 8, color: "text-green-400" },
                        ].map((row, index) => (
                          <tr key={index} className="border-b border-slate-800">
                            <td className="py-2 px-3 text-white font-medium">{row.tc}</td>
                            <td className={`py-2 px-3 ${row.color}`}>{row.edge}</td>
                            <td className="py-2 px-3 text-white">{row.units}x</td>
                            <td className="py-2 px-3 text-amber-400">
                              ${Math.min(casino.minBet * row.units, casino.maxBet).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Practice Tab */}
          <TabsContent value="practice" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Brain className="w-5 h-5" />
                    Card Counting Practice
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">Mode:</span>
                      <Button
                        variant={practiceMode === "learn" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPracticeMode("learn")}
                        className={practiceMode === "learn" ? "bg-purple-600" : ""}
                      >
                        Learn
                      </Button>
                      <Button
                        variant={practiceMode === "test" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPracticeMode("test")}
                        className={practiceMode === "test" ? "bg-purple-600" : ""}
                      >
                        Test
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={shufflePracticeCards}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {practiceCards.length > 0 && (
                  <div className="space-y-6">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          Card {currentCardIndex + 1} of {practiceCards.length}
                        </span>
                        {practiceMode === "test" && (
                          <span className="text-slate-400">
                            Score: {correctCount}/{totalAttempts} (
                            {totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0}%)
                          </span>
                        )}
                      </div>
                      <Progress value={((currentCardIndex + 1) / practiceCards.length) * 100} className="h-2" />
                    </div>

                    {/* Card Display */}
                    <div className="flex flex-col items-center gap-6">
                      <div
                        className={`w-32 h-44 rounded-xl flex flex-col items-center justify-center text-4xl font-bold shadow-xl ${
                          ["♥", "♦"].includes(practiceCards[currentCardIndex].suit)
                            ? "bg-white text-red-600"
                            : "bg-white text-slate-900"
                        }`}
                      >
                        <span className="text-5xl">{practiceCards[currentCardIndex].rank}</span>
                        <span className="text-3xl">{practiceCards[currentCardIndex].suit}</span>
                      </div>

                      {/* Running Count Display */}
                      <div className="text-center">
                        <p className="text-sm text-slate-400">Running Count</p>
                        <p
                          className={`text-3xl font-bold ${runningCount > 0 ? "text-green-400" : runningCount < 0 ? "text-red-400" : "text-white"}`}
                        >
                          {runningCount > 0 ? `+${runningCount}` : runningCount}
                        </p>
                      </div>

                      {/* Practice Mode */}
                      {practiceMode === "learn" ? (
                        <div className="text-center space-y-2">
                          <p className="text-slate-400">This card's value in {countingSystem.name}:</p>
                          <p
                            className={`text-4xl font-bold ${
                              getCardCountValue(practiceCards[currentCardIndex].rank) > 0
                                ? "text-green-400"
                                : getCardCountValue(practiceCards[currentCardIndex].rank) < 0
                                  ? "text-red-400"
                                  : "text-slate-400"
                            }`}
                          >
                            {getCardCountValue(practiceCards[currentCardIndex].rank) > 0 ? "+" : ""}
                            {getCardCountValue(practiceCards[currentCardIndex].rank)}
                          </p>
                          <Button onClick={nextCard} disabled={currentCardIndex >= practiceCards.length - 1}>
                            Next Card
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {!showAnswer ? (
                            <div className="space-y-2">
                              <p className="text-center text-slate-400">What's the count value?</p>
                              <div className="flex gap-2 justify-center">
                                {[-2, -1, 0, 1, 2].map((value) => (
                                  <Button
                                    key={value}
                                    variant="outline"
                                    size="lg"
                                    onClick={() => handleCountAnswer(value)}
                                    className={`w-14 h-14 text-xl font-bold ${
                                      value > 0
                                        ? "border-green-600 hover:bg-green-600"
                                        : value < 0
                                          ? "border-red-600 hover:bg-red-600"
                                          : "border-slate-600 hover:bg-slate-600"
                                    }`}
                                  >
                                    {value > 0 ? `+${value}` : value}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              {userAnswer === getCardCountValue(practiceCards[currentCardIndex].rank) ? (
                                <div className="flex items-center justify-center gap-2 text-green-400">
                                  <CheckCircle2 className="w-6 h-6" />
                                  <span className="text-xl font-bold">Correct!</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-center gap-2 text-red-400">
                                    <XCircle className="w-6 h-6" />
                                    <span className="text-xl font-bold">Incorrect</span>
                                  </div>
                                  <p className="text-slate-400">
                                    Correct answer:{" "}
                                    <span className="text-white font-bold">
                                      {getCardCountValue(practiceCards[currentCardIndex].rank) > 0 ? "+" : ""}
                                      {getCardCountValue(practiceCards[currentCardIndex].rank)}
                                    </span>
                                  </p>
                                </div>
                              )}
                              <Button onClick={nextCard} disabled={currentCardIndex >= practiceCards.length - 1}>
                                Next Card
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" size="lg" onClick={onBack} className="border-slate-600 bg-transparent">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            size="lg"
            onClick={onStartGame}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-8"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Playing
          </Button>
        </div>
      </div>
    </div>
  )
}
