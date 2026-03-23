'use client'

type Seat = { id: string; seatNumber: number; isTaken: boolean }

type Props = {
  seats: Seat[]
  partySize: number
  selectedIds: string[]
  onToggle: (id: string) => void
  tableShape: 'rectangle' | 'round'
  accentColor?: string | null
}

export default function SeatingChart({ seats, partySize, selectedIds, onToggle, tableShape, accentColor }: Props) {
  const accent = accentColor ?? '#000000'

  if (tableShape === 'round') {
    const cx = 160
    const cy = 160
    const r = 110
    const total = seats.length

    return (
      <div className="flex flex-col items-center gap-4">
        <svg width={320} height={320} viewBox="0 0 320 320">
          <ellipse cx={cx} cy={cy} rx={80} ry={40} fill="#e5e7eb" />
          {seats.map((seat, i) => {
            const angle = (2 * Math.PI * i) / total - Math.PI / 2
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            const isSelected = selectedIds.includes(seat.id)
            const fill = seat.isTaken ? '#9ca3af' : isSelected ? accent : '#ffffff'
            const stroke = seat.isTaken ? '#9ca3af' : isSelected ? accent : '#d1d5db'
            return (
              <g key={seat.id} onClick={() => !seat.isTaken && onToggle(seat.id)} style={{ cursor: seat.isTaken ? 'default' : 'pointer' }}>
                <circle cx={x} cy={y} r={14} fill={fill} stroke={stroke} strokeWidth={2} />
                <text x={x} y={y + 4} textAnchor="middle" fontSize={9} fill={seat.isTaken || isSelected ? '#fff' : '#374151'}>
                  {seat.seatNumber}
                </text>
              </g>
            )
          })}
        </svg>
        <Legend partySize={partySize} selected={selectedIds.length} />
      </div>
    )
  }

  // rectangle layout: seats along top and bottom edges
  const perSide = Math.ceil(seats.length / 2)
  const topSeats = seats.slice(0, perSide)
  const bottomSeats = seats.slice(perSide)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2 w-full max-w-lg">
        <SeatRow seats={topSeats} selectedIds={selectedIds} onToggle={onToggle} accent={accent} />
        <div className="w-full h-16 rounded-lg bg-gray-200" />
        <SeatRow seats={bottomSeats} selectedIds={selectedIds} onToggle={onToggle} accent={accent} />
      </div>
      <Legend partySize={partySize} selected={selectedIds.length} />
    </div>
  )
}

function SeatRow({ seats, selectedIds, onToggle, accent }: {
  seats: Seat[]
  selectedIds: string[]
  onToggle: (id: string) => void
  accent: string
}) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {seats.map((seat) => {
        const isSelected = selectedIds.includes(seat.id)
        return (
          <button
            key={seat.id}
            onClick={() => !seat.isTaken && onToggle(seat.id)}
            disabled={seat.isTaken}
            title={`Seat ${seat.seatNumber}`}
            className="w-10 h-10 rounded text-xs font-medium border-2 transition-colors disabled:cursor-not-allowed"
            style={{
              backgroundColor: seat.isTaken ? '#9ca3af' : isSelected ? accent : '#ffffff',
              borderColor: seat.isTaken ? '#9ca3af' : isSelected ? accent : '#d1d5db',
              color: seat.isTaken || isSelected ? '#ffffff' : '#374151',
            }}
          >
            {seat.seatNumber}
          </button>
        )
      })}
    </div>
  )
}

function Legend({ partySize, selected }: { partySize: number; selected: number }) {
  return (
    <p className="text-sm text-gray-500">
      {selected} of {partySize} seat{partySize > 1 ? 's' : ''} selected
    </p>
  )
}
