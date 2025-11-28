"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface ActionButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "warning" | "danger"
  size?: "normal" | "large"
}

export function ActionButton({ label, onClick, disabled, variant = "primary", size = "normal" }: ActionButtonProps) {
  const baseClasses = cn(
    "flex items-center justify-center font-bold uppercase tracking-wide transition-all duration-150",
    "active:scale-95 select-none touch-manipulation",
    size === "normal"
      ? "w-[52px] h-[52px] md:w-[72px] md:h-[72px] text-[10px] md:text-xs rounded-lg md:rounded-xl"
      : "w-[110px] h-[52px] md:w-[156px] md:h-[72px] text-xs md:text-sm rounded-lg md:rounded-xl",
    disabled
      ? "opacity-30 cursor-not-allowed bg-slate-800 text-slate-500"
      : cn(
          variant === "primary" &&
            "bg-gradient-to-b from-cyan-500 to-cyan-600 text-slate-900 neon-glow-cyan hover:from-cyan-400 hover:to-cyan-500",
          variant === "secondary" &&
            "bg-gradient-to-b from-amber-500 to-amber-600 text-slate-900 neon-glow-gold hover:from-amber-400 hover:to-amber-500",
          variant === "warning" &&
            "bg-gradient-to-b from-purple-500 to-purple-600 text-white neon-glow-purple hover:from-purple-400 hover:to-purple-500",
          variant === "danger" &&
            "bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500",
        ),
  )

  return (
    <button className={baseClasses} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  )
}

interface ChipButtonProps {
  value: number
  onClick: () => void
  disabled?: boolean
  selected?: boolean
}

export function ChipButton({ value, onClick, disabled, selected }: ChipButtonProps) {
  const chipColors: Record<number, string> = {
    5: "from-red-600 to-red-700 border-red-400",
    25: "from-green-600 to-green-700 border-green-400",
    100: "from-slate-800 to-slate-900 border-slate-500",
    500: "from-purple-600 to-purple-700 border-purple-400",
    1000: "from-amber-500 to-amber-600 border-amber-300",
    5000: "from-pink-600 to-pink-700 border-pink-400",
    10000: "from-cyan-600 to-cyan-700 border-cyan-400",
    25000: "from-emerald-600 to-emerald-700 border-emerald-400",
    100000: "from-rose-600 to-rose-700 border-rose-400",
  }

  const formatValue = (v: number) => {
    if (v >= 1000000) return `$${v / 1000000}M`
    if (v >= 1000) return `$${v / 1000}K`
    return `$${v}`
  }

  return (
    <button
      className={cn(
        "w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center font-bold text-white text-[10px] md:text-xs",
        "border-[3px] md:border-4 border-dashed transition-all duration-150 select-none touch-manipulation",
        "bg-gradient-to-b shadow-lg",
        chipColors[value] || "from-slate-600 to-slate-700 border-slate-400",
        disabled ? "opacity-30 cursor-not-allowed" : "hover:scale-110 active:scale-95",
        selected && "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900",
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {formatValue(value)}
    </button>
  )
}

interface ToggleSwitchProps {
  label: string
  icon?: React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleSwitch({ label, icon, checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      className="flex items-center gap-2 md:gap-3 w-full py-1.5 md:py-2 px-2 md:px-3 rounded-lg hover:bg-slate-700/50 transition-colors"
      onClick={() => onChange(!checked)}
    >
      {icon && <span className="text-slate-400 w-4 md:w-5">{icon}</span>}
      <span className="flex-1 text-left text-xs md:text-sm text-slate-300">{label}</span>
      <div
        className={cn(
          "w-9 md:w-10 h-5 md:h-6 rounded-full transition-colors relative",
          checked ? "bg-cyan-500" : "bg-slate-600",
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 md:top-1 w-4 h-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4 md:translate-x-5" : "translate-x-0.5 md:translate-x-1",
          )}
        />
      </div>
    </button>
  )
}

interface SpeedSelectorProps {
  speed: "slow" | "normal" | "fast"
  onChange: (speed: "slow" | "normal" | "fast") => void
}

export function SpeedSelector({ speed, onChange }: SpeedSelectorProps) {
  const speeds: Array<"slow" | "normal" | "fast"> = ["slow", "normal", "fast"]

  return (
    <div className="flex items-center gap-1 md:gap-2 py-1.5 md:py-2 px-2 md:px-3">
      <span className="text-xs md:text-sm text-slate-400 w-12 md:w-16">Speed</span>
      <div className="flex-1 flex gap-1">
        {speeds.map((s) => (
          <button
            key={s}
            className={cn(
              "flex-1 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded transition-colors capitalize",
              speed === s ? "bg-cyan-500 text-slate-900" : "bg-slate-700 text-slate-300 hover:bg-slate-600",
            )}
            onClick={() => onChange(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

interface SpeechSpeedSliderProps {
  speed: number
  onChange: (speed: number) => void
}

export function SpeechSpeedSlider({ speed, onChange }: SpeechSpeedSliderProps) {
  const speeds = [1, 1.25, 1.5, 1.75, 2]

  return (
    <div className="py-1.5 md:py-2 px-2 md:px-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs md:text-sm text-slate-400">Speech Speed</span>
        <span className="text-xs md:text-sm font-medium text-cyan-400">{speed}x</span>
      </div>
      <div className="flex gap-1">
        {speeds.map((s) => (
          <button
            key={s}
            className={cn(
              "flex-1 py-1 md:py-1.5 text-[10px] md:text-xs font-medium rounded transition-colors",
              speed === s ? "bg-cyan-500 text-slate-900" : "bg-slate-700 text-slate-300 hover:bg-slate-600",
            )}
            onClick={() => onChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}
