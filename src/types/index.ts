export type UserRole = 'venue' | 'concierge' | 'admin'

export type VenueType = 'club' | 'restaurant' | 'lounge' | 'bar'

export type TableType = 'vip' | 'standard' | 'bar'
export type TableShape = 'round' | 'rectangle'
export type TableStatus = 'available' | 'reserved' | 'occupied' | 'blocked'

export type Table = {
  id: string
  number: number
  type: TableType
  capacity: number
  minimumSpend: number
  shape: TableShape
  position: { x: number; y: number }
  status: TableStatus
}

export type Venue = {
  id: string
  name: string
  type: VenueType
  city: string
  address: string
  capacity: number
  description: string
  openingHours: string
  coverImage: string
  tables: Table[]
}

export type PRStatus = 'active' | 'pending' | 'inactive'

export type PR = {
  id: string
  name: string
  email: string
  phone: string
  agency?: string
  city: string
  status: PRStatus
  stats: {
    covers: number
    revenue: number
    commissionOwed: number
  }
}

export type ReservationType = 'guestlist' | 'table'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled'

export type Reservation = {
  id: string
  guestName: string
  guestPhone: string
  guestEmail: string
  venueId: string
  eventId?: string
  prId: string
  type: ReservationType
  tablePreference?: string
  partySize: number
  status: ReservationStatus
  specialRequests?: string
  date: string
  minimumSpend?: number
}

export type EventStatus = 'open' | 'closed'

export type Event = {
  id: string
  venueId: string
  name: string
  date: string
  startTime: string
  endTime: string
  genres: string[]
  guestListCapacity: number
  tableReservations: boolean
  description: string
  coverImage: string
  status: EventStatus
}

export type Note = {
  id: string
  content: string
  author: string
  date: string
}

export type Guest = {
  id: string
  name: string
  phone: string
  email: string
  isVip: boolean
  tags: string[]
  notes: Note[]
  stats: {
    totalVisits: number
    totalSpend: number
    avgSpend: number
    avgPartySize: number
    firstVisit: string
  }
}

export type Message = {
  id: string
  senderId: string
  content: string
  timestamp: string
  isOwn: boolean
}

export type Conversation = {
  id: string
  name: string
  initials: string
  lastMessage: string
  timestamp: string
  unread: boolean
  role?: string
  venue?: string
}
