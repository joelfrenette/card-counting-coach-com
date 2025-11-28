"use client"

import { useState, useCallback } from "react"
import { ShufflingSequence } from "@/components/shuffling-sequence"
import { CutDeckModal } from "@/components/cut-deck-modal"

interface ShoePreparationScreenProps {
  numDecks: number
  onComplete: () => void
}

export function ShoePreparationScreen({ numDecks, onComplete }: ShoePreparationScreenProps) {
  const [phase, setPhase] = useState<"shuffling" | "cutting" | "complete">("shuffling")
  const totalCards = numDecks * 52

  const handleShuffleComplete = useCallback(() => {
    setPhase("cutting")
  }, [])

  const handleCutComplete = useCallback(() => {
    setPhase("complete")
    onComplete()
  }, [onComplete])

  return (
    <>
      <ShufflingSequence numDecks={numDecks} onComplete={handleShuffleComplete} isVisible={phase === "shuffling"} />
      <CutDeckModal isVisible={phase === "cutting"} onComplete={handleCutComplete} totalCards={totalCards} />
    </>
  )
}
