# Terafab landing → Aurelia Health content swap

The homepage is an exact mirror of `terafab.ai` served from `public/terafab/`.
This document maps every block to Aurelia content and lists the media that must be
replaced. The layout, CSS, scroll behaviour and section heights stay untouched.

---

## 1. Current content inventory (as shipped)

| # | Section | Current copy | Media |
|---|---|---|---|
| 0 | Nav | `TERAFAB` logo · Watch Now · Join Us | logo SVG |
| 1 | Hero | “Terafab” / “The most epic chip-building effort ever” / Watch Now / Join Us | hero video (WebM), Tesla + SpaceX logos |
| 2 | Statement | “Terafab will close the gap between today's chip production and the future's demand — a future among the stars.” | — |
| 3 | Kardashev | “The Kardashev Scale” / “We aspire to be a galactic civilization” / Type I–III energy tiers | 2 scroll videos + 2 posters |
| 4 | Sun | “Harnessing the power of the Sun” / 3 bullets | desktop + mobile video, poster |
| 5 | Builders | “We're builders. We've done the impossible before.” / 12 proof points | Tesla + SpaceX logos |
| 6 | Factory | “A chip factory built for Earth and orbit” / “Combining logic, memory, and advanced packaging all under one roof” / Learn More | factory photo |
| 7 | Scaling | “Scaling for massive capacity” / 1 Billion robots · 10 Million tons/year · 1 TW+ solar | scale-comparison diagram |
| 8 | Output | “Production at terawatt scale” / 1 TW per year vs .5 TW US | scroll-scrubbed video + labels |
| 9 | Chips | “Producing chips for use on Earth and in space” / AI5 · AI6 · D3 · …and Beyond | 4 chip images |
| 10 | Space | “Space: the only truly scalable solution for the future of AI” / cost of compute on Earth vs space | orbital photo + “Always Sunny” badge |
| 11 | Mass driver | “The next step: lunar mass drivers” / Watch Now | lunar photo + 282 MB modal film |
| 12 | Footer | “Join us on our journey.” / Join Us / “Designed and built with Grok.” | footer canvas effect |

---

## 2. How to change it

The clone is static: edit `public/terafab/index.html`, replace files under
`public/terafab/assets/`, keep the class names and DOM structure. The scroll
animations read those classes and the `data-src-*` attributes, so:

- **Copy** — replace the text inside the existing tags.
- **Links** — change `href` values (`/login?portal=patient`, `/register`, `/login?portal=admin`).
- **Images** — overwrite the same filename (same aspect ratio) and the page updates.
- **Videos** — overwrite the same filename, or change `src` / `data-src-desktop` /
  `data-src-mobile`; keep the duration and aspect ratio close so the scroll mapping feels right.
- **Labels that float over the media** — change the text inside `.dlabel__txt`,
  `.osc-cap__n`, `.osc-cap__l`, `.osc-stat__*`; keep the classes.

Nothing in `styles.css` or `main.js` needs to change for a copy/media swap.

---

## 3. Aurelia content map

| # | Section | New copy | New media |
|---|---|---|---|
| 0 | Nav | AURELIA · Patient login · Book a visit | Aurelia mark + wordmark |
| 1 | Hero | **Aurelia** / “Care, without the wait.” / Book a visit / Staff sign in | cinematic hospital video; Aurelia + Central Hospital partner marks |
| 2 | Statement | “Aurelia closes the gap between a request and a confirmed visit — a future where care keeps up with life.” | — |
| 3 | Care Continuum (was Kardashev) | “The Care Continuum” / “From one visit to a lifetime record” / Type I: One visit · Type II: One record · Type III: One hospital | 2 scroll videos: phone → hospital → network |
| 4 | Morning (was Sun) | “Care that fits around your day” / Same-week appointments · Instant confirmation · A record you can trust | morning-light hospital video |
| 5 | Both sides (was Builders) | “Built by clinicians. Run by the front desk.” / patient proof · hospital proof | two wordmarks: PATIENTS / HOSPITAL TEAMS |
| 6 | One hospital | “A hospital built around one record” / “Appointments, specialists, slots and history — under one roof.” / See the console | hospital exterior / reception |
| 7 | Capacity | “Capacity you can see” / 252 weekly slots · 6 specialists · 7-day schedules | capacity chart or roster UI |
| 8 | Slots | “Every slot accounted for” / 1 appointment → 42 a week → 252 hospital slots | scroll-scrubbed calendar zoom |
| 9 | Four pillars (was Chips) | “Four pieces, one visit” / Booking · Triage · Records · Notifications | 4 UI/feature images |
| 10 | Bigger picture (was Space) | “A future without waiting rooms” / Today vs With Aurelia | hospital at night / city |
| 11 | Journey film (was Mass driver) | “From request to confirmed” / Watch the film | 30–45 s product film |
| 12 | Footer | “Care, without the wait.” / Book a visit / Aurelia Health | keep canvas effect |

### Suggested feature copy

- **Booking** — Pick a specialist, a date and a free slot; the request reaches the desk instantly.
- **Triage** — One queue, one click to confirm or decline; the slot locks automatically.
- **Records** — Every visit, note and status stays on one patient record.
- **Notifications** — The patient hears about every change, without calling the desk.

---

## 4. Videos to produce

All videos: muted, no burned-in text or logos, H.264 MP4 (hero also WebM),
1920×1080 for desktop, separate 1080×1920 for mobile where listed. Keep shots
slow and loop-friendly.

| File | Length | Content / AI prompt |
|---|---|---|
| `assets/hero/Terafab_Reveal_Edit_V7_web.webm` (replace, keep name) | 8–12 s | “Cinematic blue-hour aerial of a modern hospital campus, mist, slow push-in; cut to a warm reception with a nurse; close-up of a phone showing a confirmed appointment. Calm, human, no text.” |
| `assets/kardashev/Kardashev_T1-T2.mp4` + `.mobile.mp4` | 10–14 s | “Continuous macro-to-wide zoom: start on a phone booking calendar, pull back through a hospital window to the hospital exterior at dusk. Dark teal, cinematic, no text.” |
| `assets/kardashev/Kardashev_T2-T3.mp4` + `.mobile.mp4` | 10–14 s | “Continuous zoom out from one hospital building to a night city grid, departments connected by soft light lines, abstract network, dark blue, no text.” |
| `assets/sun/Sun_clean.mp4` + `.mobile.mp4` | 10–14 s | “Morning sunlight through hospital curtains, a nurse opens them, dust in the light; a patient’s phone lights up with a confirmation. Warm gold against deep shadow, slow, loopable.” |
| `assets/terafab/Terafab_size_comp_scrub.mp4` | 12–15 s | “Abstract calendar grid: one slot lights up, then the week fills with soft green light, camera slowly zooms from one slot to the full 7-day grid. Dark, minimal, no text.” |
| `assets/mass-driver/care-journey.mp4` (new) | 30–45 s | “A patient books at night; the front desk confirms on a large screen; the slot locks; a notification reaches the phone; next morning the patient arrives and is greeted by name. Warm, calm, no dialogue.” |

Mobile variants for hero, Kardashev and Sun should be framed 9:16, not cropped.
If that is not possible, the desktop file can be centre-cropped with ffmpeg.

### Which can be made without AI

- **Slots scrub** — screen recording / motion graphic of the real calendar.
- **Journey film** — screen recording of the booking → triage → notification flow.
- Everything else (hero, Kardashev, Sun) benefits from AI video.

---

## 5. Images and marks to replace

| File | Replacement |
|---|---|
| `assets/tesla-logo.svg` | “Aurelia Health” wordmark |
| `assets/spacex-logo.svg` | “Central Hospital” wordmark |
| `assets/terafab/2026_08_05_terafab_01.jpg` | hospital exterior / reception (16:9) |
| `assets/scaling/Scaling_clean.png` | capacity chart / roster infographic |
| `assets/chips/Chip_AI5.png` … `Chip_Beyond.png` | Booking / Triage / Records / Notifications cards |
| `assets/ai/home-hero.webp` | hospital at night / city (16:9) |
| `assets/ai/Always-Sunny.svg` | “Open 24/7” badge |
| `assets/mass-driver/Mass_drive_desktop.jpg` | poster frame from the journey film |
| `assets/og.png`, favicon | Aurelia favicon / share card |

The floating labels in the output section (`.osc-cap__n`, `.osc-stat__n`) also
change: `1 appointment` / `252 weekly slots` / `6 specialists`.

---

## 6. Implementation order

1. Copy swap + nav/CTAs + partner wordmarks (no media) — review the story.
2. Replace the static images (factory, chips, space, scaling) with Aurelia visuals.
3. Drop in the scroll videos (Kardashev, Sun, Slots) and posters.
4. Replace the mass-driver modal with the journey film.
5. Update the output labels and footer.
6. Mobile pass, performance pass, build + visual verification.

---

## 7. Scroll performance pass

Measured with a 1440×900 viewport while scrolling (headless Chromium, production build):

| Fix | Before | After |
|---|---|---|
| Nav frost | 4 stacked `backdrop-filter` layers, blur radius animated every scroll frame | 1 fixed 14 px layer |
| Hero film | 3840×2160 VP9, 52 s, always decoding | 1920×1080 H.264 + paused when off-screen |
| Posters / photos | 4.5 MB JPG, 2.5 MB PNG posters | WebP (72–400 KB) |
| Sun / output films | 1080p | 1440×810, lower bitrate |
| Frame time while scrolling | ~41–51 ms | **~17–19 ms (≈55–60 fps)** |
| Sun / output sections | ~25–30 ms | ~20–22 ms |

`public/terafab/perf.js` pauses the hero when it leaves the viewport. The dev
server (`next dev`) is always slower than `next build && next start`; use the
production build when judging smoothness.
