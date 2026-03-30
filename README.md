# PF Supper Club

A full-stack reservation platform for an invite-only supper club. Guests receive approval via email, browse upcoming events, and book seats through Stripe Checkout. Admins manage events, guest lists, and reservations from a dedicated dashboard.

**Live at [pfsupperclub.com](https://www.pfsupperclub.com)**

## Features

**Guest-facing**
- Email-based authentication with waitlist/approval flow
- Event browsing with per-event theming (colors, header images)
- Party size selection, guest info collection (names, dietary restrictions)
- Stripe Checkout with promo code support
- Reservation management (view, cancel) and confirmation emails
- Past events archive

**Admin dashboard**
- Approve/deny waitlisted guests (triggers approval email)
- Event CRUD with publish/unpublish/cancel lifecycle
- Reservation table with cancel, refund, no-show, and email resend actions
- S3 image uploads for menus and event headers
- Revenue and reservation stats

**Automated**
- Transactional emails: approval, confirmation, 24h reminder, cancellation
- Cron jobs: stale pending reservation cleanup, auto-complete past events

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript, Tailwind CSS) |
| Database | PostgreSQL (Neon) via Prisma 7 |
| Payments | Stripe Checkout |
| Email | Resend |
| Storage | AWS S3 (presigned uploads) |
| Hosting | AWS Amplify |
| Auth | NextAuth.js (admin) + iron-session (guests) |

## Local Setup

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npx prisma migrate dev
npm run dev
```

## Tests

```bash
npm test
```
