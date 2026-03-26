# PF Supper Club — Product Plan

## Overview
A reservation platform for a private supper club. Invite-only via email gate. One event at a time. Guests reserve spots, pay, select seats, and receive confirmation. Admin manages events, theming, guest list, and reservations.

---

## External Setup Required

### Local dev (Phase 2+)
- `IRON_SESSION_PASSWORD`: `openssl rand -base64 32` (32+ chars)
- `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- Stripe: `sk_test_...` → `STRIPE_SECRET_KEY`, `pk_test_...` → `STRIPE_PUBLISHABLE_KEY`
- Stripe local webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` → copy `whsec_...` → `STRIPE_WEBHOOK_SECRET`
- Seed admin: hash password with bcryptjs, INSERT into admins table via psql
- Approve test user: `UPDATE users SET status='approved' WHERE email='...'`

### Phase 3 (emails)
- AWS SES: verify sender domain/email, request production access
- AWS IAM: create user with `AmazonSESFullAccess`, generate access key
- Set: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_SES_FROM_EMAIL`
- `CRON_SECRET`: `openssl rand -base64 32`
- Cron trigger: EventBridge → HTTP GET `/api/cron/send-emails` hourly

### Phase 5 (deployment)
- RDS: provision PostgreSQL, run `npx prisma migrate deploy`
- S3: create bucket, configure CORS for uploads
- Amplify: connect repo, set all env vars
- Stripe: register production webhook at `https://yourdomain.com/api/webhooks/stripe`
- SES: confirm production access, add DNS records for sender domain

---

## Open Questions (resolve before building)

### Resolved
- Table shape options: Rectangle and round with 5-10 seats
- Seating chart: interactive, programmatic render, N individual seat clicks, unselect by re-clicking, must select exactly N before continuing
- Seat selection is decoupled from booking — triggered via 72h email link, not part of initial flow; locked 24h before event
- Seat selection auth: signed token (confirmation number + email) in URL — no password needed
- Confirmation email fires on Stripe webhook (end of booking flow); no seat info yet
- Seats-confirmed email is an admin-triggered blast to all guests: admin assigns seats for anyone who didn't self-select, then manually fires the email from the admin panel; includes each guest's seats and a note that seating changes are final the day before the event
- Party size changes: increases require contacting admin manually; decreases allowed before 72h cutoff with manual refund by admin
- Two lock cutoffs: 72h before = party size + cancellation locked; 24h before = seat changes locked
- Abandoned pre-payment reservations (`pending`) are silently deleted by cleanup job after 30 min — no `incomplete` status needed
- Cancellation policy: per-event text field set by admin; shown in confirmation email and on manage-reservation page
- Guests can cancel and change seats via manage-reservation link; both locked per cutoffs above
- Event cancellation by admin: sends cancellation email to all guests; refunds handled manually by admin
- seats_remaining derived from seats table (not stored separately) to prevent sync issues
- Party size selector capped at min(4, available_seats)
- Guest list: unknown emails go to waitlist; admin approves; approval triggers SES email with site URL
- New approved users: first login triggers profile completion step (first name, last name, phone)
- Duplicate reservations: one per email per event, enforced at API level
- Only 1 published event at a time: enforced at API level (cannot publish if another is already published)
- Events auto-complete: status moves from `published` to `completed` after the event date passes (cron check)
- If admin changes `total_seats` after publishing: new seat rows are added; existing seats with reservations cannot be removed
- `incomplete` reservation status removed — abandoned pre-payment reservations are silently deleted by cleanup job
- Guest email is not editable (prevents breaking manage-reservation links); name and phone are editable
- Confirmation number format: 6-char alphanumeric prefixed, e.g., `PF-A3K9`
- Two scheduled emails: 72h before (seat selection link) and 24h before (see you tomorrow + finalized seats)
- Seats-confirmed blast can be re-sent by admin if seating changes after initial send

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend + Backend | Next.js (App Router) | UI, API routes, SSR |
| Database | AWS RDS (PostgreSQL) | Events, reservations, users, guests, seats |
| Hosting | AWS Amplify | Hosting, SSL, auto-deploy |
| Payments | Stripe Checkout | Collect payments; promo codes via Stripe dashboard |
| Email | AWS SES | All transactional emails |
| File Storage | AWS S3 | Menu PNGs, event theme assets |
| Auth | NextAuth.js | Admin login only |
| ORM | Prisma | Type-safe DB queries |

---

## Guest UX Flow

### Step 1 — Landing Page (Email Gate)
- Minimal page: logo/name, short welcome copy, single email input
- A session cookie is set after email entry so the app knows who the user is across the booking flow
- Three outcomes:
  - **Unknown email** → popup: "You're not on the guest list yet. Want to be added?" → email saved to waitlist, no access
  - **Approved, profile incomplete** → profile setup: first name, last name, phone → save → home page
  - **Approved, profile complete** → home page

### Step 2 — Home Page (Event View)
- Shows the single upcoming published event, or empty state: "New events coming soon!"
- Back button available on Steps 3–4 to return to previous step (Step 3 → Step 2, etc.)
- Link to past events page (list of previous events — title, date, menu image, read-only)
- Event info:
  - Date and time
  - Location
  - Price per guest
  - Seats available (derived from seats table), or "Sold out"
  - Menu (PNG from S3)
  - Cancellation policy (from admin-set text)
- Theme (background color, accent color, header image) is configurable per event from admin
- CTA: party size selector capped at min(4, available seats), then "Reserve" — disabled + "Sold out" when no seats remain

### Step 3 — Guest Info
- One entry per guest in the party:
  - Primary contact: first/last name (pre-filled from profile), phone (pre-filled), email (read-only)
  - Each additional guest: name, dietary restrictions / allergies
- "Continue to payment" CTA

### Step 4 — Payment
- Stripe Checkout (hosted), `allow_promotion_codes: true`
- Amount = price_per_guest × party_size
- Promo/coupon codes created and managed in Stripe dashboard — no custom backend code needed
- On Stripe success → webhook marks reservation as `paid` + `reservation_status = reserved` → user redirected to confirmation screen
- On failure/abandonment → reservation stays `pending`; cleanup job deletes it after 30 min

### Step 5 — Confirmation Screen
- Thank you message
- Reservation summary: event name, date, location, party size, amount paid, confirmation number
- Note: "You'll receive a reminder email 24 hours before the event with a link to select your seats"
- Note: "Need to change your party size? Cancel this reservation and rebook."
- "Check your email — a confirmation has been sent"
- Link: "Manage your reservation"

---

## Guest Navigation
All guest-facing pages (home, guest info, confirmation, manage reservation, profile) share a minimal header with:
- **Profile link** → guest profile page
- **Logout button** → clears session cookie, returns to landing page

## Guest Profile Page
- Shows current first name, last name, email, phone
- Editable fields: first name, last name, phone (email is not editable — changing it would break manage-reservation links)
- Save changes → updates `users` record

## Seat Selection Page (via 72h Email Link)
Accessed via signed link in the 72h email (confirmation number + email token — no password needed). Available until 24h before event.

- Birdseye programmatic render of the table
- Seat states: available, taken, your current selection (highlighted)
- Click available seat to select; click selected seat to deselect
- Must select exactly N seats (N = party size) before "Confirm" is enabled
- Polling every 5–10 seconds refreshes availability
- If a seat is taken between last poll and submit: error shown, user picks another
- **Note field**: "Add a note to the chef" — free text, optional
- **Disclaimer**: "Seating preferences are noted. The chef reserves the right to adjust seating."
- On submit: seats saved, `seats_selected = true`
- If within 24h of event: page shows "Seat selection is now closed" — no changes allowed

## Manage Reservation Page
Accessible via link in confirmation email (no password needed — identified by confirmation number + email).

- Shows reservation details
- **Change seats**: re-opens the seat selection chart; locked within 24h of event
- **Cancel reservation**:
  - Shows the event's cancellation policy text
  - User confirms cancellation
  - Reservation marked `cancelled`, cancellation email sent
  - **No automatic refund** — admin handles all refunds manually
- **Changing party size**: not supported — note: "Need to change your party size? Cancel this reservation and rebook."

---

## Abandoned Reservations
If a user starts the booking flow but never completes payment:
- Reservation has `payment_status = pending`
- Cleanup job silently deletes these (and their guest rows) after 30 min
- Not visible in admin — they're noise, not actionable

---

## Email (AWS SES)

### Approval Email (trigger: admin approves a waitlisted user)
- Subject: "You're on the list — PF Supper Club"
- Body: you've been approved, link to the site

### Confirmation Email (trigger: Stripe payment webhook — end of booking flow)
- Subject: "You're in — [Event Title], [Date]"
- Body: guest name, event date/time, location, party size, amount paid, confirmation number, cancellation policy, "manage reservation" link, note that seat selection link will arrive 72h before event

### 72h Email (trigger: 72 hours before event date, for all `reserved` reservations)
- Subject: "Choose your seats — [Event Title], [Date]"
- Body: event date/time, location, party size, special instructions from admin, **seat selection link** (signed token), note that seat changes lock 24h before event

### 24h Reminder Email (trigger: 24 hours before event date, for all `reserved` reservations)
- Subject: "See you tomorrow — [Event Title]"
- Body: date/time, location, party size, finalized seating assignment (their seats), note: "Let me know if any seating changes are needed — seating is final as of today"

### Seats-Confirmed Email (trigger: admin manually fires blast from admin panel after assigning all seats)
- Subject: "Your seats are set — [Event Title], [Date]"
- Body: guest name, event date/time, location, their assigned seats, note: "If this seating arrangement poses an issue, please let me know — seating changes are final the day before the event"

### Cancellation Email (trigger: guest cancels reservation)
- Subject: "Reservation cancelled — [Event Title]"
- Body: confirms cancellation, notes that refund requests are handled manually (contact info provided)

### Event Cancellation Email (trigger: admin cancels event)
- Subject: "Event cancelled — [Event Title]"
- Body: apology, note that refunds are handled manually (contact info provided)

> Email triggers: EventBridge scheduled rules or hourly cron route. 72h email checks for events starting in the next 72h where `seat_selection_sent_at IS NULL`. 24h email checks for events starting in the next 24h where `reminder_sent_at IS NULL`.

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| email | string | unique |
| first_name | string | nullable until profile complete |
| last_name | string | nullable until profile complete |
| phone | string | nullable until profile complete |
| status | enum | `waitlisted`, `approved`, `denied` |
| profile_complete | boolean | false until name + phone entered |
| created_at | timestamp | |
| updated_at | timestamp | |

### `admins`
| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| email | string | unique |
| password_hash | string | |
| name | string | |
| phone | string | nullable |
| created_at | timestamp | |
| updated_at | timestamp | |

### `events`
| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| title | string | |
| description | text | |
| date | timestamp | with timezone |
| location | string | |
| price_per_seat | integer | stored in cents |
| total_seats | integer | |
| menu_image_url | string | S3 URL — PNG menu |
| table_shape | enum | `rectangle`, `round` |
| cancellation_policy_text | text | displayed to guests |
| theme_bg_color | string | hex color |
| theme_accent_color | string | hex color |
| theme_header_image_url | string | S3 URL — mood image |
| status | enum | `draft`, `published`, `cancelled`, `completed` |
| created_at | timestamp | |
| updated_at | timestamp | |

### `seats`
Created when an event is published (one row per seat).

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| event_id | FK → events | |
| seat_number | integer | 1-indexed |
| reservation_id | FK → reservations | nullable — null = available |
| created_at | timestamp | |

> No soft holds needed (pay-first flow). `seats_remaining` is derived: `SELECT COUNT(*) FROM seats WHERE event_id = ? AND reservation_id IS NULL`.

### `reservations`
| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| user_id | FK → users | primary contact |
| event_id | FK → events | |
| party_size | integer | 1–4 |
| total_amount | integer | in cents |
| stripe_payment_intent_id | string | |
| stripe_checkout_session_id | string | |
| payment_status | enum | `pending`, `paid`, `refunded`, `failed` |
| reservation_status | enum | `reserved`, `cancelled`, `no_show` |
| seats_selected | boolean | false until guest submits seat selection via reminder link |
| seat_note | text | nullable — note added during seat selection |
| confirmation_number | string | 6-char alphanumeric, e.g., `PF-A3K9` |
| confirmation_sent_at | timestamp | nullable |
| seat_selection_sent_at | timestamp | nullable — tracks 72h email |
| reminder_sent_at | timestamp | nullable — tracks 24h email |
| created_at | timestamp | |
| updated_at | timestamp | |

### `guests`
Per-person details within a reservation.

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| reservation_id | FK → reservations | |
| name | string | |
| allergies | text | nullable |
| is_primary | boolean | true for the booking contact |
| created_at | timestamp | |

### `recipes`
| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| event_id | FK → events | nullable — null means tagged as "Base" |
| name | string | |
| course | enum | `appetizer`, `entree`, `dessert` |
| base_servings | integer | reference serving count for scaling |
| created_at | timestamp | |
| updated_at | timestamp | |

### `recipe_components`
Optional groupings within a recipe (e.g., "Sauce", "Vinaigrette"). Every recipe has at least one component; if no grouping is needed, a single unlabeled component is created by default.

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| recipe_id | FK → recipes | |
| label | string | nullable — null = ungrouped/default |
| sort_order | integer | |
| created_at | timestamp | |

### `recipe_ingredients`
| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| component_id | FK → recipe_components | |
| name | string | |
| quantity | decimal | base quantity (before scaling) |
| unit | string | e.g., `g`, `ml`, `oz`, `cups`, `tbsp`, `tsp` |
| sort_order | integer | |
| created_at | timestamp | |

### `recipe_steps`
Steps belong to the whole recipe, not to individual components.

| Column | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| recipe_id | FK → recipes | |
| step_number | integer | |
| instruction | text | |
| created_at | timestamp | |

---

## Payment Flow (Stripe)

1. User completes guest info → frontend calls `POST /api/checkout`
2. API route:
   - Checks no existing `reserved` reservation for this user + event
   - Checks available seats ≥ party_size
   - Creates `pending` reservation + guest rows in DB
   - Creates Stripe Checkout Session (`allow_promotion_codes: true`)
   - Returns Stripe Checkout URL
3. User pays on Stripe
4. Stripe webhook fires → `POST /api/webhooks/stripe`:
   - Verifies signature (idempotent — safe to receive twice)
   - Sets `payment_status = paid`, `reservation_status = reserved`
   - Triggers confirmation email via SES
   - User redirected to confirmation screen
5. User lands on confirmation screen — booking flow complete

### Seat selection (separate, later)
- Triggered via signed link in the 72h email; available until 24h before the event
- User submits N seat selections + optional note → `POST /api/seats/select`:
  - Validates seats are still available
  - Sets `reservation_id` on each selected seat row
  - Sets `seats_selected = true`, saves note

### Abandoned payments
- Pending reservations with `payment_status = pending` older than 30 min: cleanup job deletes reservation + guest rows
- Seats are never touched during the payment flow, so no seat release needed

---

## Admin UX

### Login
- Same landing page as guests: enter email → if admin email detected, password field appears → correct password → admin session granted
- Admin is redirected to `/admin` dashboard; all `/admin/*` routes protected
- Admin nav includes a **logout button** (clears admin session) and a **profile link**

### Admin Profile (`/admin/profile`)
- Editable fields: email, phone
- Save → updates `admins` record

### Home / Dashboard (`/admin`)
Two panels:

**Pending approvals**
- List of waitlisted users with Approve / Deny buttons
- Approve → sets status `approved`, sends approval email
- Deny → sets status `denied`, no email sent
- Denied users see identical UX to unknown emails on the guest-facing side — same "not on the list" popup, no indication they were denied
- If a denied user re-submits their email via the popup, their status resets to `waitlisted` and they reappear in pending approvals

**Current event snapshot**
- Upcoming event title, date, seats sold / total, revenue
- Quick link to event reservations and seating chart
- Count of reservations where `seats_selected = false` (haven't chosen seats yet)

### Guest List (`/admin/guests`)
- Table of all users: name, email, status (`waitlisted`, `approved`, `denied`)
- Filter by status
- Can re-approve a denied user, or deny an approved one (e.g., someone causing issues)
- CSV export

### Events (`/admin/events`)
- List of all events (past + upcoming) with status
- **Create / Edit event form** fields:
  - Title, description, date/time (with timezone), location
  - Price per seat, total seats
  - Menu image upload (PNG → S3)
  - Table shape (`rectangle` or `round`)
  - Cancellation policy text
  - Theme: background color, accent color, header image upload (→ S3)
- Publish / unpublish / cancel event
- Cannot publish if another event is already published (enforced)

### Reservations per Event (`/admin/events/[id]/reservations`)
- Table: guest name, email, party size, status (`reserved`, `cancelled`, `no_show`), seats assigned, seats_selected, seat note, amount paid
- Per-reservation actions:
  - Cancel reservation
  - Mark no-show
  - Issue refund (inline button that calls Stripe API, or link to Stripe payment)
  - Manually override seat assignment
  - Resend confirmation email
  - Resend reminder email
- CSV export of full reservation list

### Seating Chart (`/admin/events/[id]/seating`)
- Birdseye programmatic chart of the table
- Seats color-coded: assigned (green), unassigned (grey)
- Click any unassigned seat → dropdown to assign to a reservation
- Shows guest name on each assigned seat
- **"Send seating confirmation" button**: shows warning count of unassigned seats if any; on click → blasts seats-confirmed email to all guests with `reserved` status; can be re-sent if seating changes are made after initial blast

### Recipes (`/admin/recipes`)

**Recipe list view**
- All recipes across all events + Base, displayed as a table
- Search bar: search by recipe name
- Filter by: event tag (dropdown — "Base" + all events), course (appetizer / entrée / dessert)
- "New recipe" button → opens recipe editor

**Recipe editor (create / edit)**
- Fields: name, course, event tag (dropdown — "Base" always present; each event appears here automatically when created), base servings
- **Scaling input**: `× [number]` field — multiplies all ingredient quantities in real time for display; base quantities stored unchanged in DB
- **Unit conversion**: two buttons — "Convert to metric (g / ml)" and "Convert to imperial (oz / cups)"; converts all ingredient units within their category (weights: g ↔ oz; volumes: ml ↔ cups/tbsp/tsp); no cross-category (weight ↔ volume) conversion
- **Components**: one or more labeled sections (e.g., "Sauce", "Vinaigrette"); add/remove components; label is optional — unlabeled = ungrouped; each component has its own ingredient list
- **Ingredients** (per component): ordered rows, each with: ingredient name, quantity, unit (free select or typed); add/remove/reorder rows
- **Steps**: ordered list of individual text inputs (add/remove/reorder); scaling does not affect steps
- **Print button**: renders a clean printable view of the recipe at the current scale and unit system

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | /api/auth/check-email | Check email status; set session cookie |
| POST | /api/auth/complete-profile | Save name + phone for new approved users |
| GET | /api/events/upcoming | Get the single published upcoming event |
| GET | /api/events/past | List completed events (read-only, for guest past events page) |
| GET | /api/events/[id]/seats | Get current seat availability |
| POST | /api/checkout | Create Stripe session + pending reservation |
| POST | /api/webhooks/stripe | Handle Stripe payment webhook |
| POST | /api/seats/select | Submit seat selections + note post-payment |
| GET | /api/reservations/manage | Look up reservation by confirmation number + email |
| PUT | /api/auth/profile | Update guest profile (name, phone) |
| POST | /api/reservations/[id]/cancel | Cancel reservation |
| PUT | /api/reservations/[id]/seats | Update seat selection (change seats) |
| POST | /api/admin/events | Create event |
| PUT | /api/admin/events/[id] | Update event |
| DELETE | /api/admin/events/[id] | Delete event |
| POST | /api/admin/events/[id]/cancel | Cancel event + send cancellation emails |
| GET | /api/admin/events/[id]/reservations | List all reservations with detail |
| POST | /api/admin/reservations/[id]/refund | Manual refund |
| PATCH | /api/admin/reservations/[id] | Manual status update (no-show, etc.) |
| PATCH | /api/admin/seats/[id] | Override seat assignment |
| GET | /api/admin/users | List all users with status |
| POST | /api/admin/users/[id]/approve | Approve waitlisted user + send email |
| POST | /api/admin/users/[id]/deny | Deny waitlisted user |
| PUT | /api/admin/profile | Update admin profile (email, phone) |
| POST | /api/upload | Generate presigned S3 URL |
| GET | /api/admin/recipes | List recipes (search + filter by event/course) |
| POST | /api/admin/recipes | Create recipe with components, ingredients, steps |
| GET | /api/admin/recipes/[id] | Get single recipe |
| PUT | /api/admin/recipes/[id] | Update recipe |
| DELETE | /api/admin/recipes/[id] | Delete recipe |

---

## Development Phases

### Phase 1 — Foundation ✅
- Next.js 14 App Router (TypeScript, Tailwind, ESLint)
- Prisma 7 + `@prisma/adapter-pg` for direct PostgreSQL connection
- Full schema (10 models, 6 enums) + initial migration
- `lib/prisma.ts` singleton, `lib/session.ts` (iron-session), `types/index.ts` (NextAuth augmentation)
- NextAuth.js credentials provider for admin (bcryptjs comparison against `admins` table)
- TDD: `generateConfirmationNumber` (`PF-XXXXXX`, ambiguous chars excluded)
- TDD: `generateSeatsForEvent` (injected prisma, single `createMany` call)
- All 16 page stubs + 26 API route stubs
- TypeScript clean, 8/8 tests pass

### Phase 2 — Guest Flow ✅
- **Unified landing page**: email input handles both guests and admin
  - Unknown email → waitlist popup
  - Waitlisted → "you're on the waitlist" message
  - Denied → identical popup to unknown (no indication of denial)
  - Admin email → password field appears; correct password → admin session → redirect to `/admin`
  - Approved + profile incomplete → profile completion step (first name, last name, phone)
  - Approved + profile complete → home page
  - Denied user re-submitting email resets status to `waitlisted`
- **Guest profile page**: view/edit first name, last name, phone (email read-only)
- **Home page**: single published event with full details + theming; empty state; CTA with party size selector (capped at min(4, available)); past events link
- **Past events page**: read-only list of completed events (title, date, menu image)
- **Guest info form**: primary contact pre-filled from profile; additional guests with name + dietary restrictions; back button to home
- **Stripe Checkout**: session creation (`allow_promotion_codes: true`), redirect, webhook marks `paid + reserved`, confirmation email triggered
- **Confirmation screen**: reservation summary + confirmation number + manage reservation link
- **Seat selection page**: programmatic table render (rectangle or round), polling every 5–10s, N-click selection, unselect by re-clicking, note field, "Confirm" enabled only when exactly N seats chosen; locked and shows closed message within 24h of event; accessed via signed token in 72h email
- **Manage reservation page**: cancel (shows cancellation policy, no auto-refund) + change seats (re-opens seat chart, locked within 24h)
- **Guest nav**: profile link + logout button on all guest pages

### Phase 3 — Emails
- AWS SES setup (domain verification, production access)
- Approval email (trigger: admin approves waitlisted user)
- Confirmation email (trigger: Stripe webhook — `checkout.session.completed`)
- 72h email with signed seat selection link (trigger: scheduled check for events starting within 72h where `seat_selection_sent_at IS NULL`)
- 24h reminder email with finalized seat assignment (trigger: scheduled check for events starting within 24h where `reminder_sent_at IS NULL`)
- Seats-confirmed blast (trigger: admin manually fires from seating chart page)
- Guest cancellation email (trigger: guest cancels reservation)
- Event cancellation email (trigger: admin cancels event)
- Scheduled triggers: EventBridge rules or hourly cron API route

### Phase 4 — Admin Panel
- **Admin auth guard**: all `/admin/*` routes protected by NextAuth session; redirect to landing page if unauthenticated
- **Admin nav**: logout button + profile link on all admin pages
- **Admin profile** (`/admin/profile`): edit email + phone
- **Dashboard** (`/admin`): pending approvals (approve/deny buttons), current event snapshot (seats sold, revenue, seats-not-selected count), quick links to reservations and seating chart
- **Guest list** (`/admin/guests`): table of all users with status, filter by status, approve/deny actions, CSV export
- **Events** (`/admin/events`): list all events; create/edit form (all fields including S3 uploads for menu PNG and header image); publish/unpublish/cancel; enforce one published event at a time; seat generation (`generateSeatsForEvent`) fires on publish
- **Reservations per event** (`/admin/events/[id]/reservations`): table with all guest detail; per-row actions: cancel, mark no-show, issue refund (Stripe API), manually override seat assignment, resend confirmation email, resend reminder email; CSV export
- **Seating chart** (`/admin/events/[id]/seating`): programmatic table render; seats color-coded assigned/unassigned; click unassigned seat → assign to reservation; "Send seating confirmation" button with unassigned-seat warning count; can re-send after changes

### Phase 4.5 — Recipes
- **Recipes** (`/admin/recipes`): list with search + filter by event/course; recipe editor with name, course, event tag, base servings; scaling multiplier (live display, base quantities unchanged); unit conversion (metric ↔ imperial within weight/volume categories); components with labeled sections; ingredients per component (name, quantity, unit, reorder); steps (reorder); print view

### Phase 5 — AWS Deployment
- RDS PostgreSQL: provision, run migrations, configure connection string
- S3 bucket: configure CORS, IAM policy for presigned upload URLs
- AWS Amplify: connect repo, configure build settings, set all env vars
- Stripe: register production webhook endpoint, copy signing secret
- SES: verify sending domain, confirm production access
- Smoke test: end-to-end booking flow, payment webhook, email delivery

### Phase 6 — Polish
- Mobile optimization (touch-friendly seat chart, responsive layout throughout)
- Loading states and error boundaries throughout
- Rate limiting on auth + booking routes
- Cleanup job: silently delete `pending` reservations + guest rows older than 30 min
- Auto-complete cron: move `published` events to `completed` after event date passes
- Seat row management: add new rows when admin increases `total_seats` post-publish; block removal of rows with `reservation_id` set
- CloudWatch monitoring + alerting
