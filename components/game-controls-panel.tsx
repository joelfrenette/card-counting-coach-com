"use client"

import { useState, useMemo } from "react"
import {
  Settings,
  Eye,
  EyeOff,
  TrendingUp,
  Calculator,
  Lightbulb,
  BarChart3,
  Hash,
  Target,
  GraduationCap,
  Volume2,
  ListOrdered,
} from "lucide-react"
import { ActionButton, ChipButton, ToggleSwitch, SpeedSelector, SpeechSpeedSlider } from "./fixed-controls"
import { cn } from "@/lib/utils"
import type { GameSettings } from "@/lib/types"

interface GameControlsPanelProps {
  // ... existing props
  phase: "betting" | "dealing" | "player-turn" | "dealer-turn" | "round-end" | "insurance"
  currentBet: number
  minBet: number
  maxBet: number
  bankroll: number
  isHumanTurn: boolean
  onHit: () => void
  onStand: () => void
  onDouble: () => void
  onSplit: () => void
  onSurrender: () => void
  onInsurance: (take: boolean) => void
  onPlaceBet: (amount: number) => void
  onClearBet: () => void
  onDeal: () => void
  onRebet: (multiplier?: number) => void
  onNewRound: () => void
  canDouble: boolean
  canSplit: boolean
  canSurrender: boolean
  canInsurance: boolean
  lastBet?: number
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export function GameControlsPanel({
  phase,
  currentBet,
  minBet,
  maxBet,
  bankroll,
  isHumanTurn,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onSurrender,
  onInsurance,
  onPlaceBet,
  onClearBet,
  onDeal,
  onRebet,
  onNewRound,
  canDouble,
  canSplit,
  canSurrender,
  canInsurance,
  lastBet = 0,
  settings,
  onSettingsChange,
}: GameControlsPanelProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isBetting = phase === "betting"
  const isPlaying = phase === "player-turn" && isHumanTurn
  const isInsurance = phase === "insurance"
  const isRoundEnd = phase === "round-end"

  const effectiveMinBet = minBet > 0 ? minBet : 5
  const canDeal = isBetting && currentBet >= effectiveMinBet && currentBet > 0

  const chipValues = useMemo(() => {
    if (maxBet <= 500) return [5, 25, 100, 500] as const
    if (maxBet <= 5000) return [25, 100, 500, 1000] as const
    if (maxBet <= 25000) return [100, 500, 1000, 5000] as const
    if (maxBet <= 100000) return [1000, 5000, 10000, 25000] as const
    return [5000, 10000, 25000, 100000] as const
  }, [maxBet])

  return (
    <>
      {/* ========== BOTTOM-LEFT SETTINGS PANEL (collapsible) ========== */}
      <div className="fixed bottom-2 left-2 md:bottom-4 md:left-4 z-50">
        <button
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl glass-panel flex items-center justify-center transition-all",
            settingsOpen ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white",
          )}
          onClick={() => setSettingsOpen(!settingsOpen)}
        >
          <Settings className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {settingsOpen && (
          <div className="absolute bottom-14 md:bottom-16 left-0 w-64 md:w-72 glass-panel rounded-xl p-2 md:p-3 space-y-1 animate-in slide-in-from-left-2 duration-200 mb-2">
            <div className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 md:px-3 pb-2">
              Advantage Play Tools
            </div>

            <ToggleSwitch
              label="Running Count"
              icon={<Hash className="w-4 h-4" />}
              checked={settings.showCount}
              onChange={(checked) => onSettingsChange({ ...settings, showCount: checked })}
            />

            <ToggleSwitch
              label="True Count"
              icon={<Target className="w-4 h-4" />}
              checked={settings.showCount}
              onChange={(checked) => onSettingsChange({ ...settings, showCount: checked })}
            />

            <ToggleSwitch
              label="Bet Suggestions"
              icon={<TrendingUp className="w-4 h-4" />}
              checked={settings.showCoaching}
              onChange={(checked) => onSettingsChange({ ...settings, showCoaching: checked })}
            />

            <ToggleSwitch
              label="Basic Strategy"
              icon={<Lightbulb className="w-4 h-4" />}
              checked={settings.showCoaching}
              onChange={(checked) => onSettingsChange({ ...settings, showCoaching: checked })}
            />

            <ToggleSwitch
              label="Index Plays"
              icon={<Calculator className="w-4 h-4" />}
              checked={settings.showIndexPlays}
              onChange={(checked) => onSettingsChange({ ...settings, showIndexPlays: checked })}
            />

            <ToggleSwitch
              label="Player Stats"
              icon={<BarChart3 className="w-4 h-4" />}
              checked={settings.showPlayerStats}
              onChange={(checked) => onSettingsChange({ ...settings, showPlayerStats: checked })}
            />

            <ToggleSwitch
              label="Dealer Hole Card"
              icon={settings.showDownCards ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              checked={settings.showDownCards}
              onChange={(checked) => onSettingsChange({ ...settings, showDownCards: checked })}
            />

            <div className="border-t border-slate-700 mt-2 pt-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Learning Mode
              </div>

              <ToggleSwitch
                label="Coaching"
                icon={<GraduationCap className="w-4 h-4" />}
                checked={settings.showVerboseCoaching}
                onChange={(checked) => onSettingsChange({ ...settings, showVerboseCoaching: checked })}
              />

              {settings.showVerboseCoaching && (
                <>
                  <ToggleSwitch
                    label="Read Aloud"
                    icon={<Volume2 className="w-4 h-4" />}
                    checked={settings.readAloud}
                    onChange={(checked) => onSettingsChange({ ...settings, readAloud: checked })}
                  />
                  {settings.readAloud && (
                    <SpeechSpeedSlider
                      speed={settings.speechSpeed}
                      onChange={(speed) => onSettingsChange({ ...settings, speechSpeed: speed })}
                    />
                  )}
                  <ToggleSwitch
                    label="Count Aloud"
                    icon={<ListOrdered className="w-4 h-4" />}
                    checked={settings.countAloud}
                    onChange={(checked) => onSettingsChange({ ...settings, countAloud: checked })}
                  />
                </>
              )}
            </div>

            <div className="border-t border-slate-700 mt-2 pt-2">
              <SpeedSelector
                speed={settings.playSpeed}
                onChange={(speed) => onSettingsChange({ ...settings, playSpeed: speed })}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========== BOTTOM-RIGHT CONTROLS (always fixed) ========== */}
      <div className="fixed bottom-2 right-2 md:bottom-4 md:right-4 z-50 flex flex-col items-end gap-2 md:gap-3">
        {/* Current bet display */}
        {currentBet > 0 && (
          <div className="glass-panel rounded-lg md:rounded-xl px-2 py-1 md:px-4 md:py-2 text-center">
            <div className="text-[10px] md:text-xs text-slate-400">Bet</div>
            <div className="text-base md:text-xl font-bold text-neon-gold">${currentBet.toLocaleString()}</div>
          </div>
        )}

        {/* Row 3: Betting chips */}
        <div className="flex gap-1 md:gap-2 items-center">
          {chipValues.map((value) => {
            const wouldExceedMax = currentBet + value > maxBet
            const wouldExceedBankroll = currentBet + value > bankroll
            const chipExceedsTableMax = value > maxBet
            const isDisabled = !isBetting || wouldExceedMax || wouldExceedBankroll || chipExceedsTableMax

            return <ChipButton key={value} value={value} onClick={() => onPlaceBet(value)} disabled={isDisabled} />
          })}
        </div>

        {/* Row 2: Split and Insurance buttons */}
        <div className="flex gap-1 md:gap-2">
          <ActionButton label="Split" onClick={onSplit} disabled={!isPlaying || !canSplit} variant="warning" />
          <ActionButton label="Insure" onClick={() => onInsurance(true)} disabled={!isInsurance} variant="warning" />
          <ActionButton label="No Ins" onClick={() => onInsurance(false)} disabled={!isInsurance} variant="danger" />
        </div>

        {/* Row 1: Primary action buttons */}
        <div className="flex gap-1 md:gap-2">
          <ActionButton label="Stand" onClick={onStand} disabled={!isPlaying} variant="secondary" />
          <ActionButton label="Hit" onClick={onHit} disabled={!isPlaying} variant="primary" />
          <ActionButton label="Double" onClick={onDouble} disabled={!isPlaying || !canDouble} variant="primary" />
        </div>

        {/* Deal / Clear / Surrender buttons */}
        <div className="flex gap-1 md:gap-2">
          {isBetting ? (
            <>
              <ActionButton
                label="Clear"
                onClick={onClearBet}
                disabled={currentBet === 0}
                variant="danger"
                size="normal"
              />
              <ActionButton label="Deal" onClick={onDeal} disabled={!canDeal} variant="primary" size="large" />
            </>
          ) : isRoundEnd ? (
            <ActionButton label="New Round" onClick={onNewRound} variant="primary" size="large" />
          ) : isPlaying && canSurrender ? (
            <>
              <ActionButton label="Surr" onClick={onSurrender} disabled={false} variant="warning" size="normal" />
              <ActionButton label="Deal" onClick={() => {}} disabled={true} variant="primary" size="large" />
            </>
          ) : (
            <>
              <ActionButton label="Clear" onClick={() => {}} disabled={true} variant="danger" size="normal" />
              <ActionButton label="Deal" onClick={() => {}} disabled={true} variant="primary" size="large" />
            </>
          )}
        </div>
      </div>
    </>
  )
}
