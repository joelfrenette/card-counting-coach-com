"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChipSelectorProps {
  onSelectChip: (amount: number) => void
  minBet: number
  maxBet: number
  bankroll: number
}

const chipValues = [
  { value: 5, color: "bg-red-600", label: "$5" },
  { value: 25, color: "bg-green-600", label: "$25" },
  { value: 100, color: "bg-black", label: "$100" },
  { value: 500, color: "bg-blue-600", label: "$500" },
]

export function ChipSelector({ onSelectChip, minBet, maxBet, bankroll }: ChipSelectorProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {chipValues.map((chip) => (
        <Button
          key={chip.value}
          onClick={() => onSelectChip(chip.value)}
          disabled={chip.value > bankroll || chip.value < minBet}
          className={cn(
            "w-16 h-16 rounded-full border-4 border-white/20",
            "font-bold text-white shadow-lg",
            "hover:scale-110 transition-transform",
            "disabled:opacity-30 disabled:scale-100",
            chip.color,
          )}
        >
          {chip.label}
        </Button>
      ))}
    </div>
  )
}
