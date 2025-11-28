import type { GameSettings } from "./types"
import type { CasinoRules } from "./casinos"

export interface TableSeat {
  seatNumber: number
  isOccupied: boolean
  npcName?: string
  npcStyle?: string
}

export interface TableConfig {
  id: string
  name: string
  description: string
  tableSize: number
  seats: TableSeat[]
  occupancy: "empty" | "quiet" | "moderate" | "busy" | "packed"
  playSpeed: GameSettings["playSpeed"]
  vibe: string
  isHighRoller?: boolean
  isPrivate?: boolean
}

// NPC name pools by style
const npcProfiles = [
  { name: "Big Tony", style: "Aggressive bettor, plays fast" },
  { name: "Linda M.", style: "Cautious player, takes her time" },
  { name: "Smooth Eddie", style: "Experienced, follows basic strategy" },
  { name: "Lucky Lou", style: "Superstitious, bets on hunches" },
  { name: "The Professor", style: "Card counter, very methodical" },
  { name: "Margarita Mike", style: "Casual tourist, here for fun" },
  { name: "Silent Sam", style: "Quiet pro, rarely speaks" },
  { name: "Chatty Cathy", style: "Friendly, talks to everyone" },
  { name: "High Roller Rick", style: "Big bets, doesn't flinch" },
  { name: "Nervous Nancy", style: "New player, asks for advice" },
  { name: "Old Timer Joe", style: "Veteran, seen it all" },
  { name: "Young Gun", style: "Aggressive millennial, phone in hand" },
  { name: "The Whale", style: "VIP player, casino host nearby" },
  { name: "Dealer's Friend", style: "Regular, knows all the staff" },
  { name: "System Sally", style: "Has a 'system', very confident" },
]

function getRandomNPC(): { name: string; style: string } {
  return npcProfiles[Math.floor(Math.random() * npcProfiles.length)]
}

export function generateTablesForCasino(casino: CasinoRules): TableConfig[] {
  const tables: TableConfig[] = []
  const availableSizes = casino.tableSizes
  const typicalSize = casino.typicalTableSize
  const isHighEnd = casino.minBet >= 50

  // 1. Private/Training Table (1 seat) - available at high-end casinos
  if (isHighEnd) {
    tables.push({
      id: "private-training",
      name: "Private Table",
      description: `Reserved high-roller table at ${casino.name}. Just you and the dealer for focused practice.`,
      tableSize: 1,
      seats: [{ seatNumber: 1, isOccupied: false }],
      occupancy: "empty",
      playSpeed: "slow",
      vibe: `Exclusive salon area, velvet ropes, personal dealer at ${casino.name}`,
      isHighRoller: true,
      isPrivate: true,
    })
  }

  // 2. Empty tables for each available size
  availableSizes.forEach((size) => {
    tables.push({
      id: `empty-${size}seat`,
      name: size === typicalSize ? "Empty Table (Standard)" : `Empty ${size}-Seat Table`,
      description: `Fresh ${size}-seat table just opened. Perfect for one-on-one practice with the dealer.`,
      tableSize: size,
      seats: Array.from({ length: size }, (_, i) => ({ seatNumber: i + 1, isOccupied: false })),
      occupancy: "empty",
      playSpeed: "normal",
      vibe: "Quiet section, dealer waiting patiently",
    })
  })

  // 3. Quiet tables (1-2 players) using typical size
  tables.push({
    id: "quiet-third-base",
    name: "Quiet Table - Third Base Open",
    description: `One player at first base (left). Third base (seat ${typicalSize}, right) gives you last action before dealer.`,
    tableSize: typicalSize,
    seats: [
      { seatNumber: 1, isOccupied: true, ...getRandomNPC() },
      ...Array.from({ length: typicalSize - 1 }, (_, i) => ({ seatNumber: i + 2, isOccupied: false })),
    ],
    occupancy: "quiet",
    playSpeed: "normal",
    vibe: "Relaxed atmosphere, easy to focus",
  })

  tables.push({
    id: "quiet-first-base",
    name: "Quiet Table - First Base Open",
    description: `One player at third base (right). First base (seat 1, left) means you're dealt first and act first each round.`,
    tableSize: typicalSize,
    seats: [
      ...Array.from({ length: typicalSize - 1 }, (_, i) => ({ seatNumber: i + 1, isOccupied: false })),
      { seatNumber: typicalSize, isOccupied: true, ...getRandomNPC() },
    ],
    occupancy: "quiet",
    playSpeed: "normal",
    vibe: "Steady game, experienced player at the end",
  })

  // 4. Moderate tables (3-4 players)
  const moderateOccupied = Math.min(3, typicalSize - 2)
  const moderateSeats: TableSeat[] = Array.from({ length: typicalSize }, (_, i) => {
    const seatNum = i + 1
    // Spread players: first, middle, last
    const shouldOccupy = seatNum === 1 || seatNum === Math.ceil(typicalSize / 2) || seatNum === typicalSize
    return {
      seatNumber: seatNum,
      isOccupied: shouldOccupy && moderateOccupied > 0,
      ...(shouldOccupy ? getRandomNPC() : {}),
    }
  })

  tables.push({
    id: "moderate-afternoon",
    name: "Afternoon Table",
    description: `Three players with middle seats open. Good balance of action and think time.`,
    tableSize: typicalSize,
    seats: moderateSeats,
    occupancy: "moderate",
    playSpeed: "normal",
    vibe: "Steady crowd, cocktail waitress making rounds",
  })

  // Happy hour table with 4 players
  const happyHourSize = availableSizes.includes(6) ? 6 : typicalSize
  tables.push({
    id: "moderate-happy-hour",
    name: "Happy Hour Table",
    description: `Four players, one spot in the middle. Friendly group, drinks flowing.`,
    tableSize: happyHourSize,
    seats: [
      { seatNumber: 1, isOccupied: true, ...getRandomNPC() },
      { seatNumber: 2, isOccupied: true, ...getRandomNPC() },
      { seatNumber: 3, isOccupied: false },
      { seatNumber: 4, isOccupied: true, ...getRandomNPC() },
      { seatNumber: 5, isOccupied: false },
      { seatNumber: 6, isOccupied: true, ...getRandomNPC() },
    ].slice(0, happyHourSize),
    occupancy: "moderate",
    playSpeed: "normal",
    vibe: "Lively conversation, good energy at the table",
  })

  // 5. Busy tables (5-6 players)
  tables.push({
    id: "busy-friday",
    name: "Friday Night Table",
    description: `Five players, two spots left. Fast action, need to keep up.`,
    tableSize: typicalSize,
    seats: Array.from({ length: typicalSize }, (_, i) => {
      const seatNum = i + 1
      // Leave seats 3 and 6 open (or last-1)
      const isOpen = seatNum === 3 || seatNum === typicalSize - 1
      return {
        seatNumber: seatNum,
        isOccupied: !isOpen,
        ...(!isOpen ? getRandomNPC() : {}),
      }
    }),
    occupancy: "busy",
    playSpeed: "fast",
    vibe: "Crowded pit, cheering at nearby craps table",
  })

  tables.push({
    id: "busy-hot-streak",
    name: "Hot Streak Table",
    description: `Six players on a hot streak. One seat at third base. High energy!`,
    tableSize: typicalSize,
    seats: Array.from({ length: typicalSize }, (_, i) => {
      const seatNum = i + 1
      // Only last seat open
      return {
        seatNumber: seatNum,
        isOccupied: seatNum !== typicalSize,
        ...(seatNum !== typicalSize ? getRandomNPC() : {}),
      }
    }),
    occupancy: "busy",
    playSpeed: "fast",
    vibe: "Everyone winning, chips stacking up, crowd gathering",
  })

  // 6. Packed tables (last seat available)
  tables.push({
    id: "packed-saturday",
    name: "Saturday Night Madness",
    description: `${typicalSize - 1} players, ONE seat left in the middle. Squeeze in if you dare!`,
    tableSize: typicalSize,
    seats: Array.from({ length: typicalSize }, (_, i) => {
      const seatNum = i + 1
      // Only middle seat open
      const middleSeat = Math.ceil(typicalSize / 2)
      return {
        seatNumber: seatNum,
        isOccupied: seatNum !== middleSeat,
        ...(seatNum !== middleSeat ? getRandomNPC() : {}),
      }
    }),
    occupancy: "packed",
    playSpeed: "fast",
    vibe: "Packed house, standing room only behind the table",
  })

  // VIP packed table for high-end casinos
  if (isHighEnd) {
    const vipSize = availableSizes.includes(6) ? 6 : typicalSize
    tables.push({
      id: "packed-vip",
      name: "VIP Full Table",
      description: `High-limit table with ${vipSize - 1} whales. Last seat available. Big money on the felt.`,
      tableSize: vipSize,
      seats: [
        { seatNumber: 1, isOccupied: true, npcName: "The Whale", npcStyle: "VIP, $10K bets like nothing" },
        { seatNumber: 2, isOccupied: true, npcName: "High Roller Rick", npcStyle: "Aggressive, big stacks" },
        { seatNumber: 3, isOccupied: true, npcName: "Silent Sam", npcStyle: "Quiet pro, counting" },
        { seatNumber: 4, isOccupied: false },
        { seatNumber: 5, isOccupied: true, npcName: "The Professor", npcStyle: "Card counter, methodical" },
        { seatNumber: 6, isOccupied: true, npcName: "Casino Host's Friend", npcStyle: "VIP treatment" },
      ].slice(0, vipSize),
      occupancy: "packed",
      playSpeed: "normal",
      vibe: `High-limit salon at ${casino.name}, casino host hovering, serious money`,
      isHighRoller: true,
    })
  }

  // 7. Graveyard shift for budget casinos
  if (casino.minBet <= 25) {
    tables.push({
      id: "busy-graveyard",
      name: "Graveyard Shift Grinders",
      description: `Five serious players, late night. First base open. Pros at work.`,
      tableSize: typicalSize,
      seats: Array.from({ length: typicalSize }, (_, i) => {
        const seatNum = i + 1
        return {
          seatNumber: seatNum,
          isOccupied: seatNum !== 1,
          ...(seatNum !== 1 ? getRandomNPC() : {}),
        }
      }),
      occupancy: "busy",
      playSpeed: "fast",
      vibe: "Quiet intensity, everyone focused, minimal chatter",
    })
  }

  return tables
}

// Function to get available seats for a table config
export function getAvailableSeats(table: TableConfig): number[] {
  return table.seats.filter((s) => !s.isOccupied).map((s) => s.seatNumber)
}

// Function to get occupancy color
export function getOccupancyColor(occupancy: TableConfig["occupancy"]): string {
  switch (occupancy) {
    case "empty":
      return "text-green-400 bg-green-900/30 border-green-600/30"
    case "quiet":
      return "text-blue-400 bg-blue-900/30 border-blue-600/30"
    case "moderate":
      return "text-amber-400 bg-amber-900/30 border-amber-600/30"
    case "busy":
      return "text-orange-400 bg-orange-900/30 border-orange-600/30"
    case "packed":
      return "text-red-400 bg-red-900/30 border-red-600/30"
  }
}

// Function to get occupancy label
export function getOccupancyLabel(occupancy: TableConfig["occupancy"]): string {
  switch (occupancy) {
    case "empty":
      return "Empty - Perfect for Training"
    case "quiet":
      return "Quiet - 1-2 Players"
    case "moderate":
      return "Moderate - 3-4 Players"
    case "busy":
      return "Busy - 5-6 Players"
    case "packed":
      return "Packed - Last Seat!"
  }
}
