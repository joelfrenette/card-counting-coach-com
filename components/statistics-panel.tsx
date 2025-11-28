"use client"
import { TrendingUp, DollarSign, Target } from "lucide-react"

interface StatisticsPanelProps {
  handsPlayed: number
  handsWon: number
  totalWagered: number
  netProfit: number
  biggestWin: number
}

export function StatisticsPanel({ handsPlayed, handsWon, totalWagered, netProfit, biggestWin }: StatisticsPanelProps) {
  const winRate = handsPlayed > 0 ? ((handsWon / handsPlayed) * 100).toFixed(0) : "0"
  const roi = totalWagered > 0 ? ((netProfit / totalWagered) * 100).toFixed(1) : "0.0"

  return (
    <div className="glass-panel rounded-lg md:rounded-xl px-2 py-1 md:px-4 md:py-2 space-y-0.5 md:space-y-1">
      <div className="text-[8px] md:text-[10px] uppercase tracking-wider text-slate-500">Session Stats</div>
      <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
        <div className="flex items-center gap-0.5 md:gap-1">
          <Target className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400" />
          <span className="text-white font-medium">{handsPlayed}</span>
          <span className="text-slate-400 text-[10px] md:text-xs">hands</span>
        </div>
        <div className="flex items-center gap-0.5 md:gap-1">
          <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400" />
          <span className="text-neon-purple font-medium">{winRate}%</span>
          <span className="text-slate-400 text-[10px] md:text-xs">win</span>
        </div>
        <div className="flex items-center gap-0.5 md:gap-1">
          <DollarSign className="h-2.5 w-2.5 md:h-3 md:w-3 text-slate-400" />
          <span className={`font-medium ${netProfit >= 0 ? "text-neon-green" : "text-red-500"}`}>
            {netProfit >= 0 ? "+" : ""}${netProfit}
          </span>
        </div>
      </div>
    </div>
  )
}
