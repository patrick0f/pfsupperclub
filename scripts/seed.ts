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
  // number of seats to fill with paid + reserved bookings (0 for non-bookable)
  book: number
}

const EVENTS: SeedEvent[] = [
  {
    key: 'fine-dining',
    title: 'Fine Dining',
    description:
      'A dressed-up dinner with a few courses and real table service. Come as you are or dress up — either way ' +
      'it\'s a nice night out without the nice-restaurant bill. Seats are limited, so grab one early.',
    date: eventAt(18),
    location: 'The Common Room · North Campus (address sent on confirmation)',
    pricePerSeat: 3000,
    totalSeats: 15,
    status: 'published',
    themeBgColor: '#15140f',
    themeFgColor: '#f2eee6',
    themeAccentColor: '#b89457',
    book: 13,
  },
  {
    key: 'taco-night',
    title: 'Taco Night',
    description:
      'Build-your-own taco bar with all the fixings — carnitas, grilled veggies, rice, beans, and a few salsas. ' +
      'Casual, cheap, and easy. Vegetarian options always available.',
    date: eventAt(46),
    location: 'The Common Room · North Campus (address sent on confirmation)',
    pricePerSeat: 1500,
    totalSeats: 15,
    status: 'draft',
    themeBgColor: '#1b1410',
    themeFgColor: '#f4ebe0',
    themeAccentColor: '#d98a34',
    book: 0,
  },
  {
    key: 'backyard-bbq',
    title: 'Backyard BBQ',
    description:
      'Burgers, grilled veggies, and sides out on the lawn. Bring a friend, grab a plate, and hang out. ' +
      'Let us know about any allergies when you book.',
    date: eventAt(-32),
    location: 'The Courtyard · West Hall (address sent on confirmation)',
    pricePerSeat: 2000,
    totalSeats: 15,
    status: 'completed',
    themeBgColor: '#14180f',
    themeFgColor: '#eef1e6',
    themeAccentColor: '#7aa03c',
    book: 15,
  },
  {
    key: 'omakase',
    title: 'Omakase',
    description:
      'Chef\'s choice, served piece by piece at the counter. Twelve seats only, so it fills up fast. ' +
      'Tell us about allergies ahead of time.',
    date: eventAt(-78),
    location: 'The Kitchen Counter · East Hall (address sent on confirmation)',
    pricePerSeat: 3000,
    totalSeats: 12,
    status: 'completed',
    themeBgColor: '#101314',
    themeFgColor: '#e9eff0',
    themeAccentColor: '#3f8ba0',
    book: 12,
  },
  {
    key: 'easter-dinner',
    title: 'Easter Dinner',
    description:
      'A big family-style Easter meal — ham, roasted vegetables, and plenty of sides. ' +
      'Bring a friend who\'d otherwise be eating alone.',
    date: new Date(2026, 3, 5, 17, 0, 0, 0), // Easter Sunday, April 5, 2026
    location: 'The Dining Hall · Main Campus (address sent on confirmation)',
    pricePerSeat: 2500,
    totalSeats: 15,
    status: 'completed',
    themeBgColor: '#16131a',
    themeFgColor: '#f1ecf2',
    themeAccentColor: '#b06fa8',
    book: 15,
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
const WAITLIST_EMAILS = ['tessa.friedman@gmail.com', 'omar.haddad@gmail.com', 'reese.calloway@gmail.com']
const DENIED_EMAILS = ['bulk.events.promo@gmail.com', 'quicktix.resell@gmail.com']

// ~80% gmail, rest a light mix so it isn't suspiciously uniform.
const EMAIL_DOMAINS = ['gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'outlook.com', 'icloud.com']
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

const usedConfirmations = new Set<string>()
function uniqueConfirmation(): string {
  let code = generateConfirmationNumber()
  while (usedConfirmations.has(code)) code = generateConfirmationNumber()
  usedConfirmations.add(code)
  return code
}

const TARGET_RESERVATIONS = 60

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

  // Phase 1 — fill each bookable event to its target with paid + reserved bookings.
  // Each student books a single seat for themselves (party size 1), so a full room = `book` reservations.
  for (const e of bookable) {
    const attendees = shuffle(memberIds)
    for (let i = 0; i < e.book; i++) {
      await createReservation(e, attendees[i], nameOfMember.get(attendees[i])!, 1, 'paid', 'reserved')
    }
  }

  // Phase 2 — a handful of historical cancellations on past events (do NOT consume seats).
  const pastEvents = bookable.filter(isPast)
  const upcoming = bookable.find((e) => e.status === 'published')!
  const cancellations: ReadonlyArray<['refunded' | 'failed', 'cancelled']> = [
    ['refunded', 'cancelled'], ['refunded', 'cancelled'], ['refunded', 'cancelled'],
    ['refunded', 'cancelled'], ['failed', 'cancelled'],
  ]
  for (const [pay, res] of cancellations) {
    if (total >= TARGET_RESERVATIONS) break
    const e = pick(pastEvents)
    const userId = pick(memberIds)
    await createReservation(e, userId, nameOfMember.get(userId)!, 1, pay, res)
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
