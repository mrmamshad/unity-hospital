#!/usr/bin/env python3
"""Build the Medislot / Terafab hospital appointment lab report (report.html).

Same structure as the previous project's lab report:
  problem → objectives → spec → use cases → database → ER diagram →
  source code → screenshots. The cover page is intentionally omitted;
  print it separately and bind it as page 1.

Usage:
  python3 presentation/report/build_report.py
  node /tmp/opencode/print_medislot_report.mjs   # A4 PDF with page numbers
"""
import html
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
STYLE = (HERE / "_style.html").read_text()
SHOTS = HERE / "shots"


def read(path: str, start: int = 1, end: int | None = None) -> str:
    lines = (REPO / path).read_text().splitlines()
    if end is None:
        end = len(lines)
    return "\n".join(lines[start - 1 : end])


def esc(t: str) -> str:
    return html.escape(t, quote=False)


def code_block(title: str, path: str, start: int = 1, end: int | None = None, note: str = "") -> str:
    body = esc(read(path, start, end))
    note_html = f'<p class="code-note">{esc(note)}</p>' if note else ""
    return f"""
    <div class="listing">
      <div class="listing-head"><span class="listing-file">{esc(title)}</span>
      <span class="listing-path">{esc(path)}</span></div>
      {note_html}
      <pre class="code">{body}</pre>
    </div>"""


# -------------------------------------------------------------- use case svg --
def use_case_svg() -> str:
    parts = ['<svg viewBox="0 0 1000 620" xmlns="http://www.w3.org/2000/svg" font-family="Liberation Sans, Arial, sans-serif">']
    parts.append('<rect x="150" y="26" width="700" height="568" rx="6" fill="#fcfcfd" stroke="#333" stroke-width="1.1"/>')
    parts.append('<text x="500" y="48" font-size="13.5" font-weight="bold" text-anchor="middle">Unity Hospital — Hospital Appointment Management</text>')

    def actor(x, y, label):
        out = [f'<circle cx="{x}" cy="{y}" r="10" fill="none" stroke="#111" stroke-width="1.3"/>',
               f'<line x1="{x}" y1="{y+10}" x2="{x}" y2="{y+42}" stroke="#111" stroke-width="1.3"/>',
               f'<line x1="{x-16}" y1="{y+22}" x2="{x+16}" y2="{y+22}" stroke="#111" stroke-width="1.3"/>',
               f'<line x1="{x}" y1="{y+42}" x2="{x-14}" y2="{y+66}" stroke="#111" stroke-width="1.3"/>',
               f'<line x1="{x}" y1="{y+42}" x2="{x+14}" y2="{y+66}" stroke="#111" stroke-width="1.3"/>',
               f'<text x="{x}" y="{y+84}" font-size="12" text-anchor="middle">{esc(label)}</text>']
        return "".join(out)

    def uc(cx, cy, label, w=214, fill="#eef3fd"):
        return (f'<ellipse cx="{cx}" cy="{cy}" rx="{w//2}" ry="22" fill="{fill}" stroke="#3b5998" stroke-width="1"/>'
                f'<text x="{cx}" y="{cy+4}" font-size="11.5" text-anchor="middle">{esc(label)}</text>')

    parts.append(actor(70, 130, "Visitor"))
    parts.append(actor(70, 360, "Patient"))
    parts.append(actor(930, 300, "Front desk"))

    # visitor use cases
    for i, label in enumerate(["View landing & specialists", "Create account"]):
        y = 120 + i * 62
        parts.append(uc(320, y, label))
        parts.append(f'<line x1="84" y1="{144+i*40}" x2="213" y2="{y}" stroke="#666" stroke-width="0.9"/>')

    parts.append(uc(320, 244, "Register / sign in", w=190, fill="#e8f0e9"))
    parts.append('<line x1="84" y1="344" x2="228" y2="248" stroke="#666" stroke-width="0.9"/>')

    # patient use cases
    patient_ucs = [
        "Browse specialists & free slots",
        "Pick a date & slot",
        "Submit appointment request",
        "Track status in My visits",
        "Receive notifications",
    ]
    for i, label in enumerate(patient_ucs):
        y = 318 + i * 54
        parts.append(uc(320, y, label))
        parts.append(f'<line x1="84" y1="392" x2="228" y2="{y}" stroke="#666" stroke-width="0.9"/>')

    # assistant use cases
    desk_ucs = [
        "Review triage queue",
        "Confirm / decline request",
        "View doctor shifts & capacity",
        "Open patient directory",
        "Read capacity & demand",
    ]
    for i, label in enumerate(desk_ucs):
        y = 200 + i * 62
        parts.append(uc(682, y, label))
        parts.append(f'<line x1="916" y1="316" x2="790" y2="{y}" stroke="#666" stroke-width="0.9"/>')

    # desk auth link
    parts.append('<line x1="916" y1="268" x2="460" y2="248" stroke="#666" stroke-width="0.9" stroke-dasharray="4,3"/>')
    parts.append('<text x="500" y="610" font-size="10" text-anchor="middle" fill="#444">A slot is only locked after the front desk confirms&nbsp;&mdash;&nbsp;booking, confirm and cancel run as one database transaction.</text>')
    parts.append("</svg>")
    return "".join(parts)


# ------------------------------------------------------------------- er svg --
def er_svg() -> str:
    parts = ['<svg viewBox="0 0 760 520" xmlns="http://www.w3.org/2000/svg" font-family="Liberation Sans, Arial, sans-serif">']

    def box(x, y, w, title, fields, h=None):
        h = h or (48 + 15 * len(fields))
        out = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="#fcfcfd" stroke="#333" stroke-width="1.1"/>',
               f'<rect x="{x}" y="{y}" width="{w}" height="22" rx="5" fill="#eef1f7" stroke="#333" stroke-width="1.1"/>',
               f'<text x="{x+7}" y="{y+15}" font-size="11.5" font-weight="bold">{esc(title)}</text>']
        for i, f in enumerate(fields):
            out.append(f'<text x="{x+7}" y="{y+36+i*15}" font-size="10.5">{esc(f)}</text>')
        return "".join(out), h

    def link(points, label="", lx=0, ly=0):
        d = " ".join(f"{'M' if i == 0 else 'L'} {x} {y}" for i, (x, y) in enumerate(points))
        out = [f'<path d="{d}" fill="none" stroke="#555" stroke-width="0.9"/>']
        if label:
            out.append(f'<text x="{lx}" y="{ly}" font-size="10" fill="#555">{esc(label)}</text>')
        return "".join(out)

    parts.append(box(24, 30, 210, "medislot_users", ["PK id (uuid)", "name", "email (unique)", "password_hash (bcrypt)", "role: patient | assistant", "created_at"])[0])
    parts.append(box(530, 30, 210, "medislot_doctors", ["PK id (bigint)", "name", "specialization", "experience_years", "education", "photo_url"])[0])
    parts.append(box(530, 200, 210, "medislot_time_slots", ["PK id", "FK doctor_id →", "slot_date", "slot_time", "is_booked"])[0])
    parts.append(box(266, 200, 226, "medislot_appointments", ["PK id", "FK patient_id → users", "FK doctor_id → doctors", "FK slot_id → time_slots", "reason (<=500 chars)", "status: pending|confirmed|cancelled", "created_at"])[0])
    parts.append(box(24, 330, 210, "medislot_notifications", ["PK id", "FK user_id → users", "message", "is_read", "created_at"])[0])
    parts.append(box(530, 380, 210, "medislot_leads", ["PK id", "name / phone", "department / preferred_day", "note", "created_at · insert-only by anon"])[0])

    parts.append(link([(129, 168), (129, 330)], "1 : N · visits & messages", 136, 260))
    parts.append(link([(234, 99), (250, 99), (250, 240), (266, 240)], "", 0, 0))
    parts.append('<text x="246" y="220" font-size="10" text-anchor="end" fill="#555">1 : N</text>')
    parts.append(link([(379, 200), (379, 178), (635, 178), (635, 168)], "N : 1 · each request has a doctor", 396, 172))
    parts.append(link([(635, 168), (635, 200)], "1 : N · published slots", 544, 188))
    parts.append(link([(530, 240), (492, 240)], "", 0, 0))
    parts.append('<text x="511" y="232" font-size="10" text-anchor="middle" fill="#555">1 : 1</text>')
    parts.append('<text x="380" y="508" font-size="10.5" text-anchor="middle" fill="#444">Every request touches three rows: one appointment, the slot it locks, and one notification to the patient.</text>')
    parts.append("</svg>")
    return "".join(parts)


# -------------------------------------------------------------------- tables --
TABLES = [
    ("medislot_users", "One account per person. Patients book; the role `assistant` is the hospital front desk.",
     [("id", "uuid · primary key"), ("name", "text · not null"), ("email", "text · not null, unique"),
      ("password_hash", "text · bcrypt (cost 10), never the plaintext"), ("role", "text · patient | assistant"),
      ("created_at", "timestamp · default now()")]),
    ("medislot_doctors", "Specialists published on the landing and in the portals (6 in the seed data).",
     [("id", "bigint · primary key"), ("name", "text · not null"), ("specialization", "text"),
      ("experience_years", "integer"), ("education", "text"), ("photo_url", "text · nullable")]),
    ("medislot_time_slots", "Published consultation times. 252 rows live — a 7-day cycle, 42 per specialist.",
     [("id", "bigint · primary key"), ("doctor_id", "bigint · FK → medislot_doctors"),
      ("slot_date", "date · published day"), ("slot_time", "time · e.g. 10:00:00"),
      ("is_booked", "boolean · default false; flips true when a request is booked/confirmed")]),
    ("medislot_appointments", "One appointment request. A slot can belong to at most one confirmed request.",
     [("id", "bigint · primary key (APT token)"), ("patient_id", "uuid · FK → medislot_users"),
      ("doctor_id", "bigint · FK → medislot_doctors"), ("slot_id", "bigint · FK → medislot_time_slots"),
      ("reason", "text · nullable, capped at 500 chars by the API"),
      ("status", "text · pending | confirmed | cancelled"), ("created_at", "timestamp · default now()")]),
    ("medislot_notifications", "In-app messages written for the patient on every status change.",
     [("id", "bigint · primary key"), ("user_id", "uuid · FK → medislot_users"),
      ("message", "text"), ("is_read", "boolean · default false"), ("created_at", "timestamp")]),
    ("medislot_leads", "Landing callback requests. Anonymous visitors may insert; no anonymous reads.",
     [("id", "bigint · primary key"), ("name", "text · not null"), ("phone", "text · not null"),
      ("department", "text · default 'General Medicine'"), ("preferred_day", "text · default 'Any day'"),
      ("note", "text · nullable"), ("created_at", "timestamp · default now()")]),
]

def tables_html() -> str:
    out = []
    for name, desc, cols in TABLES:
        rows = "".join(f"<tr><td class='col-name'>{esc(c)}</td><td>{esc(t)}</td></tr>" for c, t in cols)
        out.append(f"""
            <div class="table-block">
              <p class="table-name">Table: {esc(name)}</p>
              <p class="table-desc">{esc(desc)}</p>
              <table class="schema"><thead><tr><th>Column</th><th>Type / constraint</th></tr></thead>
              <tbody>{rows}</tbody></table>
            </div>""")
    return "".join(out)


# -------------------------------------------------------------- screenshots --
SHOT_LIST = [
    ("01-landing-hero.png", "Public landing — Unity Hospital brand over the hospital campus at dusk, with the two entry points (visitor and staff)."),
    ("02-landing-continuum.png", "The scroll-driven “care continuum”: Type I / II / III scale — from one visit to a lifetime of care."),
    ("03-register.png", "Create account — the patient sign-up page."),
    ("04-login.png", "Sign in — the visitor and staff portals share one form."),
    ("05-patient-booking.png", "Patient portal · Book a visit — specialists with specialty and experience, six available."),
    ("06-patient-slots.png", "Step 2 · Schedule — seven-day date strip and only the published free slots, with request summary on the right."),
    ("07-booking-summary.png", "Slot selected (Tue 17, 10:00) plus the consultation note; the summary locks before submission."),
    ("09-my-appointments.png", "My visits — the request goes out pending, with live status: the patient sees every decision as it lands."),
    ("10-admin-overview.png", "Staff console · triage dashboard: awaiting queue, confirmed, occupancy (<1%) and specialists on duty."),
    ("11-admin-shifts.png", "Doctor shifts — 7-day cycle capacity: 252 slots total, booked / free / occupancy per specialist."),
    ("12-admin-directory.png", "Patient directory — registered accounts with booking count and last confirmed visit."),
    ("13-admin-capacity.png", "Capacity & demand — consultations by date, department workload and department mix."),
]

def shots_html() -> str:
    out = []
    for f, cap in SHOT_LIST:
        narrow = ""
        if "landing" in f or "login" in f or "register" in f:
            narrow = " shot--form"
        out.append(f"""
            <figure class="shot{narrow}">
              <img src="shots/{f}" alt="{esc(cap)}" />
              <figcaption>{esc(cap)}</figcaption>
            </figure>""")
    return "".join(out)


# ------------------------------------------------------------------- listings --
CODES = [
    ("Session & password security", "src/lib/auth.ts", 1, None,
     "bcryptjs hashing plus a jose JWT — HS256, 7-day expiry, httpOnly/SameSite cookie, verified on every request."),
    ("Database client", "src/lib/supabase.ts", 1, None,
     "Server-side client with no persistent auth session: the app identifies users by its own JWT, not by Supabase Auth."),
    ("API · register", "src/app/api/auth/register/route.ts", 1, None,
     "Validates input, rejects an existing email, inserts the hashed password and starts the session."),
    ("API · sign in", "src/app/api/auth/login/route.ts", 1, None,
     "bcrypt verification (·$2y$ compatible·) and role-aware redirect: patient → /patient, assistant → /admin."),
    ("API · slot feed", "src/app/api/slots/route.ts", 1, None,
     "Only signed-in callers may read the published slots for a doctor on a date."),
    ("API · book a visit", "src/app/api/appointments/book/route.ts", 1, None,
     "Patients only. The request goes through a stored procedure — booking is one database transaction, so a slot cannot be double-booked."),
    ("API · my visits", "src/app/api/appointments/my/route.ts", 1, None,
     "The patient reads their own requests with live status and the pieces the desk can change."),
    ("API · front-desk queue", "src/app/api/assistant/appointments/route.ts", 1, None,
     "Assistant-only, newest first; the same request rows, re-shaped for the console UI."),
    ("API · confirm", "src/app/api/assistant/confirm/route.ts", 1, None,
     "Locks the appointment, writes a notification to the patient, all atomically."),
    ("API · decline", "src/app/api/assistant/cancel/route.ts", 1, None,
     "Frees the slot and notifies the patient — again one transaction."),
    ("API · console overview & KPIs", "src/app/api/admin/overview/route.ts", 1, None,
     "One query set for the triage dashboard: KPIs, trend series, department distribution, doctor capacity."),
    ("Routing · landing rewrite", "next.config.ts", 1, None,
     "Root request rewritten to the static Unity Hospital landing before any page handling — one product, two surfaces."),
    ("Leads table + RLS", "docs/medislot_leads.sql", 1, None,
     "Anonymous visitors may insert a callback request; nobody else can read any row."),
]


def codes_html() -> str:
    return "\n".join(code_block(t, p, s, e, n) for t, p, s, e, n in CODES)

# ------------------------------------------------------------------ document --
USE_CASES = [
    ("1", "View landing & specialists", "Visitor",
     "Opens the homepage.",
     "Reads the product story, the appointment-system copy and the list of specialists (from medislot_doctors)."),
    ("2", "Create account", "Visitor",
     "Opens /register.",
     "Name, email, password. Errors on invalid email, short password, duplicate email, mismatch."),
    ("3", "Sign in", "Visitor",
     "Opens /login.",
     "bcrypt check; role routes them: patient → Book a visit, assistant → Hospital console."),
    ("4", "Browse specialists & slots", "Patient",
     "Signed in as patient.",
     "Picks a specialty, a specialist, sees only the dates and times the hospital has published."),
    ("5", "Submit appointment request", "Patient",
     "A free slot selected; optional reason (≤500 chars).",
     "One atomic transaction: the slot becomes booked, the request is pending, and the dashboard reflects it immediately."),
    ("6", "Track status & get notified", "Patient",
     "Any time after a request.",
     "My visits shows pending / confirmed / cancelled live; notifications arrive on both confirm and decline."),
    ("7", "Review triage queue", "Front desk",
     "Signed in as assistant.",
     "Sees pending requests with token, patient, specialty, slot, complaint and search/filter."),
    ("8", "Confirm or decline", "Front desk",
     "A pending request is selected.",
     "Confirm locks slot + notifies; decline frees slot + notifies. Slot stays unique either way."),
    ("9", "View shifts, capacity & directory", "Front desk",
     "Clinical operations nav.",
     "Doctor shifts (42 slots each over 7 days), occupancy, consultations by date, department mix, patient history."),
]

def use_cases_html() -> str:
    rows = "".join(
        f"<tr><td class='col-name'>{n}</td><td><b>{esc(name)}</b></td><td>{esc(actor)}</td><td>{esc(when)}</td><td>{esc(what)}</td></tr>"
        for n, name, actor, when, what in USE_CASES)
    return f"""
    <table class="schema"><thead><tr><th>#</th><th>Use case</th><th>Actor</th><th>When</th><th>What happens</th></tr></thead>
    <tbody>{rows}</tbody></table>"""


html_doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Unity Hospital — Software Engineering Lab Report</title>
{STYLE}</head>
<body>

<h1 class="report-title">Problem: Unity Hospital — Hospital Appointment Management System</h1>

<h2>Problem Definition</h2>
<p>A typical clinic books patients by phone. The front desk answers calls all day, writes slots on
paper slips, double-books a doctor when two callers ask for the same time, and has no picture of
which specialist actually has a free hour. A patient calls five times trying to reach a cardiology
slot; the desk says "we will call you back" and its note is lost. The hospital cannot even answer
"how many of tomorrow's slots are taken" without counting by hand.</p>
<p><b>Unity Hospital</b> is a web-based hospital appointment management system that replaces that workflow
with one record: a public landing that explains the product and publishes real specialists and
slots, a patient portal for registration and booking, a front-desk console that triages and
confirms every request, live capacity reporting, and in-app notifications for both confirmation and
decline. It is built and deployed as a real product — <b>https://buildcamp.site</b> — not a
mock-up.</p>

<h2>Objectives</h2>
<ul>
  <li>Let a patient see the experts and the times that are actually free, pick a date and a slot,
      and send one request — no phone calls.</li>
  <li>Give the front desk a single triage queue: confirm or decline with every decision written
      back to the same rows the patient reads.</li>
  <li>Make double booking impossible by construction: booking, confirming and declining each run as
      one atomic stored procedure, never as two separate writes.</li>
  <li>Give operations a capacity picture: per-specialist occupancy over a rolling 7-day cycle, plus
      consultations by date and department mix.</li>
  <li>Keep one patient record per account — every request, every status change and every
      notification belongs to the same identity.</li>
  <li>Ship it: HTTPS, a real domain, process supervision, automatic restarts and a managed
      PostgreSQL database.</li>
</ul>

<h2>System Specification</h2>
<p class="kv"><b>Application type</b>Web application (three surfaces: public landing, patient portal, staff console)</p>
<p class="kv"><b>Framework</b>Next.js, App Router · TypeScript, Tailwind CSS, shadcn-style components</p>
<p class="kv"><b>Landing</b>Static Unity Hospital HTML/CSS/JS, rewritten at <code>/</code> by Next.js</p>
<p class="kv"><b>Server</b>Next.js API routes (Node) · jose JWT (HS256, 7-day, httpOnly session cookie)</p>
<p class="kv"><b>AuthZ / hashes</b>bcryptjs at cost 10 · server-side role check on every API route</p>
<p class="kv"><b>Database</b>Supabase-hosted PostgreSQL · row-level security · PL/pgSQL stored procedures</p>
<p class="kv"><b>Deployment</b>Ubuntu VM · systemd (<code>terafab.service</code> on 127.0.0.1:3001) · Nginx TLS · Cloudflare</p>
<p class="kv"><b>Roles</b>patient · assistant (hospital front desk)</p>
<p class="kv"><b>Live data on report date</b>6 specialists · 252 published slots (7-day cycle) · 5 registered patients · 4 appointment requests</p>
<p class="kv"><b>Verified at</b>http://localhost:3000 and https://buildcamp.site (both exercised end-to-end)</p>

<h2>Project Overview</h2>
<p>The product splits into the booking surfaces and the data that binds them. A <b>patient</b>
(Table 5) registers, picks a specialist and a free slot, and sends a request — a single atomic
write. The <b>front desk</b> sees every request in one queue with per-request confirm / decline; a
confirmation locks the slot and tells the patient, a decline frees the slot and tells the patient.
The <b>console</b> also reads the same data for KPIs: pending / confirmed / occupancy (<b>&lt;1%</b>
when measured), per-specialist booked / free counts, daily trend and department distribution.
A public <b>landing</b> presents the same product to visitors and feeds the lead table from
callback requests. Appendix screenshots show every surface running on the live database.</p>

<div class="section">
<h1 class="report-title">Analysis — Use Case Model</h1>
<h2>Use case diagram</h2>
<div class="fig">{use_case_svg()}<figcaption>Fig. 1 — Use cases. A request is only a draft until the front desk acts on it.</figcaption></div>
<h2>Use case descriptions</h2>
{use_cases_html()}
</div>

<div class="section">
<h1 class="report-title">Design — Data Model</h1>
<h2>Tables</h2>
{tables_html()}
<h2>Stored procedures</h2>
<p>Three PL/pgSQL functions own every write on an appointment, so two writers can never produce a
double booking or a lost update. They run as one transaction: reads the current state, writes the
change, writes the notification, commits.</p>
<div class="table-block">
  <p class="table-name">medislot_book_appointment(p_patient_id, p_doctor_id, p_slot_id, p_reason)</p>
  <p class="table-desc">Insert the request with status <i>pending</i> and mark the slot booked. Any
  conflict — slot already taken, same patient double-booking the day — is rejected inside the
  transaction. Called by <code>/api/appointments/book</code>.</p>
</div>
<div class="table-block">
  <p class="table-name">medislot_confirm_appointment(p_appointment_id)</p>
  <p class="table-desc">Set status <i>confirmed</i> and write a notification row to the patient.
  Called by <code>/api/assistant/confirm</code>.</p>
</div>
<div class="table-block">
  <p class="table-name">medislot_cancel_appointment(p_appointment_id)</p>
  <p class="table-desc">Set status <i>cancelled</i>, mark the slot free again, and notify the
  patient. Called by <code>/api/assistant/cancel</code>.</p>
</div>
<h2>Row-level security</h2>
<p>The anonymous insert-only policy on <code>medislot_leads</code> is the only anonymous write
path: a visitor can submit a callback request, but nobody can read any lead. Every other read/write
is a role-checked API call on behalf of the signed-in account — the database itself is the
authoritative barrier.</p>
<h2>ER diagram</h2>
<div class="fig">{er_svg()}<figcaption>Fig. 2 — Entity relationships. One request = three rows: appointment, slot, notification.</figcaption></div>
</div>

<div class="section">
<h1 class="report-title">Implementation</h1>
<p>Source listings are complete files except where noted. The two large client components —
<code>src/components/AdminPortal.tsx</code> (hospital console) and
<code>src/components/PatientPortal.tsx</code> (booking UI) — render on top of the APIs listed and
are omitted for print; their screenshots are in the appendix.</p>
{codes_html()}
</div>

<div class="section">
<h1 class="report-title">Appendix — Screenshots</h1>
{shots_html()}
</div>

</body></html>"""

(HERE / "report.html").write_text(html_doc)
print(f"wrote {HERE / 'report.html'} ({len(html_doc)/1024:.0f} KB)")
