import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@/app/generated/prisma/client'
import { generateConfirmationNumber } from '@/lib/confirmation-number'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Deterministic PRNG (mulberry32) so reseeds produce a stable, realistic dataset.
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(0x5eed5eed)
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const chance = (p: number) => rand() < p
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const now = new Date()
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
// Event at a given day-offset from now, pinned to 7:00pm.
const eventAt = (dayOffset: number, hour = 19) => {
  const d = new Date(now.getTime() + dayOffset * DAY)
  d.setHours(hour, 0, 0, 0)
  return d
}
const hexId = (len: number) => Array.from({ length: len }, () => '0123456789abcdef'[Math.floor(rand() * 16)]).join('')

const CANCELLATION_POLICY =
  'Reservations may be cancelled up to 72 hours before the event for a full refund, issued manually by the host. ' +
  'Within 72 hours seats are non-refundable — ingredients are sourced and portioned to the confirmed headcount. ' +
  'To cancel, use the manage-reservation link in your confirmation email. Party-size changes require cancelling and rebooking.'

type SeedEvent = {
  key: string
  title: string
  description: string
  date: Date
  location: string
  pricePerSeat: number
  totalSeats: number
  status: 'published' | 'draft' | 'completed'
  themeBgColor: string
  themeFgColor: string
  themeAccentColor: string
  // fraction of seats to fill with paid+reserved bookings (0 for non-bookable)
  fill: number
}

const EVENTS: SeedEvent[] = [
  {
    key: 'midsummer',
    title: 'Midsummer at the Long Table',
    description:
      'A six-course celebration of peak-season produce served family-style down one long candlelit table. ' +
      'We build the night around whatever the farmers pull that week — heirloom tomatoes, first-of-season corn, ' +
      'stone fruit — with a raw bar to start and a brown-butter peach tart to finish. Natural-wine pairing included; ' +
      'bring your curiosity and an appetite for conversation with strangers who won\'t be strangers by dessert.',
    date: eventAt(18),
    location: 'Private loft · Arts District (address sent on confirmation)',
    pricePerSeat: 13500,
    totalSeats: 30,
    status: 'published',
    themeBgColor: '#1c1710',
    themeFgColor: '#f4ece0',
    themeAccentColor: '#c8743c',
    fill: 0.5,
  },
  {
    key: 'fire-vine',
    title: 'Fire & Vine: A Live-Fire Autumn Dinner',
    description:
      'Everything touches flame. A whole-hearth menu cooked over oak and grapevine cuttings — charred radicchio, ' +
      'ember-roasted squash, a forty-day dry-aged ribeye carved at the table — paired with bold reds from small ' +
      'growers. Seating is limited to keep the fire the center of the room.',
    date: eventAt(46),
    location: 'The Greenhouse · Hudson Valley (address sent on confirmation)',
    pricePerSeat: 15500,
    totalSeats: 24,
    status: 'draft',
    themeBgColor: '#17110d',
    themeFgColor: '#f1e7db',
    themeAccentColor: '#b5462b',
    fill: 0,
  },
  {
    key: 'coastal',
    title: 'Coastal Catch — A Spring Seafood Feast',
    description:
      'A love letter to the shoreline. Day-boat oysters and crudo to open, a saffron seafood stew ladled tableside, ' +
      'and a butter-poached halibut that had regulars talking for weeks. Crisp coastal whites throughout.',
    date: eventAt(-32),
    location: 'Riverside Studio · Brooklyn (address sent on confirmation)',
    pricePerSeat: 14500,
    totalSeats: 34,
    status: 'completed',
    themeBgColor: '#0f1a1f',
    themeFgColor: '#e8f0f2',
    themeAccentColor: '#3f8ba0',
    fill: 0.9,
  },
  {
    key: 'nose-to-tail',
    title: 'Nose to Tail: A Winter Butcher\'s Table',
    description:
      'A whole-animal dinner in the truest sense — nothing wasted, everything considered. Rillettes and terrine to ' +
      'start, a slow-braised shoulder as the centerpiece, marrow and crackling along the way. Not for the faint of ' +
      'heart; deeply rewarding for the curious. Big Burgundy and a few surprises in the glass.',
    date: eventAt(-78),
    location: 'Chef\'s Table at Marlow · Lower East Side (address sent on confirmation)',
    pricePerSeat: 16500,
    totalSeats: 24,
    status: 'completed',
    themeBgColor: '#1a1213',
    themeFgColor: '#f0e5e3',
    themeAccentColor: '#8f3a44',
    fill: 1.0,
  },
  {
    key: 'la-tavola',
    title: 'La Tavola: A Night in Emilia-Romagna',
    description:
      'Hand-rolled pasta and the food of Italy\'s richest culinary region. Mortadella and Parmigiano aged 36 months ' +
      'to start, tortellini in brodo folded that afternoon, and a tagliatelle al ragù cooked low since dawn. ' +
      'Lambrusco and Sangiovese poured generously. Come hungry; leave part of the family.',
    date: eventAt(-142),
    location: 'The Conservatory · West Village (address sent on confirmation)',
    pricePerSeat: 12500,
    totalSeats: 40,
    status: 'completed',
    themeBgColor: '#181a12',
    themeFgColor: '#eef0e4',
    themeAccentColor: '#7a8b3c',
    fill: 0.9,
  },
]

// 25 approved members with full profiles (two intentionally left profile-incomplete),
// 3 waitlisted (email only), 2 denied (email only) = 30 users total.
const MEMBER_NAMES: ReadonlyArray<[string, string]> = [
  ['Marcus', 'Bellweather'], ['Priya', 'Raghunathan'], ['Daniel', 'Okafor'], ['Sofia', 'Marchetti'],
  ['Elena', 'Volkova'], ['James', 'Whitfield'], ['Aisha', 'Rahman'], ['Thomas', 'Nguyen'],
  ['Clara', 'Lindqvist'], ['Rafael', 'Santos'], ['Hannah', 'Goldberg'], ['Wei', 'Chen'],
  ['Olivia', 'Barrett'], ['Andre', 'Dupont'], ['Maya', 'Patel'], ['Benjamin', 'Frost'],
  ['Isabella', 'Romano'], ['Kofi', 'Mensah'], ['Natalie', 'Brooks'], ['Lucas', 'Meyer'],
  ['Grace', 'Kim'], ['Julian', 'Alvarez'], ['Fiona', 'Gallagher'], ['Samuel', 'Adeyemi'],
  ['Chloe', 'Dubois'],
]
const WAITLIST_EMAILS = ['tessa.friedman@gmail.com', 'omar.haddad@outlook.com', 'reese.calloway@icloud.com']
const DENIED_EMAILS = ['bulk.events.nyc@gmail.com', 'quicktix.resell@gmail.com']

const EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'protonmail.com', 'hey.com', 'icloud.com', 'fastmail.com']
const emailFor = (first: string, last: string) => `${first}.${last}`.toLowerCase() + '@' + pick(EMAIL_DOMAINS)
const phone = () => `+1 (${randInt(201, 989)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`

const ADDITIONAL_GUEST_NAMES = [
  'Nina Torres', 'Ellis Wong', 'Priya Shah', 'Marcus Reid', 'Dana Levy', 'Theo Park',
  'Camille Rousseau', 'Owen Blackwood', 'Ivy Sanders', 'Leo Marchetti', 'Sadie Cohen',
  'Hugo Bernard', 'Amara Diallo', 'Felix Stern', 'Rosa Iglesias', 'Gavin Moore',
  'Yuki Tanaka', 'Bianca Costa', 'Nathaniel Reed', 'Simone Laurent',
] as const
const ALLERGIES = [
  'Shellfish allergy', 'Tree nut allergy', 'Severe peanut allergy', 'Gluten-free',
  'Vegetarian', 'Pescatarian', 'Dairy-free', 'No pork', 'Sesame allergy',
] as const

const PARTY_WEIGHTS: ReadonlyArray<[number, number]> = [[1, 0.3], [2, 0.45], [3, 0.15], [4, 0.1]]
function weightedPartySize(max: number): number {
  const r = rand()
  let acc = 0
  for (const [size, w] of PARTY_WEIGHTS) {
    acc += w
    if (r <= acc) return Math.min(size, max)
  }
  return Math.min(1, max)
}

const usedConfirmations = new Set<string>()
function uniqueConfirmation(): string {
  let code = generateConfirmationNumber()
  while (usedConfirmations.has(code)) code = generateConfirmationNumber()
  usedConfirmations.add(code)
  return code
}

const TARGET_RESERVATIONS = 75

async function main() {
  // --- Wipe (dependency order); admins are never touched ---
  await prisma.guest.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()

  // --- Users ---
  const memberIds: string[] = []
  for (let i = 0; i < MEMBER_NAMES.length; i++) {
    const [first, last] = MEMBER_NAMES[i]
    const incomplete = i >= MEMBER_NAMES.length - 2 // last two: approved but haven't finished their profile
    const createdAt = new Date(now.getTime() - randInt(30, 400) * DAY)
    const user = await prisma.user.create({
      data: {
        email: emailFor(first, last),
        firstName: incomplete ? null : first,
        lastName: incomplete ? null : last,
        phone: incomplete ? null : phone(),
        status: 'approved',
        profileComplete: !incomplete,
        createdAt,
      },
    })
    if (!incomplete) memberIds.push(user.id) // only fully-onboarded members can book
  }
  for (const email of WAITLIST_EMAILS) {
    await prisma.user.create({
      data: { email, status: 'waitlisted', profileComplete: false, createdAt: new Date(now.getTime() - randInt(1, 20) * DAY) },
    })
  }
  for (const email of DENIED_EMAILS) {
    await prisma.user.create({
      data: { email, status: 'denied', profileComplete: false, createdAt: new Date(now.getTime() - randInt(20, 120) * DAY) },
    })
  }

  // --- Events ---
  const eventRecords: Record<string, { id: string; e: SeedEvent }> = {}
  for (const e of EVENTS) {
    const createdAt = new Date(e.date.getTime() - randInt(25, 60) * DAY)
    const rec = await prisma.event.create({
      data: {
        title: e.title,
        description: e.description,
        date: e.date,
        location: e.location,
        pricePerSeat: e.pricePerSeat,
        totalSeats: e.totalSeats,
        cancellationPolicyText: CANCELLATION_POLICY,
        themeBgColor: e.themeBgColor,
        themeFgColor: e.themeFgColor,
        themeAccentColor: e.themeAccentColor,
        status: e.status,
        createdAt,
      },
    })
    eventRecords[e.key] = { id: rec.id, e }
  }

  // --- Reservations ---
  const bookable = EVENTS.filter((e) => e.status !== 'draft')
  const isPast = (e: SeedEvent) => e.status === 'completed'
  let total = 0

  const guestsFor = (primaryName: string, partySize: number) => {
    const extras = shuffle(ADDITIONAL_GUEST_NAMES).slice(0, partySize - 1)
    return Array.from({ length: partySize }, (_, idx) => ({
      name: idx === 0 ? primaryName : extras[idx - 1],
      isPrimary: idx === 0,
      allergies: chance(0.35) ? pick(ALLERGIES) : null,
    }))
  }

  const createReservation = async (
    e: SeedEvent,
    userId: string,
    primaryName: string,
    partySize: number,
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed',
    reservationStatus: 'reserved' | 'cancelled' | 'no_show',
  ) => {
    const bookedAt = new Date(e.date.getTime() - randInt(3, 35) * DAY)
    const paidOnce = paymentStatus === 'paid' || paymentStatus === 'refunded'
    const attended = isPast(e) && reservationStatus === 'reserved' && paymentStatus === 'paid'
    await prisma.reservation.create({
      data: {
        userId,
        eventId: eventRecords[e.key].id,
        partySize,
        totalAmount: e.pricePerSeat * partySize,
        confirmationNumber: uniqueConfirmation(),
        paymentStatus,
        reservationStatus,
        stripeCheckoutSessionId: `cs_test_${hexId(24)}`,
        stripePaymentIntentId: paidOnce ? `pi_${hexId(24)}` : null,
        confirmationSentAt: paidOnce ? new Date(bookedAt.getTime() + 2 * 60 * 1000) : null,
        reminderSentAt: attended ? new Date(e.date.getTime() - DAY) : null,
        createdAt: bookedAt,
        guests: { create: guestsFor(primaryName, partySize) },
      },
    })
    total++
  }

  const nameOfMember = new Map<string, string>()
  for (let i = 0; i < MEMBER_NAMES.length - 2; i++) {
    // memberIds preserves order of the fully-onboarded members
    nameOfMember.set(memberIds[i], `${MEMBER_NAMES[i][0]} ${MEMBER_NAMES[i][1]}`)
  }

  // Phase 1 — fill each bookable event with paid + reserved bookings (these consume seats).
  for (const e of bookable) {
    const targetSeats = Math.round(e.totalSeats * e.fill)
    let seatsBooked = 0
    const attendees = shuffle(memberIds)
    for (const userId of attendees) {
      if (seatsBooked >= targetSeats) break
      const partySize = weightedPartySize(Math.min(4, targetSeats - seatsBooked))
      if (partySize < 1) break
      await createReservation(e, userId, nameOfMember.get(userId)!, partySize, 'paid', 'reserved')
      seatsBooked += partySize
    }
  }

  // Phase 2 — pad to the target with realistic attrition rows (do NOT consume seats).
  const pastEvents = bookable.filter(isPast)
  const upcoming = bookable.find((e) => e.status === 'published')!
  // (paymentStatus, reservationStatus) combos for events that already happened.
  const pastAttrition: ReadonlyArray<['paid' | 'refunded' | 'failed', 'cancelled' | 'no_show']> = [
    ['refunded', 'cancelled'], ['refunded', 'cancelled'], ['paid', 'no_show'], ['failed', 'cancelled'],
  ]
  // For the upcoming event: a cancelled-and-refunded and one in-flight abandoned checkout.
  const upcomingAttrition: ReadonlyArray<['refunded' | 'pending', 'cancelled' | 'reserved']> = [
    ['refunded', 'cancelled'], ['pending', 'reserved'],
  ]

  let upcomingUsed = 0
  while (total < TARGET_RESERVATIONS) {
    const useUpcoming = upcomingUsed < 3 && chance(0.2)
    const e = useUpcoming ? upcoming : pick(pastEvents)
    const userId = pick(memberIds)
    const primaryName = nameOfMember.get(userId)!
    const partySize = weightedPartySize(4)
    if (useUpcoming) {
      const [pay, res] = pick(upcomingAttrition)
      await createReservation(e, userId, primaryName, partySize, pay, res)
      upcomingUsed++
    } else {
      const [pay, res] = pick(pastAttrition)
      await createReservation(e, userId, primaryName, partySize, pay, res)
    }
  }

  const booked = await prisma.reservation.aggregate({
    where: { eventId: eventRecords[upcoming.key].id, paymentStatus: 'paid', reservationStatus: 'reserved' },
    _sum: { partySize: true },
  })
  const remaining = upcoming.totalSeats - (booked._sum.partySize ?? 0)
  console.log(
    `Seeded: ${EVENTS.length} events, ${MEMBER_NAMES.length + WAITLIST_EMAILS.length + DENIED_EMAILS.length} users ` +
      `(${WAITLIST_EMAILS.length} waitlisted), ${total} reservations.`,
  )
  console.log(`Upcoming event "${upcoming.title}" has ${remaining} of ${upcoming.totalSeats} seats remaining.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
