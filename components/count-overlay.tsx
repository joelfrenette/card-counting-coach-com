"use client"

import { cn } from "@/lib/utils"

interface CountOverlayProps {
  runningCount: number
  trueCount: number
  decksRemaining: number
  system: string
  visible: boolean
  betSuggestion?: string
  strategySuggestion?: string
  insuranceSuggestion?: "take" | "decline"
  showInsurancePrompt?: boolean
}

export function CountOverlay({
  runningCount,
  trueCount,
  decksRemaining,
  system,
  visible,
  betSuggestion,
  strategySuggestion,
  insuranceSuggestion,
  showInsurancePrompt,
}: CountOverlayProps) {
  if (!visible) return null

  return (
    <div className="fixed top-12 md:top-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 md:gap-2 w-[calc(100%-1rem)] md:w-auto max-w-full">
      {/* Count display */}
      <div className="glass-panel rounded-lg md:rounded-xl px-3 py-2 md:px-6 md:py-3 flex items-center gap-3 md:gap-6 overflow-x-auto">
        <div className="text-center min-w-[40px] md:min-w-[50px]">
          <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500">Running</div>
          <div
            className={cn(
              "text-lg md:text-2xl font-bold tabular-nums",
              runningCount > 0 ? "text-cyan-400" : runningCount < 0 ? "text-red-400" : "text-slate-300",
            )}
          >
            {runningCount > 0 ? "+" : ""}
            {runningCount}
          </div>
        </div>

        <div className="w-px h-8 md:h-10 bg-slate-700" />

        <div className="text-center min-w-[40px] md:min-w-[50px]">
          <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500">True</div>
          <div
            className={cn(
              "text-lg md:text-2xl font-bold tabular-nums",
              trueCount > 0 ? "text-cyan-400" : trueCount < 0 ? "text-red-400" : "text-slate-300",
            )}
          >
            {trueCount > 0 ? "+" : ""}
            {trueCount.toFixed(1)}
          </div>
        </div>

        <div className="w-px h-8 md:h-10 bg-slate-700" />

        <div className="text-center min-w-[40px] md:min-w-[50px]">
          <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500">Decks</div>
          <div className="text-lg md:text-2xl font-bold tabular-nums text-slate-300">{decksRemaining.toFixed(1)}</div>
        </div>

        <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-purple-400 ml-1 md:ml-2">{system}</div>
      </div>

      {/* Strategy suggestions */}
      {(betSuggestion || strategySuggestion) && (
        <div className="glass-panel rounded-md md:rounded-lg px-2 py-1 md:px-4 md:py-2 flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          {betSuggestion && (
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-slate-500">Bet:</span>
              <span className="text-neon-gold font-medium">{betSuggestion}</span>
            </div>
          )}
          {strategySuggestion && (
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-slate-500">Play:</span>
              <span className="text-cyan-400 font-medium">{strategySuggestion}</span>
            </div>
          )}
        </div>
      )}

      {showInsurancePrompt && (
        <div className="glass-panel rounded-md md:rounded-lg px-2 py-1 md:px-4 md:py-2 flex flex-col items-center gap-0.5 md:gap-1">
          <div className="text-amber-400 font-semibold text-xs md:text-sm">Do you want insurance?</div>
          {insuranceSuggestion && (
            <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <span className="text-slate-500">Suggestion:</span>
              <span
                className={cn(
                  "font-medium uppercase",
                  insuranceSuggestion === "take" ? "text-green-400" : "text-red-400",
                )}
              >
                {insuranceSuggestion === "take" ? "Take Insurance" : "Decline Insurance"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
