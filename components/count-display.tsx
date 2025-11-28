import { Card } from "@/components/ui/card"
import { countingSystems } from "@/lib/card-counting"
import type { CountingSystem } from "@/lib/types"

interface CountDisplayProps {
  runningCount: number
  trueCount: number
  decksRemaining: number
  system: CountingSystem
  visible: boolean
}

export function CountDisplay({ runningCount, trueCount, decksRemaining, system, visible }: CountDisplayProps) {
  const systemConfig = countingSystems[system]

  if (!visible) return null

  return (
    <Card className="p-4 bg-card/90 backdrop-blur">
      <div className="space-y-2">
        <div className="text-sm font-semibold text-muted-foreground">{systemConfig.name} Count</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Running Count</div>
            <div className="text-2xl font-bold text-primary">
              {runningCount > 0 ? "+" : ""}
              {runningCount}
            </div>
          </div>
          {systemConfig.needsTrueCount && (
            <div>
              <div className="text-xs text-muted-foreground">True Count</div>
              <div className="text-2xl font-bold text-secondary">
                {trueCount > 0 ? "+" : ""}
                {trueCount}
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t border-border">
          {decksRemaining.toFixed(1)} decks remaining
        </div>
      </div>
    </Card>
  )
}
