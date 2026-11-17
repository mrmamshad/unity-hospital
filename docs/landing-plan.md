# Aurelia Health — landing & login plan

**Reference:** Warby Parker homepage clone (session export `warby-parker-landing-page-clone.json`,
TaskOrbit build). Source section inventory, measured heights and design tokens are taken from
`docs/warby-clone-plan.md` in that project.

**What we keep from the reference:** section order and rhythm, full-bleed media, 100 px pill
buttons, cream canvas, editorial serif headlines over a quiet sans body, two-up cards,
horizontal feature carousel, 50/50 split panel, portrait video row, 10-tile strip, big-number
section, newsletter, 4-column footer + artwork.

**What we replace:** all Warby content, imagery, logo and commerce behaviour (cart, wishlist,
try-on, insurance checker). No Warby image or logo ships.

**Locked decisions (2026-11-15):**

| Decision | Choice |
|---|---|
| Positioning | Patient-first hospital site; staff console as a secondary section |
| Palette | Cream canvas + Aurelia deep pine + champagne highlight |
| Fonts | Warby's real woff2 files (ABC Social + Ivory LL), copied from the TaskOrbit build. Licence risk acknowledged by the owner. |
| Callback form | Saved to a new `medislot_leads` table via `/api/leads`, with a success state |
| Newsletter | Removed for now (no email provider) |

---

## 1. Audience and positioning

Primary: **patients** of Aurelia Central Hospital — find a specialist, book, track status.
Secondary: **hospital staff** — the same site exposes the staff console (triage, shifts, records).

The homepage therefore reads as a hospital site with one product-proof section for staff,
not as a SaaS pricing page.

Tone: calm, precise, human. Short sentences. No "AI", no "revolutionary", no invented numbers.

---

## 2. Homepage sections

| # | Section | Height target @1440 | Purpose | Content | CTA |
|---|---|---|---|---|---|
| H | Header | 54 px sticky | Wayfinding + both logins | Mark + `Aurelia`; nav: Specialists, Departments, How it works, For hospital teams, Visit us; search icon; `Patient login` outline pill; `Book a visit` solid pill | /login?portal=patient, /register |
| 1 | Hero | 885 px | Promise + booking | Eyebrow `Aurelia Central Hospital · Dhaka`; headline **Care, without the wait.**; sub `Find the right specialist, pick a slot that fits your day, and get confirmed — no phone queue, no guesswork.`; 2 pills; glass strip with 4 benefits | `Book an appointment` → /register · `See how it works` → #how |
| 2 | Two-up | 708 px | Two halves of the promise | (a) **The right specialist, not a waiting room.** (b) **Every visit, tracked from request to confirmation.** Each with one white pill | Find a specialist · See your visits |
| 3 | Feature carousel | 683 px | Breadth of the product | Heading **Everything you need for a visit** + `see it live`; 8 cards (below) | Explore |
| 4 | Staff split | 708 px | Product proof for the front desk | Pine panel, 50/50 with UI image. Eyebrow `For hospital teams`; **The front desk, finally calm.**; copy; pill | Open the staff console → /login?portal=admin |
| 5 | See it in action | 828 px | Proof through motion | Heading **See it in action**; 4 portrait cards: Booking, Triage, Capacity, Notifications | Watch |
| 6 | Departments | 476 px | Service discovery | Heading **Care across departments**; 10 cream tiles with line icons | tile → /register?specialty=… |
| 7 | Visit us | 738 px | Trust + practical info | Left: hospital photo, address, hours, directions. Right: cream panel, callback form (name, phone, department, preferred day) | Request a call back |
| 8 | By the numbers | 571 px | One memorable claim | Eyebrow `By the numbers`; giant **0**; caption `appointment requests lost between the front desk and the patient.`; 3-shot UI collage | See how it works |
| F | Footer | ~1400 px | Navigation + help + legal | 4 columns, help panel (phone / email / hours), legal row, brand illustration strip | — |

Newsletter is dropped until an email provider exists.

Dropped from the reference on purpose: app-store promo (no native app), Buy-a-Pair equivalent
(would need a real programme), insurance checker (no insurer integration).

---

## 3. Feature carousel — 8 cards

All eight already exist in the product; nothing is invented.

| # | Title | One-line copy | Visual |
|---|---|---|---|
| 1 | Specialist directory | Browse by department, experience and qualifications. | UI crop: doctor grid |
| 2 | Seven-day calendar | Morning, afternoon and evening slots across the next week. | UI crop: date strip |
| 3 | One-tap request | Pick a slot, add a reason, send the request. | UI crop: slot grid + summary |
| 4 | Live status | Pending, confirmed or cancelled — always current. | UI crop: status pill row |
| 5 | Instant notifications | Every status change reaches the patient immediately. | UI crop: bell panel |
| 6 | Visit slip | Doctor, date, time, venue and status in one card. | UI crop: ticket modal |
| 7 | Visit history | Every past request, filterable by status. | UI crop: My visits |
| 8 | Secure account | Private patient record behind a signed-in account. | Icon / account panel |

Section title treatment: "Everything you need for a **visit**" with the last word in accent
colour, matching the reference's blue-accent headline.

---

## 4. Login page

Two-column, same design language:

- **Left (55%)** — hospital photo or the hero poster, pine overlay, short line:
  *“Care starts with a calmer front desk.”* + small Aurelia lockup. Reuse the hero video only
  if it stays under ~3 MB; otherwise a still.
- **Right (45%)** — cream surface, serif **Welcome back.**
  - Segmented control: `Patient` / `Hospital staff` (keeps `?portal=` behaviour).
  - Email + password with show/hide, pill inputs, solid pine submit.
  - Patient: “New patient? Create an account.”
  - Staff: existing demo-credential helper + autofill, exactly as today.
  - Small “← Back to Aurelia” link.
- Keep all current auth logic, redirects and demo email. No new routes.

No extra video needed; reuse the hero poster.

---

## 5. Video briefs (what to shoot / record)

### V1 — Hero background (required)

| | |
|---|---|
| Desktop | 1920×1080, 24–30 fps, H.264 MP4, 8–12 s, muted, seamless loop, ≤8 MB |
| Mobile | 1080×1920 (own framing, not a crop), same edit, ≤5 MB |
| Poster | 1920×1080 + 1080×1920, frame at 1 s and 6 s, WebP/JPG |
| Safe area | Keep the centre 55% low-detail: the headline and two pills sit there |
| No | baked-in text, logos, cursor, UI chrome, audio |

Shot list (if filming): 0–3 s hospital reception / corridor, 3–6 s doctor with a patient,
6–9 s close-up of a phone showing a confirmed appointment, 9–12 s back to reception.
If filming is not possible, a product-only hero is acceptable: a slow push-in on the patient
booking flow on a phone, shot on a clean background.

### V2 — See it in action (4 portrait clips)

| | |
|---|---|
| Size | 1080×1920 preferred (540×960 acceptable), 30 fps, MP4, 6–10 s, muted, ≤4 MB each |
| Style | Screen recording of the live app, no browser chrome, no dev badge |
| Loop | Start and end on the same screen; no cursor jitter; 2× device scale for crispness |

1. **Booking** — doctor card → date strip → slot → reason → submit → success banner.
2. **Triage** — pending queue → open encounter → Confirm & lock → status flips to confirmed.
3. **Capacity** — doctor roster → utilisation ring → 7-day slot matrix → booked/free.
4. **Notifications** — bell badge → notification list → My visits shows confirmed.

These four can be recorded automatically from the running app; they do not require filming.
If they are made manually, use realistic demo data and hide the Next.js dev indicator.

### Optional

- Login left panel loop (reuse V1, no separate shoot).
- Staff split hover loop — **not** recommended; a still keeps the page light.

---

## 6. Image / asset matrix

| Asset | Size | Source |
|---|---|---|
| Two-up card A (patient) | 1440×1440 | UI composition, we produce |
| Two-up card B (visit status) | 1440×1440 | UI composition, we produce |
| 8 feature thumbnails | 4:3, ~944×708 | UI crops, we produce |
| Staff split image | square, ~1200×1200 | Admin UI, we produce |
| 10 department icons | SVG | Phosphor line icons |
| Hospital photo (Visit + login) | 708×738 / 1600×1200 | **needs a real photo** (exterior or reception) |
| Numbers collage | 715×618 | 3 UI crops, we produce |
| Footer artwork | wide SVG ~1440×720 | we design a line-art hospital/Dhaka strip |

If no hospital photo is available, use a neutral architectural placeholder only until the real
photo arrives — do not ship a generic stock image as if it were the hospital.

---

## 7. Content rules

- Every feature shown must exist in the current app. No pricing, testimonials, ratings,
  insurer logos, app-store badges or patient counts.
- Numbers: only `0` (lost requests) is allowed; avoid claims we cannot verify from the app.
- Department list must match the doctors table: Cardiology, Pediatrics, Dentistry, Neurology,
  Dermatology, Orthopedics, ENT, Ophthalmology, Gynecology, General Medicine — trim to the
  specialisations actually present, plus a `General Medicine` fallback.
- Copy is bilingual-ready: keep strings in a `content/landing.ts` object, not inline.

---

## 8. Open decisions

1. **Positioning** — patient-first hospital site (recommended) or a product site selling the
   system to other hospitals? This changes the staff split and the Visit form.
2. **Palette** — **locked:** cream + pine + champagne.
3. **Fonts** — Instrument Sans/Serif (free, already loaded) or licensed Warby fonts?
4. **Hero footage** — live-action hospital shoot, or product-only screen recording?
5. **Callback form** — store leads in a new `medislot_leads` table + email, or a simple
   `mailto:` / WhatsApp link for now?
6. **Newsletter** — keep with a real provider, or drop the section until there is one?
7. **Departments** — which specialisations should be public?
