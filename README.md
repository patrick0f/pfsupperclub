# PF Supper Club

Private reservation platform for a supper club.

## Stack

- Next.js 14 (App Router, TypeScript, Tailwind)
- PostgreSQL + Prisma 7
- Stripe Checkout
- Resend (email) / AWS S3 + Amplify
- NextAuth.js (admin) + iron-session (guests)

## Setup

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
