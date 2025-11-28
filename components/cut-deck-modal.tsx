"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useShoe } from "@/contexts/shoe-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface CutDeckModalProps {
  isVisible: boolean
  onComplete: () => void
  totalCards: number
  casinoPenetration?: number // Casino's predetermined penetration (default 75%)
}

export function CutDeckModal({ isVisible, onComplete, totalCards, casinoPenetration = 0.75 }: CutDeckModalProps) {
  const { cutDeck, setPenetrationMarker, burnTopCard, setShoeReady } = useShoe()
  const [cutPosition, setCutPosition] = useState(0.5)
  const [phase, setPhase] = useState<"cut" | "cutting" | "inserting" | "burning" | "ready">("cut")

  const cutCardIndex = Math.floor(totalCards * cutPosition)
  const cardsAboveCut = cutCardIndex
  const cardsBelowCut = totalCards - cutCardIndex

  // Calculate how many cards will be behind the red cut card (never dealt)
  const cardsNeverDealt = Math.floor(totalCards * (1 - casinoPenetration))

  const handleConfirmCut = useCallback(() => {
    setPhase("cutting")

    // Step 1: Perform the player's cut (reorganizes deck)
    cutDeck(cutPosition)

    // Animate cutting
    setTimeout(() => {
      // Step 2: Dealer inserts the red penetration card
      setPhase("inserting")
      setPenetrationMarker(casinoPenetration)

      setTimeout(() => {
        // Step 3: Burn the top card
        setPhase("burning")

        setTimeout(() => {
          burnTopCard()
          setPhase("ready")

          // Mark shoe as ready and complete
          setTimeout(() => {
            setShoeReady()
            onComplete()
          }, 1500)
        }, 1500)
      }, 2000) // Show inserting phase for 2 seconds
    }, 1500)
  }, [cutDeck, cutPosition, setPenetrationMarker, casinoPenetration, burnTopCard, setShoeReady, onComplete])

  const handleSkipCut = useCallback(() => {
    // Default cut at ~50%
    cutDeck(0.5)
    setPenetrationMarker(casinoPenetration)
    burnTopCard()
    setShoeReady()
    onComplete()
  }, [cutDeck, setPenetrationMarker, casinoPenetration, burnTopCard, setShoeReady, onComplete])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900"
      >
        {/* Title */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {phase === "cut" && "Cut the Deck"}
          {phase === "cutting" && "Completing Cut..."}
          {phase === "inserting" && "Dealer Inserts Cut Card"}
          {phase === "burning" && "Burning Top Card"}
          {phase === "ready" && "Shoe Ready!"}
        </motion.h1>

        <motion.p className="text-amber-200/60 mb-8 text-center px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {phase === "cut" && "Choose where to cut the deck"}
          {phase === "cutting" && "Moving bottom portion to top..."}
          {phase === "inserting" &&
            `Placing red card at ${Math.round(casinoPenetration * 100)}% (${cardsNeverDealt} cards will not be dealt)`}
          {phase === "burning" && "Discarding the first card..."}
          {phase === "ready" && `${totalCards - 1} cards ready to deal`}
        </motion.p>

        {/* Visual deck representation */}
        <div className="relative w-80 md:w-[28rem] h-32 mb-4">
          {/* Cutting phase - player's cut */}
          {phase === "cut" && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Horizontal deck visualization */}
              <div className="relative w-72 md:w-96 h-24 flex">
                {/* Left portion (cards before cut) */}
                <motion.div
                  className="relative bg-gradient-to-br from-blue-800 to-blue-950 rounded-lg shadow-xl overflow-hidden"
                  style={{ width: `${cutPosition * 100}%` }}
                >
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />
                  <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
                    {cardsAboveCut} cards
                  </div>
                </motion.div>

                {/* White/yellow cut card (player's blank card) - vertical line */}
                <motion.div
                  className="w-1.5 h-full bg-gradient-to-b from-amber-100 to-amber-200 shadow-lg z-10 flex-shrink-0"
                  animate={{
                    boxShadow: [
                      "0 0 10px rgba(251,191,36,0.5)",
                      "0 0 20px rgba(251,191,36,0.8)",
                      "0 0 10px rgba(251,191,36,0.5)",
                    ],
                  }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                />

                {/* Right portion (cards after cut) */}
                <motion.div className="relative bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg shadow-xl overflow-hidden flex-1">
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />
                  <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
                    {cardsBelowCut} cards
                  </div>
                </motion.div>
              </div>

              {/* Labels above deck */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-72 md:w-96 flex justify-between text-white/40 text-xs">
                <span>Front</span>
                <span>Back</span>
              </div>
            </motion.div>
          )}

          {/* Cutting animation */}
          {phase === "cutting" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 md:w-96 h-24 flex">
                {/* Left portion stays */}
                <motion.div
                  className="relative bg-gradient-to-br from-blue-800 to-blue-950 rounded-lg shadow-xl"
                  style={{ width: `${cutPosition * 100}%` }}
                >
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />
                </motion.div>

                {/* Right portion moves to front */}
                <motion.div
                  className="absolute bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg shadow-xl h-24"
                  initial={{
                    left: `${cutPosition * 100}%`,
                    width: `${(1 - cutPosition) * 100}%`,
                  }}
                  animate={{
                    left: 0,
                    y: [0, -30, -30, 0],
                    x: [0, 0, `-${cutPosition * 100}%`, `-${cutPosition * 100}%`],
                  }}
                  transition={{ duration: 1.2, times: [0, 0.3, 0.7, 1] }}
                >
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Inserting red cut card animation */}
          {phase === "inserting" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-72 md:w-96 h-24">
                {/* Combined deck after cut */}
                <motion.div className="w-full h-full bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg shadow-xl relative overflow-hidden">
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />

                  {/* Red cut card being inserted */}
                  <motion.div
                    className="absolute top-0 h-full w-2 bg-gradient-to-b from-red-500 to-red-600 z-10"
                    initial={{
                      right: 0,
                      opacity: 0,
                      y: -40,
                    }}
                    animate={{
                      right: `${(1 - casinoPenetration) * 100}%`,
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 1.5,
                      ease: "easeOut",
                    }}
                    style={{
                      boxShadow: "0 0 15px rgba(239,68,68,0.8)",
                    }}
                  />

                  {/* Label showing where red card is */}
                  <motion.div
                    className="absolute -bottom-8 text-red-400 text-xs font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    style={{ right: `${(1 - casinoPenetration) * 100}%`, transform: "translateX(50%)" }}
                  >
                    Red Cut Card
                  </motion.div>
                </motion.div>

                {/* Cards behind red card (never dealt) label */}
                <motion.div
                  className="absolute -top-6 text-white/40 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  style={{ right: `${((1 - casinoPenetration) / 2) * 100}%`, transform: "translateX(50%)" }}
                >
                  {cardsNeverDealt} cards never dealt
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Burning animation */}
          {phase === "burning" && (
            <motion.div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Main deck - horizontal with red card visible */}
                <motion.div className="w-72 md:w-96 h-24 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg shadow-xl relative overflow-hidden">
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />
                  {/* Red cut card in position */}
                  <div
                    className="absolute top-0 h-full w-2 bg-gradient-to-b from-red-500 to-red-600"
                    style={{
                      right: `${(1 - casinoPenetration) * 100}%`,
                      boxShadow: "0 0 10px rgba(239,68,68,0.6)",
                    }}
                  />
                </motion.div>

                {/* Burn card sliding off to the left */}
                <motion.div
                  className="absolute top-0 left-0 w-16 h-24 bg-gradient-to-br from-blue-800 to-blue-950 rounded-lg shadow-xl"
                  initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: -80,
                    y: -30,
                    rotate: -15,
                    opacity: 0.5,
                  }}
                  transition={{ duration: 1 }}
                >
                  <div className="absolute inset-1 border-2 border-white/20 rounded" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-red-500 text-sm font-bold">BURN</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Ready state */}
          {phase === "ready" && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="relative">
                {/* Loaded shoe - horizontal */}
                <motion.div
                  className="w-56 h-28 md:w-64 md:h-32 bg-gradient-to-r from-amber-900 to-amber-800 rounded-lg shadow-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(34,197,94,0.2)",
                      "0 0 40px rgba(34,197,94,0.4)",
                      "0 0 20px rgba(34,197,94,0.2)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <div className="absolute left-2 top-2 bottom-2 w-6 bg-amber-950/50 rounded-l flex items-center justify-center">
                    <div className="w-4 h-20 bg-gradient-to-br from-blue-700 to-blue-900 rounded" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        className="text-green-400 text-3xl"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      >
                        ✓
                      </motion.div>
                      <div className="text-amber-200/80 text-sm mt-1">Ready to Deal</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Cut position slider */}
        {phase === "cut" && (
          <motion.div className="w-72 md:w-96 space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between text-white/60 text-sm">
              <span>10%</span>
              <span className="text-amber-400">Cut at {Math.round(cutPosition * 100)}%</span>
              <span>90%</span>
            </div>

            <Slider
              value={[cutPosition * 100]}
              onValueChange={(value) => setCutPosition(value[0] / 100)}
              min={10}
              max={90}
              step={1}
              className="w-full"
            />

            <div className="text-center text-white/40 text-xs">
              {cardsAboveCut} cards above cut | {cardsBelowCut} cards below
            </div>

            {/* Info about what happens next */}
            <div className="text-center text-white/30 text-xs mt-2 border-t border-white/10 pt-2">
              After you cut, dealer will insert the red cut card at {Math.round(casinoPenetration * 100)}%
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={handleSkipCut}
                className="border-white/20 text-white/60 hover:bg-white/10 bg-transparent"
              >
                Skip (Default 50%)
              </Button>
              <Button onClick={handleConfirmCut} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm Cut
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
