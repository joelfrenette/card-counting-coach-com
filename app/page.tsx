"use client"

import { useState, useEffect } from "react"
import { BlackjackGame } from "@/components/blackjack-game"
import { CasinoSelector } from "@/components/casino-selector"
import { CharacterSelector } from "@/components/character-selector"
import { TableSelector, type TableSelection } from "@/components/table-selector"
import { SummaryPrepScreen } from "@/components/summary-prep-screen"
import { LandingSplash } from "@/components/landing-splash"
import { ShoeProvider } from "@/contexts/shoe-context"
import type { CasinoRules } from "@/lib/casinos"
import type { CharacterProfile } from "@/lib/characters"

export default function HomePage() {
  const [showLanding, setShowLanding] = useState(true)
  const [selectedCasino, setSelectedCasino] = useState<CasinoRules | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null)
  const [tableSelection, setTableSelection] = useState<TableSelection | null>(null)
  const [showPrepScreen, setShowPrepScreen] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [showLanding, selectedCasino, selectedCharacter, tableSelection, showPrepScreen, gameStarted])

  if (showLanding) {
    return <LandingSplash onStart={() => setShowLanding(false)} />
  }

  if (!selectedCasino) {
    return <CasinoSelector onSelect={setSelectedCasino} />
  }

  if (!selectedCharacter) {
    return <CharacterSelector onSelect={setSelectedCharacter} onBack={() => setSelectedCasino(null)} />
  }

  if (!tableSelection) {
    return (
      <TableSelector
        casino={selectedCasino}
        onSelect={(selection) => {
          setTableSelection(selection)
          setShowPrepScreen(true)
          setGameStarted(false)
        }}
        onBack={() => setSelectedCharacter(null)}
      />
    )
  }

  if (showPrepScreen && !gameStarted) {
    return (
      <SummaryPrepScreen
        casino={selectedCasino}
        character={selectedCharacter}
        tableSelection={tableSelection}
        onStartGame={() => {
          setShowPrepScreen(false)
          setGameStarted(true)
        }}
        onBack={() => setTableSelection(null)}
      />
    )
  }

  return (
    <ShoeProvider>
      <main className="min-h-screen bg-background">
        <BlackjackGame
          selectedCasino={selectedCasino}
          selectedCharacter={selectedCharacter}
          tableSelection={tableSelection}
        />
      </main>
    </ShoeProvider>
  )
}
