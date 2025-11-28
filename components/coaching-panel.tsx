"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Info, TrendingUp, Target, Zap, Percent } from "lucide-react"
import type { Hand, GameSettings } from "@/lib/types"
import { getBasicStrategyAdvice } from "@/lib/basic-strategy"
import { canDouble, canSplit, calculateHandValue } from "@/lib/blackjack"
import { bettingStyles, calculateBetAmount } from "@/lib/betting-styles"
import type { BettingStyle } from "@/lib/types"
import { getIndexPlay, calculatePlayerEdge, getOptimalBetMultiplier } from "@/lib/index-plays"
import { getHouseEdgeFromSettings, getRuleVariantName } from "@/lib/rule-variants"

interface CoachingPanelProps {
  playerHand: Hand
  dealerUpCard: { rank: string } | null
  trueCount: number
  minBet: number
  maxBet: number
  bankroll: number
  bettingStyle: BettingStyle
  lastBet: number
  lastHandWon: boolean
  phase: string
  visible: boolean
  settings: GameSettings // Added settings to get rule variants
  showIndexPlays: boolean // Added toggle for index plays
}

export function CoachingPanel({
  playerHand,
  dealerUpCard,
  trueCount,
  minBet,
  maxBet,
  bankroll,
  bettingStyle,
  lastBet,
  lastHandWon,
  phase,
  visible,
  settings,
  showIndexPlays,
}: CoachingPanelProps) {
  if (!visible) return null

  const baseHouseEdge = getHouseEdgeFromSettings(settings)
  const playerEdge = calculatePlayerEdge(trueCount, baseHouseEdge)
  const ruleVariant = getRuleVariantName(settings)

  const advice =
    dealerUpCard && playerHand.cards.length > 0
      ? getBasicStrategyAdvice(playerHand.cards, dealerUpCard.rank as any, canDouble(playerHand), canSplit(playerHand))
      : null

  const indexPlay =
    showIndexPlays && dealerUpCard && playerHand.cards.length > 0
      ? getIndexPlay(
          calculateHandValue(playerHand.cards).value,
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

  const bettingAdvice = calculateBetAmount(trueCount, minBet, maxBet, bankroll, bettingStyle, lastBet, lastHandWon)

  const styleInfo = bettingStyles[bettingStyle]

  const optimalMultiplier = playerEdge > 0 ? getOptimalBetMultiplier(playerEdge, bankroll, minBet) : 1

  return (
    <Card className="p-4 bg-card/95 backdrop-blur space-y-4 w-full max-w-md">
      <div className="flex items-center gap-2">
        <Info className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Coaching Tips</h3>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-secondary" />
            <span className="text-xs font-semibold text-muted-foreground">Player Edge</span>
          </div>
          <Badge variant={playerEdge > 0 ? "default" : "secondary"} className="text-sm">
            {playerEdge > 0 ? "+" : ""}
            {playerEdge}%
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {ruleVariant} • Base: {baseHouseEdge}%
        </div>
        {playerEdge > 0 && (
          <div className="text-xs text-primary font-semibold">
            Optimal: {optimalMultiplier}x bet (${minBet * optimalMultiplier})
          </div>
        )}
      </div>

      {phase === "betting" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-secondary" />
            <div className="text-sm font-semibold">Betting Recommendation</div>
          </div>
          {bettingAdvice.amount === 0 ? (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-lg font-bold text-amber-500 mb-1">Wong Out</div>
              <div className="text-xs text-muted-foreground">{bettingAdvice.reason}</div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-2xl font-bold text-primary mb-1">${bettingAdvice.amount}</div>
              <div className="text-xs text-muted-foreground">{bettingAdvice.reason}</div>
            </div>
          )}
          <div className="border-t border-border pt-2">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Style: {styleInfo.name}</div>
            <div className="text-xs text-muted-foreground">{styleInfo.description}</div>
          </div>
        </div>
      )}

      {phase === "player-turn" && (
        <div className="space-y-3">
          {/* Basic Strategy */}
          {advice && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-secondary" />
                <div className="text-sm font-semibold">Basic Strategy</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default" className="uppercase">
                    {advice.action}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{advice.reason}</div>
              </div>
            </div>
          )}

          {showIndexPlays && indexPlay && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <div className="text-sm font-semibold text-amber-500">Index Play Deviation</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="uppercase bg-amber-500/20 text-amber-500 border-amber-500">
                    {indexPlay.indexAction}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    instead of {indexPlay.basicAction.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">{indexPlay.description}</div>
                <div className="text-xs text-amber-500 font-semibold">Edge gain: {indexPlay.edgeGain}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {trueCount !== 0 && (
        <div className="border-t border-border pt-3">
          <div className="text-xs text-muted-foreground">
            {trueCount > 0 ? (
              <span className="text-primary font-semibold">
                Favorable count! Increase bets and take insurance when offered.
              </span>
            ) : (
              <span className="text-destructive">Negative count. Play conservatively with minimum bets.</span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
