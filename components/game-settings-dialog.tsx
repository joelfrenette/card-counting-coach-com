"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GameSettings, BettingStyle } from "@/lib/types"
import { countingSystems } from "@/lib/card-counting"
import { bettingStyles } from "@/lib/betting-styles"

interface GameSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: GameSettings
  onSettingsChange: (settings: GameSettings) => void
}

export function GameSettingsDialog({ open, onOpenChange, settings, onSettingsChange }: GameSettingsDialogProps) {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>Customize your blackjack training experience</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="counting">Counting</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Decks</Label>
                <Select
                  value={settings.numberOfDecks.toString()}
                  onValueChange={(v) => updateSetting("numberOfDecks", Number.parseInt(v) as 1 | 2 | 6 | 8)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Deck (Single Deck)</SelectItem>
                    <SelectItem value="2">2 Deck (Double Deck)</SelectItem>
                    <SelectItem value="6">6 Deck Shoe (Casino Standard)</SelectItem>
                    <SelectItem value="8">8 Deck Shoe (Atlantic City)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Penetration</Label>
                <Input
                  type="number"
                  value={settings.penetrationPercent}
                  onChange={(e) => updateSetting("penetrationPercent", Number.parseInt(e.target.value))}
                  min="50"
                  max="90"
                />
                <p className="text-xs text-muted-foreground">% of shoe dealt before reshuffle</p>
              </div>

              <div className="space-y-2">
                <Label>Min Bet ($)</Label>
                <Input
                  type="number"
                  value={settings.minBet}
                  onChange={(e) => updateSetting("minBet", Number.parseInt(e.target.value))}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Bet ($)</Label>
                <Input
                  type="number"
                  value={settings.maxBet}
                  onChange={(e) => updateSetting("maxBet", Number.parseInt(e.target.value))}
                  min={settings.minBet}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Starting Bankroll ($)</Label>
                <Input
                  type="number"
                  value={settings.bankroll}
                  onChange={(e) => updateSetting("bankroll", Number.parseInt(e.target.value))}
                  min="100"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Betting Style</Label>
                <Select
                  value={settings.bettingStyle}
                  onValueChange={(v: BettingStyle) => updateSetting("bettingStyle", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(bettingStyles).map(([key, style]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col items-start py-1">
                          <div className="font-semibold">{style.name}</div>
                          <div className="text-xs text-muted-foreground">{style.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Risk: {style.riskLevel.toUpperCase()}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="counting" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Card Counting System</Label>
                <Select value={settings.countingSystem} onValueChange={(v: any) => updateSetting("countingSystem", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(countingSystems).map(([key, system]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex flex-col items-start py-1">
                          <div className="font-semibold">{system.name}</div>
                          <div className="text-xs text-muted-foreground">{system.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Level {system.level} • {system.needsTrueCount ? "Requires True Count" : "Unbalanced"}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">System Details:</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Name:</strong> {countingSystems[settings.countingSystem].name}
                  </p>
                  <p>
                    <strong>Level:</strong> {countingSystems[settings.countingSystem].level}
                  </p>
                  <p>
                    <strong>True Count Needed:</strong>{" "}
                    {countingSystems[settings.countingSystem].needsTrueCount ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Ace Side Count:</strong>{" "}
                    {countingSystems[settings.countingSystem].needsAceSideCount ? "Yes" : "No"}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold mb-2">Card Values:</p>
                  <div className="grid grid-cols-13 gap-1 text-xs">
                    {Object.entries(countingSystems[settings.countingSystem].values).map(([rank, value]) => (
                      <div key={rank} className="text-center">
                        <div className="font-semibold">{rank}</div>
                        <div
                          className={
                            value > 0 ? "text-primary" : value < 0 ? "text-destructive" : "text-muted-foreground"
                          }
                        >
                          {value > 0 ? "+" : ""}
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="learning" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Show Player Statistics</Label>
                  <p className="text-xs text-muted-foreground">Display session stats (hands played, win rate, P/L)</p>
                </div>
                <Switch
                  checked={settings.showPlayerStats}
                  onCheckedChange={(checked) => updateSetting("showPlayerStats", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Show Running/True Count</Label>
                  <p className="text-xs text-muted-foreground">Display the current count on screen</p>
                </div>
                <Switch
                  checked={settings.showCount}
                  onCheckedChange={(checked) => updateSetting("showCount", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Show Dealer's Down Card</Label>
                  <p className="text-xs text-muted-foreground">Reveal hole card for practice (cheating mode)</p>
                </div>
                <Switch
                  checked={settings.showDownCards}
                  onCheckedChange={(checked) => updateSetting("showDownCards", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Show Coaching Tips</Label>
                  <p className="text-xs text-muted-foreground">Display basic strategy recommendations</p>
                </div>
                <Switch
                  checked={settings.showCoaching}
                  onCheckedChange={(checked) => updateSetting("showCoaching", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Show Index Play Deviations</Label>
                  <p className="text-xs text-muted-foreground">
                    Display Illustrious 18 & Fab 4 deviations from basic strategy
                  </p>
                </div>
                <Switch
                  checked={settings.showIndexPlays}
                  onCheckedChange={(checked) => updateSetting("showIndexPlays", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Show Probability Analysis</Label>
                  <p className="text-xs text-muted-foreground">Display odds and win probabilities</p>
                </div>
                <Switch checked={settings.showOdds} onCheckedChange={(checked) => updateSetting("showOdds", checked)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Dealer Hits Soft 17</Label>
                  <p className="text-xs text-muted-foreground">Dealer must hit on soft 17 (worse for player)</p>
                </div>
                <Switch
                  checked={settings.dealerHitsSoft17}
                  onCheckedChange={(checked) => updateSetting("dealerHitsSoft17", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Allow Splitting Pairs</Label>
                  <p className="text-xs text-muted-foreground">Enable splitting identical cards</p>
                </div>
                <Switch
                  checked={settings.allowSplit}
                  onCheckedChange={(checked) => updateSetting("allowSplit", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Allow Double Down</Label>
                  <p className="text-xs text-muted-foreground">Enable doubling down on any two cards</p>
                </div>
                <Switch
                  checked={settings.allowDouble}
                  onCheckedChange={(checked) => updateSetting("allowDouble", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label>Double After Split</Label>
                  <p className="text-xs text-muted-foreground">Allow doubling down after splitting</p>
                </div>
                <Switch
                  checked={settings.allowDoubleAfterSplit}
                  onCheckedChange={(checked) => updateSetting("allowDoubleAfterSplit", checked)}
                  disabled={!settings.allowSplit || !settings.allowDouble}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
