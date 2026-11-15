MediSlot — Hospital Appointment Management System
================================================
HTML, CSS, vanilla JavaScript, PHP (PDO) and MySQL only.
No frameworks, no npm, no build step.

Requirements
------------
- XAMPP (Apache + MySQL + PHP)
- A browser

Setup
-----
1. Copy the whole "medislot" folder to:
   C:\xampp\htdocs\medislot
2. Open XAMPP Control Panel and start Apache and MySQL.
3. Open phpMyAdmin (http://localhost/phpmyadmin).
   database.sql creates the database itself, so just go to the
   Import tab, choose database.sql and click Go.
   This creates the database "medislot_db" with the tables
   users, doctors, time_slots, appointments, notifications,
   plus 1 assistant account, 6 doctors and time slots for
   the next 7 days (10:00 AM - 1:00 PM, 30-minute slots).
4. Open http://localhost/medislot/login.php
5. Log in as the assistant:
   Email:    assistant@medislot.com
   Password: 123456
   ...or click "Register as a patient" to create a patient
   account (registration is patient-only).

How to test the full flow
--------------------------
1. Register a patient, then log in (you land on patient.php).
2. Pick a doctor, a date and a free time slot, add a reason,
   and click "Book an appointment". You should see:
   "Request sent. Waiting for confirmation."
   The appointment is "pending" and the slot is NOT booked yet.
3. Log out, then log in as the assistant (above).
   On assistant.php you see the request under Pending.
4. Click Confirm. The appointment becomes "confirmed", the
   slot becomes booked, and the patient gets a notification.
   (If the slot is already booked you get "Slot not available".)
5. Log out, log in as the patient again. Click the bell:
   the notification appears ("... is confirmed.") and
   My Appointments shows the status as confirmed.
6. Log in as the assistant again and click Cancel on that
   appointment. The patient gets a cancel notification and
   the slot becomes free again (a patient can book it again).

Notes
-----
- A patient cannot request the same slot twice while an
  earlier request for it is still pending or confirmed.
  After a cancellation the same slot can be booked again.
- Only patients can open patient.php and only the assistant
  can open assistant.php. Other users are sent to login.php.
