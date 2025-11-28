"use client"

import { useState, useMemo } from "react"
import { generateTablesForCasino, getAvailableSeats, type TableConfig } from "@/lib/tables"
import type { CasinoRules } from "@/lib/casinos"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Users, Armchair, Clock } from "lucide-react"
import type { GameSettings } from "@/lib/gameSettings" // Import GameSettings

export interface TableSelection {
  tableConfig: TableConfig
  playerSeat: number
  playSpeed: GameSettings["playSpeed"]
}

interface TableSelectorProps {
  casino: CasinoRules
  onSelect: (selection: TableSelection) => void
  onBack: () => void
}

export function TableSelector({ casino, onSelect, onBack }: TableSelectorProps) {
  const [selectedTable, setSelectedTable] = useState<TableConfig | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null)

  const tableConfigs = useMemo(() => generateTablesForCasino(casino), [casino])

  const sortedTables = useMemo(() => {
    const occupancyOrder = { empty: 0, quiet: 1, moderate: 2, busy: 3, packed: 4 }
    return [...tableConfigs].sort((a, b) => occupancyOrder[a.occupancy] - occupancyOrder[b.occupancy])
  }, [tableConfigs])

  const handleTableSelect = (table: TableConfig) => {
    setSelectedTable(table)
    const availableSeats = getAvailableSeats(table)
    setSelectedSeat(availableSeats[0] || null)
  }

  const handleConfirmSeat = () => {
    if (selectedTable && selectedSeat) {
      onSelect({
        tableConfig: selectedTable,
        playerSeat: selectedSeat,
        playSpeed: selectedTable.playSpeed,
      })
    }
  }

  // Seat selection view
  if (selectedTable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative mb-8">
            <Button
              variant="ghost"
              onClick={() => setSelectedTable(null)}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Tables
            </Button>

            <div className="text-center">
              <h1 className="mb-2 font-serif text-3xl font-bold text-emerald-400 md:text-4xl">{selectedTable.name}</h1>
              <p className="text-balance text-lg text-slate-300">
                {selectedTable.description} <span className="text-amber-400">at {casino.name}</span>
              </p>
            </div>
          </div>

          {/* Visual Table Representation */}
          <div className="mb-8 rounded-2xl bg-emerald-950/50 p-6 md:p-8">
            <div className="mx-auto mb-2 flex flex-col items-center">
              {/* Dealer figure */}
              <div className="relative flex flex-col items-center">
                {/* Dealer head */}

                {/* Dealer body */}
                <div className="h-10 w-14 -mt-1 rounded-t-md bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-t-0 border-slate-600 flex items-start justify-center pt-1 relative">
                  <span className="text-[8px] font-bold text-emerald-300 mt-2">DEALER</span>
                </div>
              </div>
            </div>

            <div className="relative mx-auto" style={{ maxWidth: "550px" }}>
              <svg viewBox="0 0 550 220" className="w-full h-auto">
                {/* Outer table rail - deeper curve */}
                <path
                  d="M 30 30 
                     Q 275 -10, 520 30
                     Q 555 70, 540 140
                     Q 510 200, 275 220
                     Q 40 200, 10 140
                     Q -5 70, 30 30"
                  fill="#1a3a2a"
                  stroke="#3d7a5a"
                  strokeWidth="5"
                />
                {/* Inner felt - deeper curve */}
                <path
                  d="M 50 45 
                     Q 275 10, 500 45
                     Q 530 75, 515 130
                     Q 490 180, 275 198
                     Q 60 180, 35 130
                     Q 20 75, 50 45"
                  fill="#1e4d38"
                  stroke="#2d5a42"
                  strokeWidth="2"
                />
                {selectedTable.seats
                  .sort((a, b) => b.seatNumber - a.seatNumber)
                  .map((seat, index) => {
                    const totalSeats = selectedTable.tableSize
                    const angle = (Math.PI * (index + 0.5)) / totalSeats
                    const cx = 275 - Math.cos(angle) * 180
                    const cy = 90 + Math.sin(angle) * 35
                    const isSelected = selectedSeat === seat.seatNumber

                    return (
                      <ellipse
                        key={seat.seatNumber}
                        cx={cx}
                        cy={cy}
                        rx="20"
                        ry="16"
                        fill={isSelected ? "rgba(251, 191, 36, 0.3)" : "rgba(16, 185, 129, 0.15)"}
                        stroke={isSelected ? "#fbbf24" : "#3d7a5a"}
                        strokeWidth="2"
                      />
                    )
                  })}
              </svg>

              <div className="relative -mt-2" style={{ height: "70px" }}>
                {selectedTable.seats
                  .sort((a, b) => b.seatNumber - a.seatNumber)
                  .map((seat, index) => {
                    const totalSeats = selectedTable.tableSize
                    // Arc the seats along the outside curve
                    const angle = (Math.PI * (index + 0.5)) / totalSeats
                    // Calculate position along an arc below the table
                    const centerX = 50 // percent
                    const left = centerX - Math.cos(angle) * 42
                    const top = Math.sin(angle) * 25

                    const isAvailable = !seat.isOccupied
                    const isSelected = selectedSeat === seat.seatNumber

                    return (
                      <button
                        key={seat.seatNumber}
                        onClick={() => isAvailable && setSelectedSeat(seat.seatNumber)}
                        disabled={!isAvailable}
                        style={{
                          position: "absolute",
                          left: `${left}%`,
                          top: `${top}px`,
                          transform: "translateX(-50%)",
                        }}
                        className={`
                          flex h-14 w-12 md:h-16 md:w-14 flex-col items-center justify-center rounded-lg border-2 transition-all
                          ${
                            isAvailable
                              ? isSelected
                                ? "border-amber-400 bg-amber-500/30 ring-2 ring-amber-400 ring-offset-1 ring-offset-emerald-950"
                                : "border-emerald-500/70 bg-emerald-800/60 hover:border-amber-400 hover:bg-emerald-700/60 cursor-pointer"
                              : "border-slate-600/50 bg-slate-800/60 cursor-not-allowed"
                          }
                        `}
                      >
                        {seat.isOccupied ? (
                          <>
                            <Users className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                            <span className="mt-0.5 text-[7px] md:text-[8px] text-slate-400 text-center leading-tight truncate w-full px-0.5">
                              {seat.npcName || `NPC`}
                            </span>
                          </>
                        ) : (
                          <>
                            <Armchair
                              className={`h-4 w-4 md:h-5 md:w-5 ${isSelected ? "text-amber-400" : "text-emerald-300"}`}
                            />
                            <span
                              className={`mt-0.5 text-[10px] md:text-xs font-semibold ${isSelected ? "text-amber-400" : "text-emerald-200"}`}
                            >
                              {seat.seatNumber}
                            </span>
                          </>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Position labels */}
            <div className="flex justify-between px-12 mt-2 text-[10px] md:text-xs text-slate-500">
              <span>3rd Base</span>
              <span>1st Base</span>
            </div>

            <div className="mt-4 text-center text-xs text-slate-400 italic">
              From your seat facing the dealer: Seat 1 (First Base) is on the right, Seat {selectedTable.tableSize}{" "}
              (Third Base) is on the left. Dealer deals right→left.
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {selectedSeat && (
              <div className="text-center">
                <p className="text-lg text-slate-300">
                  You selected <span className="font-bold text-amber-400">Seat {selectedSeat}</span>
                  {selectedSeat === 1 && " (First Base - First to be dealt, first to act)"}
                  {selectedSeat === selectedTable.tableSize && " (Third Base/Anchor - Last to act before dealer)"}
                </p>
              </div>
            )}

            <Button
              onClick={handleConfirmSeat}
              disabled={!selectedSeat}
              size="lg"
              className="bg-emerald-600 px-12 text-lg font-semibold text-white hover:bg-emerald-500"
            >
              Take Your Seat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Table list view
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Characters
          </Button>

          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold italic text-amber-400 md:text-4xl">Choose Your Table</h1>
            <p className="mt-2 text-slate-400">
              Find the perfect spot at <span className="text-cyan-400">{casino.name}</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">{casino.tableInfo}</p>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedTables.map((table) => {
            const availableSeats = getAvailableSeats(table)
            const occupiedCount = table.seats.filter((s) => s.isOccupied).length

            return (
              <Card
                key={table.id}
                className="cursor-pointer border-slate-700 bg-slate-900/80 backdrop-blur-sm transition-all hover:border-emerald-500/50 hover:bg-slate-900"
                onClick={() => handleTableSelect(table)}
              >
                <CardHeader>
                  <div className="mb-2 flex items-start justify-between">
                    <CardTitle className="text-xl text-emerald-400">{table.name}</CardTitle>
                    {table.isHighRoller && <Users className="h-5 w-5 text-amber-400" />}
                  </div>
                  <CardDescription className="text-slate-400">{table.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col items-center rounded-lg bg-slate-800/50 p-2">
                      <Users className="mb-1 h-4 w-4 text-emerald-400" />
                      <div className="text-xs text-slate-400">Seats</div>
                      <div className="font-semibold text-slate-100">
                        {occupiedCount}/{table.tableSize}
                      </div>
                    </div>

                    <div className="flex flex-col items-center rounded-lg bg-slate-800/50 p-2">
                      <Armchair className="mb-1 h-4 w-4 text-amber-400" />
                      <div className="text-xs text-slate-400">Open</div>
                      <div className="font-semibold text-slate-100">{availableSeats.length}</div>
                    </div>

                    <div className="flex flex-col items-center rounded-lg bg-slate-800/50 p-2">
                      <Clock className="mb-1 h-4 w-4 text-blue-400" />
                      <div className="text-xs text-slate-400">Speed</div>
                      <div className="font-semibold capitalize text-slate-100">{table.playSpeed}</div>
                    </div>
                  </div>

                  <p className="text-xs italic text-slate-500">"{table.vibe}"</p>

                  <div className="flex justify-center gap-1">
                    {table.seats.map((seat) => (
                      <div
                        key={seat.seatNumber}
                        className={`h-3 w-3 rounded-full ${seat.isOccupied ? "bg-slate-600" : "bg-emerald-500"}`}
                        title={
                          seat.isOccupied
                            ? `Seat ${seat.seatNumber}: ${seat.npcName}`
                            : `Seat ${seat.seatNumber}: Available`
                        }
                      />
                    ))}
                  </div>

                  <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-500">View Table</Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
