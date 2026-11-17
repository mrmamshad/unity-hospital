# Unity Hospital — Clinical Appointment Management System
(Next.js 16 + Supabase PostgreSQL)

A modern, high-performance Hospital Appointment Management & Scheduling System built with **Next.js (App Router)** and **Supabase (PostgreSQL)**, featuring standard enterprise healthcare dashboards for both Patients and Hospital Administrators.

---

## 🚀 Portals & Access Points

| Portal | URL Route | Description |
|---|---|---|
| **Landing Page** | `/` | Specialist showcase, hospital features, direct portal entry |
| **Patient Login** | `/login?portal=patient` | Dedicated patient sign-in with registration shortcut |
| **Admin Login** | `/login?portal=admin` or `/admin/login` | Hospital staff/admin access (pre-configured with demo autofill) |
| **Patient Dashboard** | `/patient` | Specialist discovery, 7-day date strip, slot picker, appointment slips |
| **Admin Dashboard** | `/admin` | Real-time clinical console, KPI metrics, queue review, slot locking |

### 🔑 Demo Credentials:
- **Admin Email:** `assistant@medislot.com`
- **Admin Password:** `123456`
- **Patient Registration:** Open at `/register` (instant sign-up & auto-login)

---

## 🎨 Enterprise UI/UX Features

### 1. Hospital Admin Dashboard (`/admin`)
- **Live KPI Metrics:**
  - **Pending Reviews:** Instant urgent request count with confirmation trigger.
  - **Confirmed Bookings:** Confirmed and locked slots count.
  - **Total Requests:** All-time hospital records.
  - **Specialists on Duty:** Departmental doctors roster.
- **Queue Management & Filtering:**
  - Filter pills: `Pending Requests`, `All`, `Confirmed`, `Cancelled`.
  - Doctor Department Filter dropdown.
  - Instant live search by patient name, email, or symptoms.
- **Consultation Summary Modal:**
  - View full patient consultation request, notes, and actions in a clean modal dialog.
- **One-Click Action Controls:**
  - Atomically confirm or cancel requests with real-time feedback and patient notifications.

### 2. Patient Experience Portal (`/patient`)
- **Specialty Categories:** Fast icon-based filters (Cardiology, Pediatrics, Dentistry, Neurology).
- **Specialist Profile Cards:** Experience, qualifications, and department tags.
- **Interactive 7-Day Date Strip:** Visual 1-click day buttons (Mon 16, Tue 17, etc.).
- **30-Minute Consultation Matrix:** Morning and afternoon time slots with clear visual state indicators (Free in emerald, Booked in gray, Selected in navy).
- **Quick Reason Tags:** 1-click preset symptom tags (*Routine Health Checkup*, *Flu/Fever*, *Prescription Refill*, etc.).
- **Digital Appointment Slip Modal:** Clean downloadable/printable-style card showing doctor, hospital location, date, time, and live status badge.
- **Notification Drawer:** Live unread count badge with instant status alert history.

---

## 🛠️ Technology & Concurrency Architecture

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Lucide React, clsx, tailwind-merge (Zero runtime bloat, ultra-fast load time)
- **Database:** Supabase PostgreSQL (`https://kinbycyuzpqgjkkarptg.supabase.co`)
- **Concurrency & Atomicity:** PostgreSQL Stored Procedures (`SECURITY DEFINER`, `FOR UPDATE` row-locking):
  - `medislot_book_appointment`
  - `medislot_confirm_appointment`
  - `medislot_cancel_appointment`
- **Authentication:** HTTP-only JWT Session Cookies with bcrypt hashing

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build
npm run build
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
