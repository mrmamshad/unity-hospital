-- MediSlot — database.sql (Step 1)
-- Import in phpMyAdmin (or: mysql -u root < database.sql)
-- Time slots: for EACH doctor, the NEXT 7 days (CURDATE()+1 .. CURDATE()+7),
-- 10:00 AM – 1:00 PM, 30-minute slots (10:00, 10:30, 11:00, 11:30, 12:00, 12:30).
-- 6 doctors x 7 days x 6 slots = 252 time_slots rows. is_booked = 0 for all.

CREATE DATABASE IF NOT EXISTS medislot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medislot_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient','assistant') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  experience_years INT NOT NULL,
  education VARCHAR(255) NOT NULL,
  photo_url VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  is_booked TINYINT NOT NULL DEFAULT 0,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  slot_id INT NOT NULL,
  reason TEXT NULL,
  status ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed: assistant account (password 123456, stored as a password_hash — never plaintext)
INSERT INTO users (name, email, password_hash, role) VALUES
('Assistant', 'assistant@medislot.com', '$2y$10$MEqEeR38T2SmOSNCujP7ku2TIWVxeecYQvrOc/zi8V5IOEW.r6Lj2', 'assistant');

-- Seed: 6 doctors across 4 specializations (Cardiology x2, Pediatrics x2, Dentistry x1, Neurology x1)
INSERT INTO doctors (name, specialization, experience_years, education, photo_url) VALUES ('Dr. Robert Chen', 'Cardiology', 15, 'MD Cardiology, Harvard Medical School', NULL);
INSERT INTO doctors (name, specialization, experience_years, education, photo_url) VALUES ('Dr. Sarah Mitchell', 'Cardiology', 9, 'MD, MBBS — Cardiology Fellowship, Mayo Clinic', NULL);
INSERT INTO doctors (name, specialization, experience_years, education, photo_url) VALUES ('Dr. Amanda Clara', 'Pediatrics', 12, 'PhD in Clinical Psychology, UCLA', NULL);
INSERT INTO doctors (name, specialization, experience_years, education, photo_url) VALUES ('Dr. Jason Shatsky', 'Pediatrics', 10, 'MBBS, MD Pediatrics', NULL);
INSERT INTO doctors (name, specialization, experience_years, education, photo_url) VALUES ('Dr. Emily Davis', 'Dentistry', 8, 'DDS, University of California', NULL);
INSERT INTO doctors (name, specialization, experience_years, education, photo_url) VALUES ('Dr. James Wilson', 'Neurology', 14, 'MD Neurology, Johns Hopkins University', NULL);

-- Seed: time slots — 6 doctors x 7 days x 6 slots = 252 rows
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (2, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (3, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (4, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (5, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 4 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 6 DAY), '12:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '11:30:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:00:00', 0);
INSERT INTO time_slots (doctor_id, slot_date, slot_time, is_booked) VALUES (6, DATE_ADD(CURDATE(), INTERVAL 7 DAY), '12:30:00', 0);
