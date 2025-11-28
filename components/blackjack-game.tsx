"use client"

import { useState, useEffect, useRef } from "react"
import type { GameSettings, GameState, Hand, Player, Card } from "@/lib/types"
import type { CasinoRules } from "@/lib/casinos"
import type { CharacterProfile } from "@/lib/characters"
import type { TableSelection } from "@/components/table-selector"
import { calculateHandValue, isBlackjack, shouldDealerHit, canDouble, canSplit } from "@/lib/blackjack"
import { getCardValue, calculateTrueCount } from "@/lib/card-counting"
import { createNPC, getNPCBet, getNPCAction } from "@/lib/npc-player"
import { PlayingCard } from "@/components/playing-card"
import { PlayerSeat } from "@/components/player-seat"
import { GameControlsPanel } from "@/components/game-controls-panel"
import { CountOverlay } from "@/components/count-overlay"
import { getBasicStrategyRecommendation } from "@/lib/basic-strategy"
import { StatisticsPanel } from "@/components/statistics-panel"
import { VerboseCoachingPanel } from "@/components/verbose-coaching-panel"
import { ShoePreparationScreen } from "@/components/shoe-preparation-screen"
import { ShoeIndicator } from "@/components/shoe-indicator"
import { useShoe } from "@/contexts/shoe-context"

const initialSettings: GameSettings = {
  numberOfDecks: 6,
  penetrationPercent: 75,
  minBet: 10,
  maxBet: 500,
  bankroll: 1000,
  allowSplit: true,
  allowDouble: true,
  allowDoubleAfterSplit: true,
  dealerHitsSoft17: false,
  numberOfPlayers: 1,
  countingSystem: "hi-lo",
  showCount: true,
  showDownCards: false,
  showCoaching: true,
  showOdds: false,
  showPlayerStats: true,
  showVerboseCoaching: true,
  readAloud: true,
  speechSpeed: 1.25, // Added speechSpeed default to 1.25
  playWithNPCs: false,
  numberOfSeats: 1,
  playerSeat: 1,
  playSpeed: "normal",
  casinoName: undefined,
  lateSurrender: false,
  resplitAces: false,
  maxResplitHands: 2,
  bettingStyle: "kelly",
  showIndexPlays: true,
  countAloud: true,
}

interface BlackjackGameProps {
  selectedCasino?: CasinoRules
  selectedCharacter?: CharacterProfile
  tableSelection?: TableSelection
}

export function BlackjackGame({ selectedCasino, selectedCharacter, tableSelection }: BlackjackGameProps) {
  const { shoe, dealNextCard, cardsRemaining, needsReshuffle, penetration } = useShoe()
  const [showShoePreparation, setShowShoePreparation] = useState(true)

  const hasNPCs = tableSelection ? tableSelection.tableConfig.seats.some((s) => s.isOccupied) : false
  const numberOfSeats = tableSelection ? tableSelection.tableConfig.tableSize : 1
  const playerSeat = tableSelection ? tableSelection.playerSeat : 1
  const playSpeed = tableSelection ? tableSelection.playSpeed : "normal"

  const casinoSettings = selectedCasino
    ? {
        ...initialSettings,
        numberOfDecks: selectedCasino.numberOfDecks as 1 | 2 | 6 | 8,
        minBet: selectedCharacter?.minBet || selectedCasino.minBet,
        maxBet: selectedCharacter?.maxBet || selectedCasino.maxBet,
        bankroll: selectedCharacter?.bankroll || initialSettings.bankroll,
        dealerHitsSoft17: selectedCasino.dealerHitsSoft17,
        allowDouble: true,
        allowDoubleAfterSplit: selectedCasino.doubleAfterSplit,
        lateSurrender: selectedCasino.lateSurrender,
        resplitAces: selectedCasino.resplitAces,
        maxResplitHands: selectedCasino.maxResplitHands,
        casinoName: selectedCasino.name,
        countingSystem: (selectedCharacter?.countingSystem || "hi-lo") as any,
        bettingStyle: (selectedCharacter?.bettingStyle || "kelly") as any,
        playWithNPCs: hasNPCs,
        numberOfSeats: numberOfSeats,
        playerSeat: playerSeat,
        playSpeed: playSpeed,
        showVerboseCoaching: selectedCharacter?.showVerboseCoaching || initialSettings.showVerboseCoaching,
        readAloud: selectedCharacter?.readAloud || initialSettings.readAloud,
        countAloud: selectedCharacter?.countAloud || initialSettings.countAloud, // Added countAloud to casinoSettings
        speechSpeed: selectedCharacter?.speechSpeed || initialSettings.speechSpeed, // Added speechSpeed to casinoSettings
      }
    : initialSettings

  const [settings, setSettings] = useState<GameSettings>(casinoSettings)
  const [lastBet, setLastBet] = useState(0)
  const [bankrollAtRoundStart, setBankrollAtRoundStart] = useState<number>(0)
  const [gameState, setGameState] = useState<GameState>({
    phase: "betting",
    shoe: [],
    dealerHand: { cards: [], bet: 0, isActive: false, isDoubled: false, isSplit: false },
    players: [],
    currentPlayerIndex: 0,
    runningCount: 0,
    trueCount: 0,
    decksRemaining: casinoSettings.numberOfDecks,
    settings: casinoSettings,
    allPlayersWin: false, // Added allPlayersWin to GameState
  })
  const [statistics, setStatistics] = useState({
    handsPlayed: 0,
    handsWon: 0,
    totalWagered: 0,
    netProfit: 0,
    biggestWin: 0,
  })
  const [roundResult, setRoundResult] = useState<
    "win" | "lose" | "push" | "blackjack" | "player-bust" | "dealer-bust" | null
  >(null)
  const [resultMessage, setResultMessage] = useState<string>("")
  const [displayedRoundMessage, setDisplayedRoundMessage] = useState<string>("")
  const lastSpokenMessageRef = useRef<string>("")

  const getDelay = (action: "card" | "decision" | "result") => {
    const speeds = {
      slow: { card: 1200, decision: 2000, result: 2500 },
      normal: { card: 800, decision: 1200, result: 1500 },
      fast: { card: 400, decision: 600, result: 800 },
    }
    return speeds[settings.playSpeed][action]
  }

  useEffect(() => {
    if (shoe.isReady && shoe.cards.length > 0) {
      setGameState((prev) => ({
        ...prev,
        shoe: shoe.cards,
        decksRemaining: shoe.cards.length / 52,
      }))
    }
  }, [shoe.isReady, shoe.cards])

  useEffect(() => {
    if (needsReshuffle && gameState.phase === "betting") {
      setShowShoePreparation(true)
    }
  }, [needsReshuffle, gameState.phase])

  useEffect(() => {
    if (gameState.players.length === 0) {
      const initialPlayers: Player[] = []

      if (settings.playWithNPCs && tableSelection) {
        tableSelection.tableConfig.seats
          .filter((seat) => seat.isOccupied && seat.npc)
          .forEach((seat) => {
            const npc = createNPC(seat.npc!.name, seat.seatNumber, settings.minBet, settings.maxBet)
            initialPlayers.push(npc)
          })
      }

      const humanPlayer: Player = {
        id: "human-1",
        name: selectedCharacter?.nickname || "You",
        type: "human",
        seatNumber: settings.playerSeat,
        hands: [{ cards: [], bet: 0, isActive: true, isDoubled: false, isSplit: false }],
        currentHandIndex: 0,
        bankroll: settings.bankroll,
        currentBet: 0,
        isActive: true,
      }
      initialPlayers.push(humanPlayer)

      initialPlayers.sort((a, b) => b.seatNumber - a.seatNumber)

      setGameState((prev) => ({ ...prev, players: initialPlayers }))
    }
  }, [
    gameState.players.length,
    settings.bankroll,
    settings.playWithNPCs,
    settings.minBet,
    settings.maxBet,
    settings.playerSeat,
    tableSelection,
    selectedCharacter,
  ])

  useEffect(() => {
    if (gameState.phase === "round-end" && displayedRoundMessage) {
      if (!settings.readAloud || typeof window === "undefined" || !window.speechSynthesis) return
      if (lastSpokenMessageRef.current === displayedRoundMessage) return

      window.speechSynthesis.cancel()

      const cleanMessage = displayedRoundMessage
        .replace(/\$([0-9,]+)/g, "$1 dollars")
        .replace(/\+/g, "plus ")
        .replace(/-/g, "minus ")

      const utterance = new SpeechSynthesisUtterance(cleanMessage)
      utterance.rate = settings.speechSpeed
      utterance.pitch = 1.0
      utterance.volume = 0.8

      window.speechSynthesis.speak(utterance)
      lastSpokenMessageRef.current = displayedRoundMessage
    }
  }, [gameState.phase, displayedRoundMessage, settings.readAloud, settings.speechSpeed])

  const updateCount = (card: Card) => {
    const countValue = getCardValue(card.rank as any, settings.countingSystem)
    const newRunningCount = gameState.runningCount + countValue
    const decksRemaining = Math.max(0.5, gameState.shoe.length / 52)
    const trueCount = calculateTrueCount(newRunningCount, decksRemaining)

    setGameState((prev) => ({
      ...prev,
      runningCount: newRunningCount,
      trueCount,
      decksRemaining,
    }))
  }

  const dealCard = (currentShoe: Card[], faceUp = true): { card: Card; newShoe: Card[] } => {
    // Use the shoe context to get the next card
    const card = dealNextCard(faceUp)
    if (card) {
      return { card, newShoe: currentShoe.slice(1) }
    }
    // Fallback: if shoe is empty, return from current shoe array
    if (currentShoe.length > 0) {
      const fallbackCard = { ...currentShoe[0], faceUp }
      return { card: fallbackCard, newShoe: currentShoe.slice(1) }
    }
    // Emergency fallback - create a placeholder card (should never happen)
    return {
      card: { suit: "♠", rank: "A", faceUp },
      newShoe: [],
    }
  }

  const getHumanPlayer = () => gameState.players.find((p) => p.type === "human")

  const placeBet = (amount: number) => {
    setGameState((prev) => {
      const updatedPlayers = prev.players.map((player) => {
        if (player.type === "human") {
          const newBet = player.currentBet + amount
          if (newBet <= player.bankroll && newBet <= settings.maxBet) {
            return { ...player, currentBet: newBet }
          }
        }
        return player
      })
      return { ...prev, players: updatedPlayers }
    })
  }

  const clearBet = () => {
    setGameState((prev) => {
      const updatedPlayers = prev.players.map((player) => {
        if (player.type === "human") {
          return { ...player, currentBet: 0 }
        }
        return player
      })
      return { ...prev, players: updatedPlayers }
    })
  }

  const handleRebet = (multiplier = 1) => {
    const amount = lastBet * multiplier
    const humanPlayer = getHumanPlayer()
    if (humanPlayer && amount <= humanPlayer.bankroll && amount <= settings.maxBet) {
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p) => (p.type === "human" ? { ...p, currentBet: amount } : p)),
      }))
    }
  }

  // NPC betting phase
  useEffect(() => {
    if (gameState.phase === "betting") {
      const allBetsPlaced = gameState.players.every((p) => p.currentBet > 0)

      if (!allBetsPlaced) {
        const timer = setTimeout(() => {
          setGameState((prev) => {
            const updatedPlayers = prev.players.map((player) => {
              if (player.type === "npc" && player.currentBet === 0) {
                const bet = getNPCBet(player, settings.minBet, settings.maxBet, prev.trueCount)
                return { ...player, currentBet: bet }
              }
              return player
            })
            return { ...prev, players: updatedPlayers }
          })
        }, getDelay("decision"))

        return () => clearTimeout(timer)
      }
    }
  }, [gameState.phase, gameState.players, settings])

  // NPC playing phase
  useEffect(() => {
    if (gameState.phase === "player-turn") {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex]

      if (currentPlayer?.type === "npc") {
        const currentHand = currentPlayer.hands[currentPlayer.currentHandIndex]
        const dealerUpCard = gameState.dealerHand.cards[0]

        const handValue = calculateHandValue(currentHand.cards).value
        if (handValue >= 21) {
          setTimeout(() => {
            moveToNextHandOrPlayer()
          }, getDelay("result"))
          return
        }

        const timer = setTimeout(() => {
          const action = getNPCAction(
            currentHand,
            dealerUpCard,
            canSplit(currentHand) && currentPlayer.hands.length < settings.maxResplitHands,
            canDouble(currentHand),
            currentPlayer.bankroll >= currentHand.bet,
          )

          switch (action) {
            case "hit":
              handleHit()
              break
            case "stand":
              handleStand()
              break
            case "double":
              handleDouble()
              break
            case "split":
              handleSplit()
              break
          }
        }, getDelay("decision"))

        return () => clearTimeout(timer)
      }
    }
  }, [gameState.phase, gameState.currentPlayerIndex, gameState.players])

  const updateRunningCount = (cardRank: string) => {
    const value = getCardValue(cardRank as any, settings.countingSystem)
    const newRunningCount = gameState.runningCount + value
    const decksRemaining = Math.max(0.5, gameState.shoe.length / 52)
    const trueCount = calculateTrueCount(newRunningCount, decksRemaining)

    setGameState((prev) => ({
      ...prev,
      runningCount: newRunningCount,
      trueCount,
      decksRemaining,
    }))
  }

  const startRound = () => {
    const humanPlayer = getHumanPlayer()
    if (!humanPlayer || humanPlayer.currentBet < settings.minBet) return

    setGameState((prev) => {
      const playersWithBets = prev.players.map((player) => {
        if (player.type === "npc" && player.currentBet === 0) {
          const bet = getNPCBet(player, settings.minBet, settings.maxBet, prev.trueCount)
          return { ...player, currentBet: bet }
        }
        return player
      })
      return { ...prev, players: playersWithBets }
    })

    setLastBet(humanPlayer.currentBet)
    startNewRound()
  }

  const startNewRound = () => {
    const playerCount = gameState.players.length

    let currentShoe = gameState.shoe
    const dealtCards: { card: Card; faceUp: boolean; recipient: string }[] = []

    gameState.players.forEach((player, idx) => {
      const result = dealCard(currentShoe, true)
      dealtCards.push({ card: result.card, faceUp: true, recipient: `player-${idx}-first` })
      currentShoe = result.newShoe
    })

    const dealerFirst = dealCard(currentShoe, true)
    dealtCards.push({ card: dealerFirst.card, faceUp: true, recipient: "dealer-first" })
    currentShoe = dealerFirst.newShoe

    gameState.players.forEach((player, idx) => {
      const result = dealCard(currentShoe, true)
      dealtCards.push({ card: result.card, faceUp: true, recipient: `player-${idx}-second` })
      currentShoe = result.newShoe
    })

    const dealerSecond = dealCard(currentShoe, false)
    dealtCards.push({ card: dealerSecond.card, faceUp: false, recipient: "dealer-second" })
    currentShoe = dealerSecond.newShoe

    let newRunningCount = gameState.runningCount
    dealtCards.forEach(({ card, faceUp }) => {
      if (faceUp) {
        newRunningCount += getCardValue(card.rank as any, settings.countingSystem)
      }
    })

    const decksRemaining = Math.max(0.5, currentShoe.length / 52)
    const newTrueCount = calculateTrueCount(newRunningCount, decksRemaining)

    const newDealerHand: Hand = { cards: [], bet: 0, isActive: false, isDoubled: false, isSplit: false }

    const bankrollBeforeBets = gameState.players.find((p) => p.type === "human")?.bankroll || 0
    setBankrollAtRoundStart(bankrollBeforeBets)

    setGameState((prev) => ({
      ...prev,
      phase: "dealing",
      dealerHand: newDealerHand,
      currentPlayerIndex: 0,
      shoe: currentShoe,
      runningCount: newRunningCount,
      trueCount: newTrueCount,
      decksRemaining,
      players: prev.players.map((p) => ({
        ...p,
        insuranceBet: undefined,
        bankroll: p.bankroll - p.currentBet, // Deduct bet from bankroll
      })),
    }))

    const dealerFirstIndex = playerCount
    const secondCardsStartIndex = playerCount + 1
    const dealerSecondIndex = playerCount + 1 + playerCount

    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p, idx) => ({
          ...p,
          hands: [{ ...p.hands[0], cards: [dealtCards[idx].card], bet: p.currentBet }],
        })),
      }))
    }, getDelay("card"))

    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        dealerHand: { ...prev.dealerHand, cards: [dealtCards[dealerFirstIndex].card] },
      }))
    }, getDelay("card") * 2)

    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p, idx) => ({
          ...p,
          hands: [{ ...p.hands[0], cards: [...p.hands[0].cards, dealtCards[secondCardsStartIndex + idx].card] }],
        })),
      }))
    }, getDelay("card") * 3)

    setTimeout(() => {
      const dealerUpCard = dealtCards[dealerFirstIndex].card
      const shouldOfferInsurance = dealerUpCard.rank === "A"

      setGameState((prev) => ({
        ...prev,
        dealerHand: { ...prev.dealerHand, cards: [...prev.dealerHand.cards, dealtCards[dealerSecondIndex].card] },
        phase: shouldOfferInsurance ? "insurance" : "player-turn",
      }))

      if (shouldOfferInsurance) {
        setTimeout(() => {
          processNPCInsuranceBets()
        }, getDelay("decision"))
      } else {
        setTimeout(() => {
          checkForPlayerBlackjack()
        }, getDelay("card"))
      }
    }, getDelay("card") * 4)
  }

  const handleHit = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    const currentHand = currentPlayer.hands[currentPlayer.currentHandIndex]

    const { card: newCard, newShoe } = dealCard(gameState.shoe, true)

    const newHand = { ...currentHand, cards: [...currentHand.cards, newCard] }
    const handValue = calculateHandValue(newHand.cards)

    const newRunningCount = gameState.runningCount + getCardValue(newCard.rank as any, settings.countingSystem)
    const decksRemaining = Math.max(0.5, newShoe.length / 52)
    const newTrueCount = calculateTrueCount(newRunningCount, decksRemaining)

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      updatedPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        hands: currentPlayer.hands.map((h, idx) => (idx === currentPlayer.currentHandIndex ? newHand : h)),
      }

      return {
        ...prev,
        players: updatedPlayers,
        shoe: newShoe,
        runningCount: newRunningCount,
        trueCount: newTrueCount,
        decksRemaining,
      }
    })

    if (handValue.value > 21) {
      setTimeout(() => moveToNextHandOrPlayer(), getDelay("result"))
    }
  }

  const handleStand = () => {
    moveToNextHandOrPlayer()
  }

  const handleDouble = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    const currentHand = currentPlayer.hands[currentPlayer.currentHandIndex]

    const { card: newCard, newShoe } = dealCard(gameState.shoe, true)

    const newHand = {
      ...currentHand,
      cards: [...currentHand.cards, newCard],
      bet: currentHand.bet * 2,
      isDoubled: true,
    }

    const newRunningCount = gameState.runningCount + getCardValue(newCard.rank as any, settings.countingSystem)
    const decksRemaining = Math.max(0.5, newShoe.length / 52)
    const newTrueCount = calculateTrueCount(newRunningCount, decksRemaining)

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      const player = { ...updatedPlayers[prev.currentPlayerIndex] }
      player.hands[player.currentHandIndex] = newHand
      player.bankroll -= currentHand.bet
      updatedPlayers[prev.currentPlayerIndex] = player

      return {
        ...prev,
        players: updatedPlayers,
        shoe: newShoe,
        runningCount: newRunningCount,
        trueCount: newTrueCount,
        decksRemaining,
      }
    })

    setTimeout(() => moveToNextHandOrPlayer(), getDelay("result"))
  }

  const handleSplit = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    const currentHand = currentPlayer.hands[currentPlayer.currentHandIndex]

    if (!canSplit(currentHand)) return

    const isSplittingAces = currentHand.cards[0].rank === "A"

    const currentShoe = gameState.shoe
    const { card: card1, newShoe: shoe1 } = dealCard(currentShoe, true)
    const { card: card2, newShoe: shoe2 } = dealCard(shoe1, true)

    const hand1: Hand = {
      cards: [currentHand.cards[0], card1],
      bet: currentHand.bet,
      isActive: true,
      isDoubled: false,
      isSplit: true,
    }

    const hand2: Hand = {
      cards: [currentHand.cards[1], card2],
      bet: currentHand.bet,
      isActive: false,
      isDoubled: false,
      isSplit: true,
    }

    const newRunningCount =
      gameState.runningCount +
      getCardValue(card1.rank as any, settings.countingSystem) +
      getCardValue(card2.rank as any, settings.countingSystem)
    const decksRemaining = Math.max(0.5, shoe2.length / 52)
    const newTrueCount = calculateTrueCount(newRunningCount, decksRemaining)

    setGameState((prev) => {
      const updatedPlayers = [...prev.players]
      const player = { ...updatedPlayers[prev.currentPlayerIndex] }
      player.hands = [hand1, hand2]
      player.currentHandIndex = 0
      player.bankroll -= currentHand.bet
      updatedPlayers[prev.currentPlayerIndex] = player

      return {
        ...prev,
        players: updatedPlayers,
        shoe: shoe2,
        runningCount: newRunningCount,
        trueCount: newTrueCount,
        decksRemaining,
      }
    })

    if (isSplittingAces && !settings.resplitAces) {
      setTimeout(() => {
        setGameState((prev) => {
          const updatedPlayers = [...prev.players]
          const player = { ...updatedPlayers[prev.currentPlayerIndex] }
          player.hands[0].isActive = false
          player.currentHandIndex = 1
          player.hands[1].isActive = true
          updatedPlayers[prev.currentPlayerIndex] = player
          return { ...prev, players: updatedPlayers }
        })

        setTimeout(() => {
          setGameState((prev) => {
            const updatedPlayers = [...prev.players]
            const player = { ...updatedPlayers[prev.currentPlayerIndex] }
            player.hands[1].isActive = false
            updatedPlayers[prev.currentPlayerIndex] = player
            return { ...prev, players: updatedPlayers }
          })
          moveToNextHandOrPlayer()
        }, getDelay("deal"))
      }, getDelay("deal"))
    }
  }

  const handleSurrender = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    const currentHand = currentPlayer.hands[currentPlayer.currentHandIndex]

    // Surrender returns half the bet
    const surrenderRefund = Math.floor(currentHand.bet / 2)

    setGameState((prev) => {
      const updatedPlayers = prev.players.map((p, idx) => {
        if (idx === prev.currentPlayerIndex) {
          return {
            ...p,
            bankroll: p.bankroll + surrenderRefund,
            hands: p.hands.map((h, hIdx) => (hIdx === p.currentHandIndex ? { ...h, isActive: false } : h)),
          }
        }
        return p
      })

      return {
        ...prev,
        players: updatedPlayers,
      }
    })

    // Set result message for surrender
    setRoundResult("lose")
    setResultMessage("Surrendered - Half bet returned")
    setDisplayedRoundMessage("Surrender - Half bet returned") // Added for speech

    // Move to next hand or player
    setTimeout(() => moveToNextHandOrPlayer(), getDelay("result"))
  }

  const moveToNextHandOrPlayer = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    const currentHandIdx = currentPlayer.currentHandIndex
    const totalHands = currentPlayer.hands.length
    const currentPlayerIdx = gameState.currentPlayerIndex
    const totalPlayers = gameState.players.length

    console.log(
      "[v0] moveToNextHandOrPlayer - currentPlayerIdx:",
      currentPlayerIdx,
      "currentHandIdx:",
      currentHandIdx,
      "totalHands:",
      totalHands,
      "totalPlayers:",
      totalPlayers,
    )

    // Check if there are more hands to play for current player
    if (currentHandIdx < totalHands - 1) {
      console.log("[v0] Moving to next hand for same player")
      setGameState((prev) => {
        const updatedPlayers = [...prev.players]
        const player = { ...updatedPlayers[prev.currentPlayerIndex] }
        // Deactivate current hand
        player.hands = player.hands.map((h, idx) => ({
          ...h,
          isActive: idx === currentHandIdx + 1, // Only the next hand is active
        }))
        player.currentHandIndex = currentHandIdx + 1
        updatedPlayers[prev.currentPlayerIndex] = player
        return { ...prev, players: updatedPlayers }
      })
    }
    // Check if there are more players to play
    else if (currentPlayerIdx < totalPlayers - 1) {
      console.log("[v0] Moving to next player, index:", currentPlayerIdx + 1)
      setGameState((prev) => {
        const updatedPlayers = [...prev.players]

        // Deactivate current player's hand
        const currentP = { ...updatedPlayers[prev.currentPlayerIndex] }
        currentP.hands = currentP.hands.map((h) => ({ ...h, isActive: false }))
        updatedPlayers[prev.currentPlayerIndex] = currentP

        const nextPlayerIdx = prev.currentPlayerIndex + 1
        const nextP = { ...updatedPlayers[nextPlayerIdx] }
        nextP.currentHandIndex = 0
        nextP.hands = nextP.hands.map((h, idx) => ({ ...h, isActive: idx === 0 }))
        updatedPlayers[nextPlayerIdx] = nextP

        return {
          ...prev,
          players: updatedPlayers,
          currentPlayerIndex: nextPlayerIdx,
        }
      })
    }
    // All players done, dealer's turn
    else {
      console.log("[v0] All players done, starting dealer play")
      // Deactivate last player's hand before dealer plays
      setGameState((prev) => {
        const updatedPlayers = [...prev.players]
        const player = { ...updatedPlayers[prev.currentPlayerIndex] }
        player.hands = player.hands.map((h) => ({ ...h, isActive: false }))
        updatedPlayers[prev.currentPlayerIndex] = player
        return { ...prev, players: updatedPlayers }
      })
      dealerPlay()
    }
  }

  const dealerPlay = () => {
    setGameState((prev) => ({ ...prev, phase: "dealer-turn" }))

    setTimeout(() => {
      const dealerHand = { ...gameState.dealerHand }
      dealerHand.cards[1] = { ...dealerHand.cards[1], faceUp: true }
      updateRunningCount(dealerHand.cards[1].rank)

      setGameState((prev) => ({ ...prev, dealerHand }))

      setTimeout(() => {
        let currentDealerHand = dealerHand

        const dealMoreCards = () => {
          if (shouldDealerHit(currentDealerHand, settings.dealerHitsSoft17)) {
            setTimeout(() => {
              const newCard = dealCard(gameState.shoe, true).card
              currentDealerHand = { ...currentDealerHand, cards: [...currentDealerHand.cards, newCard] }
              setGameState((prev) => ({ ...prev, dealerHand: currentDealerHand }))
              dealMoreCards()
            }, getDelay("card"))
          } else {
            setTimeout(() => resolveRound(currentDealerHand), getDelay("result"))
          }
        }

        dealMoreCards()
      }, getDelay("card"))
    }, getDelay("decision"))
  }

  const resolveRound = (finalDealerHand: Hand) => {
    const dealerValue = calculateHandValue(finalDealerHand.cards).value
    const dealerHasBlackjack = isBlackjack(finalDealerHand)
    const dealerBusted = dealerValue > 21

    setGameState((prev) => {
      // Guard against undefined players
      if (!prev.players || prev.players.length === 0) {
        console.log("[v0] resolveRound: No players found, skipping")
        return { ...prev, phase: "round-end" }
      }

      let totalHandsWon = 0
      let totalHandsLost = 0
      let totalWagered = 0
      let humanBusted = false
      let allPlayersWin = true

      const updatedPlayers = prev.players.map((player) => {
        let playerWinnings = 0

        player.hands.forEach((hand) => {
          const playerValue = calculateHandValue(hand.cards).value
          const playerHasBlackjack = isBlackjack(hand)
          totalWagered += hand.bet

          if (playerValue > 21) {
            if (player.type === "human") {
              totalHandsLost++
              humanBusted = true
            }
            allPlayersWin = false
          } else if (playerHasBlackjack && dealerHasBlackjack) {
            playerWinnings += hand.bet
          } else if (playerHasBlackjack) {
            playerWinnings += hand.bet * 2.5
            if (player.type === "human") totalHandsWon++
          } else if (dealerHasBlackjack) {
            if (player.type === "human") totalHandsLost++
            allPlayersWin = false
          } else if (dealerBusted) {
            playerWinnings += hand.bet * 2
            if (player.type === "human") totalHandsWon++
          } else if (playerValue > dealerValue) {
            playerWinnings += hand.bet * 2
            if (player.type === "human") totalHandsWon++
          } else if (playerValue === dealerValue) {
            playerWinnings += hand.bet
          } else {
            if (player.type === "human") totalHandsLost++
            allPlayersWin = false
          }
        })

        return {
          ...player,
          bankroll: player.bankroll + playerWinnings,
        }
      })

      const humanPlayer = updatedPlayers.find((p) => p.type === "human")
      const profit = humanPlayer ? humanPlayer.bankroll - bankrollAtRoundStart : 0

      // Update resolveRound to set displayedRoundMessage
      // Set round result based on outcome
      if (humanBusted) {
        setRoundResult("player-bust")
        setDisplayedRoundMessage(getRandomPlayerBustMessageImmediate())
      } else if (dealerBusted && profit > 0) {
        setRoundResult("dealer-bust")
        setDisplayedRoundMessage(getRandomDealerBustMessageImmediate(allPlayersWin))
      } else if (profit > 0) {
        // Check if it was a blackjack
        const humanHand = humanPlayer?.hands[0]
        if (humanHand && humanHand.cards.length === 2 && calculateHandValue(humanHand.cards).value === 21) {
          setRoundResult("blackjack")
          setDisplayedRoundMessage(getRandomBlackjackMessageImmediate())
        } else {
          setRoundResult("win")
          setDisplayedRoundMessage(getRandomWinMessageImmediate())
        }
      } else if (profit < 0) {
        setRoundResult("lose")
        setDisplayedRoundMessage(getRandomLoseMessageImmediate())
      } else {
        setRoundResult("push")
        setDisplayedRoundMessage("Push - Bet Returned")
      }

      // Update statistics
      setStatistics((s) => ({
        ...s,
        handsPlayed: s.handsPlayed + 1,
        handsWon: s.handsWon + totalHandsWon,
        totalWagered: s.totalWagered + totalWagered,
        netProfit: s.netProfit + profit,
        biggestWin: Math.max(s.biggestWin, profit),
      }))

      return {
        ...prev,
        players: updatedPlayers,
        allPlayersWin,
        phase: "round-end",
      }
    })
  }

  const newRound = () => {
    setRoundResult(null)
    lastSpokenMessageRef.current = ""
    setDisplayedRoundMessage("")
    setGameState((prev) => ({
      ...prev,
      phase: "betting",
      dealerHand: { cards: [], bet: 0, isActive: false, isDoubled: false, isSplit: false },
      players: prev.players.map((player) => ({
        ...player,
        hands: [{ cards: [], bet: 0, isActive: true, isDoubled: false, isSplit: false }],
        currentHandIndex: 0,
        currentBet: 0,
      })),
      currentPlayerIndex: 0,
    }))
  }

  const handleInsuranceBet = (takeInsurance: boolean) => {
    const humanPlayer = gameState.players.find((p) => p.type === "human")
    if (!humanPlayer) return

    const insuranceAmount = takeInsurance ? humanPlayer.currentBet / 2 : 0

    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.type === "human" ? { ...p, insuranceBet: insuranceAmount, bankroll: p.bankroll - insuranceAmount } : p,
      ),
    }))

    setTimeout(() => {
      checkDealerBlackjackForInsurance()
    }, getDelay("decision"))
  }

  const processNPCInsuranceBets = () => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => {
        if (p.type === "npc") {
          const shouldTakeInsurance = prev.trueCount >= 3
          const insuranceAmount = shouldTakeInsurance ? p.currentBet / 2 : 0
          return {
            ...p,
            insuranceBet: insuranceAmount,
            bankroll: p.bankroll - insuranceAmount,
          }
        }
        return p
      }),
    }))
  }

  const checkDealerBlackjackForInsurance = () => {
    const dealerCards = gameState.dealerHand.cards
    const revealedDealerHand = {
      ...gameState.dealerHand,
      cards: dealerCards.map((c) => ({ ...c, faceUp: true })),
    }
    const dealerValue = calculateHandValue(revealedDealerHand.cards)
    const hasDealerBlackjack = dealerValue.value === 21 && dealerCards.length === 2

    if (hasDealerBlackjack) {
      // Reveal dealer's hole card
      setGameState((prev) => ({
        ...prev,
        dealerHand: {
          ...prev.dealerHand,
          cards: prev.dealerHand.cards.map((c) => ({ ...c, faceUp: true })),
        },
      }))

      setTimeout(() => {
        setGameState((prev) => {
          const updatedPlayers = prev.players.map((p) => {
            // Insurance pays 2:1, so return insurance bet + 2x insurance bet
            const insurancePayout = p.insuranceBet ? p.insuranceBet * 3 : 0
            const playerHasBlackjack =
              calculateHandValue(p.hands[0].cards).value === 21 && p.hands[0].cards.length === 2

            // Bet was already deducted, so add it back
            const betReturn = playerHasBlackjack ? p.hands[0].bet : 0

            return {
              ...p,
              bankroll: p.bankroll + insurancePayout + betReturn,
              hands: [{ ...p.hands[0], isActive: false }],
            }
          })

          const humanPlayer = updatedPlayers.find((p) => p.type === "human")
          const profit = humanPlayer ? humanPlayer.bankroll - bankrollAtRoundStart : 0

          // Set appropriate result
          if (profit > 0) {
            setRoundResult("win")
          } else if (profit < 0) {
            setRoundResult("lose")
          } else {
            setRoundResult("push")
          }

          setStatistics((s) => ({
            ...s,
            handsPlayed: s.handsPlayed + 1,
            handsWon: s.handsWon + (profit > 0 ? 1 : 0),
            totalWagered: s.totalWagered + humanPlayer.hands[0].bet,
            netProfit: s.netProfit + profit,
            biggestWin: Math.max(s.biggestWin, profit),
          }))

          return {
            ...prev,
            phase: "round-end",
            dealerHand: revealedDealerHand,
            players: updatedPlayers,
          }
        })
      }, getDelay("result"))
    } else {
      // No dealer blackjack - continue to player turn, but check for player blackjack first
      setGameState((prev) => ({ ...prev, phase: "player-turn" }))
      setTimeout(() => {
        checkForPlayerBlackjack()
      }, getDelay("card"))
    }
  }

  const checkForPlayerBlackjack = () => {
    setGameState((prev) => {
      const humanPlayer = prev.players.find((p) => p.type === "human")
      if (!humanPlayer) return prev

      const playerHand = humanPlayer.hands[0]
      const playerHasBlackjack = isBlackjack(playerHand)

      if (playerHasBlackjack) {
        // Check if dealer also has blackjack
        const dealerCards = prev.dealerHand.cards.map((c) => ({ ...c, faceUp: true }))
        const dealerHasBlackjack = isBlackjack({ ...prev.dealerHand, cards: dealerCards })

        // Reveal dealer cards
        const revealedDealerHand = {
          ...prev.dealerHand,
          cards: dealerCards,
        }

        // Calculate payouts
        const updatedPlayers = prev.players.map((player) => {
          let playerWinnings = 0
          const hand = player.hands[0]
          const hasBlackjack = isBlackjack(hand)

          if (hasBlackjack && dealerHasBlackjack) {
            // Push - return bet
            playerWinnings = hand.bet
          } else if (hasBlackjack) {
            // Blackjack pays 3:2
            playerWinnings = hand.bet * 2.5
          } else if (dealerHasBlackjack) {
            // Dealer blackjack - player loses (bet already deducted)
            playerWinnings = 0
          }

          return {
            ...player,
            bankroll: player.bankroll + playerWinnings,
            hands: [{ ...hand, isActive: false }],
          }
        })

        const humanPlayerUpdated = updatedPlayers.find((p) => p.type === "human")
        const profit = humanPlayerUpdated ? humanPlayerUpdated.bankroll - bankrollAtRoundStart : 0

        // Set appropriate result
        if (dealerHasBlackjack && isBlackjack(humanPlayer.hands[0])) {
          setRoundResult("push")
        } else if (isBlackjack(humanPlayer.hands[0])) {
          setRoundResult("blackjack")
        } else {
          setRoundResult("lose")
        }

        setStatistics((s) => ({
          ...s,
          handsPlayed: s.handsPlayed + 1,
          handsWon: s.handsWon + (profit > 0 ? 1 : 0),
          totalWagered: s.totalWagered + humanPlayer.hands[0].bet,
          netProfit: s.netProfit + profit,
          biggestWin: Math.max(s.biggestWin, profit),
        }))

        return {
          ...prev,
          phase: "round-end",
          dealerHand: revealedDealerHand,
          players: updatedPlayers,
        }
      }

      return prev
    })
  }

  const canSurrender = (() => {
    if (!settings.lateSurrender) return false
    if (gameState.phase !== "player-turn") return false

    const currentPlayer = gameState.players[gameState.currentPlayerIndex]
    if (!currentPlayer || currentPlayer.type !== "human") return false

    const currentHand = currentPlayer.hands[currentPlayer.currentHandIndex]
    if (!currentHand) return false

    // Can only surrender on initial 2 cards, not after hitting or on split hands
    return currentHand.cards.length === 2 && !currentHand.isSplit
  })()

  const humanPlayer = getHumanPlayer()
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]
  const currentHand = currentPlayer?.hands[currentPlayer.currentHandIndex]
  const dealerUpCard = gameState.dealerHand.cards.length > 0 ? gameState.dealerHand.cards[0] : null
  const isHumanTurn = currentPlayer?.type === "human" && gameState.phase === "player-turn"

  // Get strategy suggestion for overlay
  const strategySuggestion =
    isHumanTurn && currentHand && dealerUpCard && settings.showCoaching
      ? getBasicStrategyRecommendation(currentHand.cards, dealerUpCard)?.action
      : undefined

  const insuranceSuggestion =
    gameState.phase === "insurance" && settings.showCoaching
      ? ((gameState.trueCount >= 3 ? "take" : "decline") as "take" | "decline")
      : undefined

  // Blackjack celebration messages array
  const getRandomBlackjackMessage = () => {
    const messages = [
      "BLACKJACK! 💰",
      "Yes! Blackjack baby!",
      "Natural 21! Beautiful!",
      "Blackjack pays 3:2!",
      "That's how it's done!",
      "Perfect hand!",
      "Blackjack! Count it!",
      "21 on the deal! Nice!",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getRandomDealerBustMessage = (allPlayersWin: boolean) => {
    const bustMessages = [
      "Dealer Busts!",
      "Dealer goes over 21!",
      "Bust! Dealer loses!",
      "Too many! Dealer busts!",
      "Over 21! Dealer's out!",
    ]
    const bustMsg = bustMessages[Math.floor(Math.random() * bustMessages.length)]

    if (allPlayersWin) {
      const everyoneWins = [
        " Everyone's a winner!",
        " Winners all around!",
        " The table wins!",
        " Payday for everyone!",
      ]
      return bustMsg + everyoneWins[Math.floor(Math.random() * everyoneWins.length)]
    }
    return bustMsg + " You Win!"
  }

  const getRandomPlayerBustMessage = () => {
    const messages = [
      "Bust! Over 21",
      "Too many! You bust",
      "Ouch! Busted",
      "Over 21... busted",
      "Bust! Better luck next hand",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getRandomWinMessage = () => {
    const messages = ["You Win!", "Winner winner!", "Nice hand!", "That's a win!", "Well played!", "You got 'em!"]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getRandomLoseMessage = () => {
    const messages = ["Dealer wins", "House takes it", "Not this time", "Dealer's hand", "Better luck next time"]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // Place these around line 1126 where the other message functions are

  const getRandomBlackjackMessageImmediate = () => {
    const messages = [
      "BLACKJACK!",
      "Yes! Blackjack baby!",
      "Natural 21! Beautiful!",
      "Blackjack pays 3:2!",
      "That's how it's done!",
      "Perfect hand!",
      "Blackjack! Count it!",
      "21 on the deal! Nice!",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getRandomDealerBustMessageImmediate = (allPlayersWin: boolean) => {
    const bustMessages = [
      "Dealer Busts!",
      "Dealer goes over 21!",
      "Bust! Dealer loses!",
      "Too many! Dealer busts!",
      "Over 21! Dealer's out!",
    ]
    const bustMsg = bustMessages[Math.floor(Math.random() * bustMessages.length)]

    if (allPlayersWin) {
      const everyoneWins = [
        " Everyone's a winner!",
        " Winners all around!",
        " The table wins!",
        " Payday for everyone!",
      ]
      return bustMsg + everyoneWins[Math.floor(Math.random() * everyoneWins.length)]
    }
    return bustMsg + " You Win!"
  }

  const getRandomPlayerBustMessageImmediate = () => {
    const messages = [
      "Bust! Over 21",
      "Too many! You bust",
      "Ouch! Busted",
      "Over 21... busted",
      "Bust! Better luck next hand",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getRandomWinMessageImmediate = () => {
    const messages = ["You Win!", "Winner winner!", "Nice hand!", "That's a win!", "Well played!", "You got 'em!"]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getRandomLoseMessageImmediate = () => {
    const messages = ["Dealer wins", "House takes it", "Not this time", "Dealer's hand", "Better luck next time"]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  if (showShoePreparation) {
    return <ShoePreparationScreen numDecks={settings.numberOfDecks} onComplete={() => setShowShoePreparation(false)} />
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* ========== TABLE FELT BACKGROUND ========== */}
      <div className="absolute inset-0 table-felt" />

      {/* ========== CASINO/CHARACTER INFO (top corners) ========== */}
      {selectedCasino && (
        <div className="fixed left-2 top-2 md:left-4 md:top-4 z-30 glass-panel rounded-lg md:rounded-xl px-2 py-1 md:px-4 md:py-2">
          <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500">Playing at</div>
          <div className="text-xs md:text-base font-semibold text-neon-gold">{selectedCasino.name}</div>
        </div>
      )}

      <div className="fixed right-2 top-2 md:right-4 md:top-4 z-30 flex flex-col gap-1 md:gap-2 items-end">
        {selectedCharacter && (
          <div className="glass-panel rounded-lg md:rounded-xl px-2 py-1 md:px-4 md:py-2 text-right">
            <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500">Playing as</div>
            <div className="text-xs md:text-base font-semibold text-neon-purple">{selectedCharacter.nickname}</div>
          </div>
        )}
        {settings.showPlayerStats && (
          <StatisticsPanel
            handsPlayed={statistics.handsPlayed}
            handsWon={statistics.handsWon}
            totalWagered={statistics.totalWagered}
            netProfit={statistics.netProfit}
            biggestWin={statistics.biggestWin}
          />
        )}
        {/* Shoe indicator - positioned on dealer's left (player's right view) */}
        <div className="glass-panel rounded-lg md:rounded-xl px-2 py-1 md:px-3 md:py-2">
          <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500 mb-1">Shoe</div>
          <ShoeIndicator />
        </div>
      </div>

      {/* ========== BANKROLL DISPLAY ========== */}
      {humanPlayer && (
        <div className="fixed left-2 top-12 md:left-4 md:top-20 z-30 glass-panel rounded-lg md:rounded-xl px-2 py-1 md:px-4 md:py-2">
          <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500">Bankroll</div>
          <div className="text-sm md:text-xl font-bold text-white">${humanPlayer.bankroll.toLocaleString()}</div>
        </div>
      )}

      {/* ========== COUNT OVERLAY (center top) ========== */}
      <CountOverlay
        runningCount={gameState.runningCount}
        trueCount={gameState.trueCount}
        decksRemaining={gameState.decksRemaining}
        system={settings.countingSystem}
        visible={settings.showCount}
        strategySuggestion={strategySuggestion}
        showInsurancePrompt={gameState.phase === "insurance"}
        insuranceSuggestion={insuranceSuggestion}
        countAloud={settings.countAloud} // Added countAloud to CountOverlay
      />

      {/* ========== VERBOSE COACHING PANEL (bottom-left, behind settings) ========== */}
      {settings.showVerboseCoaching && currentHand && (
        <div className="fixed bottom-20 md:bottom-16 left-2 right-2 md:left-4 md:right-auto z-30 md:w-full md:max-w-md mb-2">
          <VerboseCoachingPanel
            playerHand={currentHand}
            dealerUpCard={dealerUpCard}
            dealerHand={gameState.dealerHand}
            trueCount={gameState.trueCount}
            runningCount={gameState.runningCount}
            decksRemaining={gameState.decksRemaining}
            minBet={settings.minBet}
            maxBet={settings.maxBet}
            bankroll={humanPlayer?.bankroll || 0}
            bettingStyle={settings.bettingStyle}
            lastBet={lastBet}
            lastHandWon={roundResult === "win"}
            phase={gameState.phase}
            visible={settings.showVerboseCoaching}
            settings={settings}
            readAloud={settings.readAloud}
            onToggleReadAloud={(enabled) => setSettings((prev) => ({ ...prev, readAloud: enabled }))}
            countAloud={settings.countAloud} // Added countAloud to VerboseCoachingPanel
            allPlayers={gameState.players} // Added allPlayers prop for count explanation
            isHumanTurn={isHumanTurn} // Pass isHumanTurn to control speech timing
          />
        </div>
      )}

      {/* ========== MAIN PLAY AREA ========== */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-24 md:pt-36 pb-56 md:pb-48 px-2 md:px-4">
        {/* Dealer area - fixed height to prevent layout shift */}
        <div className="flex flex-col items-center gap-1 md:gap-2 mb-4 md:mb-6 min-h-[120px] md:min-h-[160px]">
          <div className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-wider">Dealer</div>
          <div className="flex gap-1 md:gap-2 min-h-[80px] md:min-h-[100px] items-center">
            {gameState.dealerHand.cards.length > 0 ? (
              gameState.dealerHand.cards.map((card, idx) => (
                <PlayingCard
                  key={idx}
                  card={settings.showDownCards ? { ...card, faceUp: true } : card}
                  size="responsive"
                />
              ))
            ) : (
              <div className="flex gap-1 md:gap-2 opacity-0 pointer-events-none">
                <div className="w-[50px] h-[70px] md:w-[70px] md:h-[98px]" />
                <div className="w-[50px] h-[70px] md:w-[70px] md:h-[98px]" />
              </div>
            )}
          </div>
          {gameState.dealerHand.cards.length > 0 &&
            (gameState.phase === "dealer-turn" || gameState.phase === "round-end") && (
              <div className="text-xl md:text-2xl font-bold text-white">
                {calculateHandValue(gameState.dealerHand.cards).value}
              </div>
            )}
        </div>

        {/* Player seats - right to left from dealer's perspective (seat 1 = first base on right) */}
        <div className="flex flex-row-reverse gap-2 md:gap-4 flex-wrap justify-center max-w-full md:max-w-4xl mt-2">
          {gameState.players.map((player, idx) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isCurrentPlayer={idx === gameState.currentPlayerIndex && gameState.phase === "player-turn"}
              isHumanPlayer={player.type === "human"}
              showDownCards={settings.showDownCards}
            />
          ))}
        </div>

        {/* Status messages */}
        {gameState.phase === "dealing" && <div className="mt-8 text-lg text-slate-400 animate-pulse">Dealing...</div>}
        {gameState.phase === "player-turn" && !isHumanTurn && currentPlayer && (
          <div className="mt-8 text-lg text-slate-400">{currentPlayer.name} is playing...</div>
        )}
        {gameState.phase === "dealer-turn" && <div className="mt-8 text-lg text-slate-400">Dealer is playing...</div>}
        {/* Update the display to use displayedRoundMessage */}
        {gameState.phase === "round-end" && displayedRoundMessage && (
          <div
            className={`mt-8 text-xl font-bold ${
              roundResult === "win" || roundResult === "blackjack" || roundResult === "dealer-bust"
                ? "text-green-400"
                : roundResult === "lose" || roundResult === "player-bust"
                  ? "text-red-400"
                  : "text-yellow-400"
            }`}
          >
            {displayedRoundMessage}
          </div>
        )}
      </div>

      {/* ========== FIXED CONTROLS (bottom) ========== */}
      <GameControlsPanel
        phase={gameState.phase}
        currentBet={humanPlayer?.currentBet || 0}
        minBet={settings.minBet}
        maxBet={settings.maxBet}
        bankroll={humanPlayer?.bankroll || 0}
        isHumanTurn={isHumanTurn}
        onHit={handleHit}
        onStand={handleStand}
        onDouble={handleDouble}
        onSplit={handleSplit}
        onSurrender={handleSurrender}
        onInsurance={handleInsuranceBet}
        onPlaceBet={placeBet}
        onClearBet={clearBet}
        onDeal={startRound}
        onRebet={handleRebet}
        onNewRound={newRound}
        canDouble={
          currentHand ? canDouble(currentHand) && (humanPlayer?.bankroll || 0) >= (currentHand?.bet || 0) : false
        }
        canSplit={
          currentHand
            ? canSplit(currentHand) &&
              (humanPlayer?.bankroll || 0) >= (currentHand?.bet || 0) &&
              (currentPlayer?.hands.length || 0) < settings.maxResplitHands
            : false
        }
        canSurrender={canSurrender}
        canInsurance={gameState.phase === "insurance"}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  )
}
