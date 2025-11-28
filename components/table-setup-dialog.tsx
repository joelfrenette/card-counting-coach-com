"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react"
import type { GameSettings } from "@/lib/types"

interface TableSetupDialogProps {
  open: boolean
  onClose: () => void
  onStartGame: (config: {
    playWithNPCs: boolean
    numberOfSeats: number
    playerSeat: number
    playSpeed: GameSettings["playSpeed"]
  }) => void
}

export function TableSetupDialog({ open, onClose, onStartGame }: TableSetupDialogProps) {
  const [playMode, setPlayMode] = useState<"solo" | "multiplayer">("solo")
  const [numberOfSeats, setNumberOfSeats] = useState(3)
  const [playerSeat, setPlayerSeat] = useState(2)
  const [playSpeed, setPlaySpeed] = useState<GameSettings["playSpeed"]>("normal")

  const handleStart = () => {
    onStartGame({
      playWithNPCs: playMode === "multiplayer",
      numberOfSeats: playMode === "multiplayer" ? numberOfSeats : 1,
      playerSeat: playMode === "multiplayer" ? playerSeat : 1,
      playSpeed,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Table Setup</DialogTitle>
          <DialogDescription>Configure your blackjack table experience</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Play Mode */}
          <div className="space-y-3">
            <Label>Play Mode</Label>
            <RadioGroup value={playMode} onValueChange={(v) => setPlayMode(v as "solo" | "multiplayer")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solo" id="solo" />
                <Label htmlFor="solo" className="cursor-pointer font-normal">
                  Heads-Up (Solo vs Dealer)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiplayer" id="multiplayer" />
                <Label htmlFor="multiplayer" className="cursor-pointer font-normal">
                  Full Table (With NPC Players)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Number of Players (only for multiplayer) */}
          {playMode === "multiplayer" && (
            <>
              <div className="space-y-3">
                <Label>Number of Players at Table</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[numberOfSeats]}
                    onValueChange={(v) => {
                      setNumberOfSeats(v[0])
                      if (playerSeat > v[0]) setPlayerSeat(v[0])
                    }}
                    min={2}
                    max={7}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8 text-center">{numberOfSeats}</span>
                </div>
                <p className="text-xs text-muted-foreground">Standard casino tables have 2-7 players</p>
              </div>

              {/* Seat Selection */}
              <div className="space-y-3">
                <Label>Your Seat Position</Label>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: numberOfSeats }, (_, i) => i + 1).map((seat) => (
                    <Button
                      key={seat}
                      variant={playerSeat === seat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlayerSeat(seat)}
                      className="aspect-square p-0"
                    >
                      {seat}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Third base (rightmost) plays last before dealer</p>
              </div>
            </>
          )}

          {/* Play Speed */}
          <div className="space-y-3">
            <Label>Play Speed</Label>
            <RadioGroup value={playSpeed} onValueChange={(v) => setPlaySpeed(v as GameSettings["playSpeed"])}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="slow" id="slow" />
                <Label htmlFor="slow" className="cursor-pointer font-normal">
                  Slow (Better for learning)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="normal" />
                <Label htmlFor="normal" className="cursor-pointer font-normal">
                  Normal
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fast" id="fast" />
                <Label htmlFor="fast" className="cursor-pointer font-normal">
                  Fast (Casino speed)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleStart}>Start Game</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
