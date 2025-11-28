"use client"

import { type CasinoRules, casinos } from "@/lib/casinos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Percent, Layers, Users } from "lucide-react"

interface CasinoSelectorProps {
  onSelect: (casino: CasinoRules) => void
}

export function CasinoSelector({ onSelect }: CasinoSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-serif text-4xl font-bold text-amber-400 md:text-5xl">Select Your Casino</h1>
          <p className="text-balance text-lg text-slate-300">
            Choose a casino to practice with authentic house rules and table limits
          </p>
        </div>

        {/* Casino Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {casinos.map((casino) => (
            <Card
              key={casino.id}
              className="cursor-pointer border-slate-700 bg-slate-900/80 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:bg-slate-900"
              onClick={() => onSelect(casino)}
            >
              <CardHeader>
                <div className="mb-2 flex items-start justify-between">
                  <CardTitle className="text-xl text-amber-400">{casino.name}</CardTitle>
                  <Badge variant="outline" className="border-amber-600/30 bg-amber-900/20 text-amber-400">
                    {casino.blackjackPayout}
                  </Badge>
                </div>
                <CardDescription className="text-slate-400">{casino.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-pretty text-sm leading-relaxed text-slate-300">{casino.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <div>
                      <div className="text-xs text-slate-400">Min Bet</div>
                      <div className="font-semibold text-slate-100">${casino.minBet}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2">
                    <Percent className="h-4 w-4 text-amber-400" />
                    <div>
                      <div className="text-xs text-slate-400">House Edge</div>
                      <div className="font-semibold text-slate-100">{casino.houseEdge}%</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2">
                    <Layers className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-xs text-slate-400">Decks</div>
                      <div className="font-semibold text-slate-100">{casino.numberOfDecks}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 p-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="text-xs text-slate-400">Table Spots</div>
                      <div className="font-semibold text-slate-100">
                        {casino.tableSizes.length > 1
                          ? `${Math.min(...casino.tableSizes)}-${Math.max(...casino.tableSizes)}`
                          : casino.tableSizes[0]}
                      </div>
                    </div>
                  </div>
                </div>

                {casino.tableNotes && (
                  <div className="rounded-lg bg-emerald-900/20 p-2 text-xs text-emerald-300">
                    <span className="font-semibold">Tables:</span> {casino.tableNotes}
                  </div>
                )}

                {casino.specialRules && casino.specialRules.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-amber-400">Special Rules:</div>
                    {casino.specialRules.map((rule, idx) => (
                      <div key={idx} className="text-xs text-slate-400">
                        • {rule}
                      </div>
                    ))}
                  </div>
                )}

                <Button className="w-full bg-amber-600 text-slate-950 hover:bg-amber-500">Play at {casino.name}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
