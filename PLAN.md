# PF Supper Club — Product Plan

Private reservation platform. Invite-only. One event at a time. Guests book and pay. Admin manages events, guests, and reservations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 App Router (TypeScript) |
| Database | AWS RDS (PostgreSQL) via Prisma |
| Hosting | AWS Amplify |
| Payments | Stripe Checkout |
| Email | AWS SES |
| File Storage | AWS S3 (menu PNGs, header images) |
| Auth | NextAuth.js (admin only) + iron-session (guests) |

---

## Guest UX Flow

1. **Landing page** — email input
   - Unknown → waitlist popup
   - Waitlisted → "you're on the waitlist"
   - Denied → same as unknown (no indication of denial); re-submitting resets to waitlisted
   - Admin email → password field → admin session
   - Approved + incomplete profile → profile completion (first name, last name, phone)
   - Approved + complete → home page

2. **Home page** — upcoming published event: date/time, location, price, seats remaining, menu image, cancellation policy, theming. Party size selector (capped at `min(4, remaining)`). "Sold out" when full. Link to past events.

3. **Guest info** — primary contact pre-filled; additional guests with name + dietary restrictions.

4. **Stripe Checkout** — `allow_promotion_codes: true`. Webhook marks reservation `paid + reserved` → fires confirmation email. Abandoned `pending` reservations deleted after 30 min.

5. **Confirmation screen** — reservation summary, confirmation number, manage reservation link.

6. **Manage reservation** — cancel (shows cancellation policy; no auto-refund). Party size changes require cancel + rebook. Cancellations locked within 72h of event.

7. **Past events** — read-only list of completed events.

---

## Emails (AWS SES)

| Trigger | Email |
|---|---|
| Admin approves waitlisted user | Approval — "You're on the list" + site link |
| Stripe webhook (payment complete) | Confirmation — event details, amount paid, confirmation number, manage link |
| 24h before event (cron, `reminder_sent_at IS NULL`) | Reminder — "See you tomorrow", event details |
| Guest cancels | Cancellation — confirms cancellation, manual refund note |
| Admin cancels event | Event cancellation — apology, manual refund note |

Cron: hourly GET `/api/cron/send-emails` (Bearer `CRON_SECRET`). Returns `{ ok, sent24h }`.

---

## Database Schema

### `users`
`id`, `email` (unique), `first_name`, `last_name`, `phone`, `status` (waitlisted / approved / denied), `profile_complete`, `created_at`, `updated_at`

### `admins`
`id`, `email`, `password_hash`, `name`, `phone`, `created_at`, `updated_at`

### `events`
`id`, `title`, `description`, `date` (timestamptz), `location`, `price_per_seat` (cents), `total_seats`, `menu_image_url`, `cancellation_policy_text`, `theme_bg_color`, `theme_accent_color`, `theme_header_image_url`, `status` (draft / published / cancelled / completed), `created_at`, `updated_at`

> `seats_remaining` = `total_seats` minus sum of `party_size` for paid + reserved reservations. No separate seats table.

### `reservations`
`id`, `user_id`, `event_id`, `party_size`, `total_amount` (cents), `stripe_payment_intent_id`, `stripe_checkout_session_id`, `payment_status` (pending / paid / refunded / failed), `reservation_status` (reserved / cancelled / no_show), `confirmation_number` (`PF-XXXXXX`), `confirmation_sent_at`, `reminder_sent_at`, `created_at`, `updated_at`

### `guests`
`id`, `reservation_id`, `name`, `allergies`, `is_primary`, `created_at`

### `recipes` *(admin-only, future scope)*
`id`, `event_id` (nullable), `name`, `course` (appetizer / entree / dessert), `base_servings`, `created_at`, `updated_at`

### `recipe_components`
`id`, `recipe_id`, `label` (nullable), `sort_order`, `created_at`

### `recipe_ingredients`
`id`, `component_id`, `name`, `quantity` (decimal), `unit`, `sort_order`, `created_at`

### `recipe_steps`
`id`, `recipe_id`, `step_number`, `instruction`, `created_at`

---

## API Routes

### Guest
| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/check-email` | Email gate — set session, return outcome |
| POST | `/api/auth/complete-profile` | Save name + phone on first login |
| PUT | `/api/auth/profile` | Update guest profile |
| GET | `/api/events` | Public: published + completed events (id, title, date) |
| GET | `/api/events/upcoming` | Single published event + seats remaining |
| GET | `/api/events/past` | Completed events list |
| POST | `/api/checkout` | Create Stripe session + pending reservation |
| POST | `/api/webhooks/stripe` | Mark paid, send confirmation email |
| GET | `/api/reservations/manage` | Look up reservation by confirmation + email |
| POST | `/api/reservations/[id]/cancel` | Cancel reservation |

### Admin
| Method | Route | Purpose |
|---|---|---|
| GET/POST | `/api/admin/events` | List / create events |
| GET/PUT/DELETE | `/api/admin/events/[id]` | Get / update / delete event |
| POST | `/api/admin/events/[id]/publish` | Publish draft event |
| POST | `/api/admin/events/[id]/unpublish` | Revert to draft |
| POST | `/api/admin/events/[id]/cancel` | Cancel event + blast cancellation emails |
| GET | `/api/admin/events/[id]/reservations` | All reservations for event |
| PATCH | `/api/admin/reservations/[id]` | Update reservation status |
| POST | `/api/admin/reservations/[id]/refund` | Issue Stripe refund |
| POST | `/api/admin/reservations/[id]/resend` | Resend confirmation or reminder email |
| GET/POST | `/api/admin/users` | List all users |
| POST | `/api/admin/users/[id]/approve` | Approve + send approval email |
| POST | `/api/admin/users/[id]/deny` | Deny user |
| GET/PUT | `/api/admin/profile` | Admin profile |
| POST | `/api/upload` | Generate presigned S3 URL |
| GET/POST | `/api/admin/recipes` | List / create recipes |
| GET/PUT/DELETE | `/api/admin/recipes/[id]` | Get / update / delete recipe |

### Cron
| Method | Route | Purpose |
|---|---|---|
| GET | `/api/cron/send-emails` | Send 24h reminder emails (Bearer auth) |

---

## Admin UX

- **Dashboard** — pending approvals (approve/deny), current event: reservation count + revenue
- **Guest list** — all users with status; approve/deny actions
- **Events** — list all events; create/edit (title, description, date, location, price, total seats, menu image, cancellation policy, theme colors + header image); publish/unpublish/cancel; one published event at a time enforced
- **Reservations** — table: guest, email, party size, payment status, reservation status, amount; actions: cancel, no-show, refund, resend confirmation, resend reminder

---

## Development Phases

### Phase 1 — Foundation ✅
Next.js 14 + Prisma + PostgreSQL, schema + migration, NextAuth admin auth, iron-session, TDD for `generateConfirmationNumber`, all route stubs.

### Phase 2 — Guest Flow ✅
Full guest booking flow: landing page (email gate), profile completion, home page with event + theming, guest info, Stripe Checkout, webhook, confirmation screen, manage reservation (cancel), past events, guest nav.

### Phase 3 — Emails ✅
AWS SES integration. All transactional emails: approval, confirmation, 24h reminder, cancellation, event cancellation. Hourly cron route.

### Phase 4 — Admin Panel ✅
Admin auth guard, nav, profile. Dashboard (approvals + event snapshot). Guest list (approve/deny). Event CRUD + publish/unpublish/cancel. Reservations table (cancel, no-show, refund, resend). Public `GET /api/events` endpoint.

### Phase 5 — AWS Deployment
- RDS: provision, `npx prisma migrate deploy`
- S3: bucket + CORS for presigned uploads
- Amplify: connect repo, all env vars
- Stripe: production webhook
- SES: verify sending domain, production access
- Smoke test: end-to-end booking + email delivery

### Phase 6 — UI / Styling
Guest-facing (clean, sleek — primary user experience):
- Landing page: email gate, waitlist/approval states
- Home page: event card with theming (`theme_bg_color`, `theme_accent_color`, `theme_header_image_url`), party size selector
- Booking flow: guest info form, Stripe handoff
- Confirmation screen + manage reservation page
- Past events list
- Consistent typography, spacing, mobile-first responsive layout

Admin-facing (minimal, functional — internal use only):
- Dashboard, guest list, events, reservations table
- Clean but no design investment beyond usability

### Phase 7 — Polish
- Loading states + error boundaries
- Cleanup job: delete `pending` reservations older than 30 min
- Auto-complete cron: move `published` → `completed` after event date passes

---

## Env Vars

```
# Auth
IRON_SESSION_PASSWORD       # openssl rand -base64 32
NEXTAUTH_SECRET             # openssl rand -base64 32
NEXT_PUBLIC_BASE_URL        # e.g. https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET       # from: stripe listen --forward-to localhost:3000/api/webhooks/stripe

# AWS
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_SES_FROM_EMAIL
AWS_S3_BUCKET_NAME

# Cron
CRON_SECRET                 # openssl rand -base64 32
```
