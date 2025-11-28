"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, User, ChevronLeft } from "lucide-react"
import { CHARACTERS, type CharacterProfile, type BankrollLevel } from "@/lib/characters"

interface CharacterSelectorProps {
  onSelect: (character: CharacterProfile) => void
  onBack?: () => void
}

export function CharacterSelector({ onSelect, onBack }: CharacterSelectorProps) {
  const sortedCharacters = [...CHARACTERS].sort((a, b) => a.name.localeCompare(b.name))

  const getBankrollLevelColor = (level: BankrollLevel) => {
    switch (level) {
      case "low":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "mid":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "high":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    }
  }

  const getBankrollLevelLabel = (level: BankrollLevel) => {
    switch (level) {
      case "low":
        return "Grinder"
      case "mid":
        return "Professional"
      case "high":
        return "Whale"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          {/* Back button and title on same row */}
          <div className="relative flex items-center justify-center mb-2">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                className="absolute left-0 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Casinos
              </Button>
            )}
            <div className="flex items-center gap-3">
              <User className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold text-balance">Choose Your Character</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Each character brings authentic counting systems, and betting strategies.
          </p>
        </div>
        {/* End of header changes */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCharacters.map((character) => (
            <Card
              key={character.id}
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{character.name}</CardTitle>
                    <CardDescription className="text-base font-medium text-foreground/70">
                      {character.nickname}
                    </CardDescription>
                  </div>
                  <Badge className={getBankrollLevelColor(character.bankrollLevel)}>
                    {getBankrollLevelLabel(character.bankrollLevel)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-pretty">{character.description}</p>

                <div className="grid grid-cols-2 gap-3 py-3 border-y">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Bankroll</div>
                    <div className="font-semibold">${(character.bankroll / 1000).toFixed(0)}k</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Bet Spread</div>
                    <div className="font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      1:{character.betSpreadRatio}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Min Bet</div>
                    <div className="font-semibold">${character.minBet}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Max Bet</div>
                    <div className="font-semibold">${character.maxBet.toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Counting System</div>
                  <Badge variant="outline" className="font-mono uppercase">
                    {character.countingSystem}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-2">Special Features</div>
                  <div className="flex flex-wrap gap-1">
                    {character.specialFeatures.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-xs text-muted-foreground mb-1">Cover Strategy</div>
                  <p className="text-xs text-muted-foreground italic text-pretty">"{character.coverStrategy}"</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Inspired by:</span> {character.inspiredBy}
                </div>

                <Button
                  onClick={() => onSelect(character)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Play as {character.nickname}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
