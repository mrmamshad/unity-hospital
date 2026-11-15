<?php
// MediSlot - api_slots.php (Step 2)
// Returns JSON: the given doctor's time slots for a given date.
// GET params: doctor_id (int), date (YYYY-MM-DD)
// Response: [{"id": 12, "slot_time": "10:00:00", "is_booked": 0}, ...]
// Patient only. Booked slots are included with is_booked=1 so the
// front end can render them greyed out and disabled.
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'patient') {
    http_response_code(403);
    echo json_encode(['error' => 'Not authorized.']);
    exit;
}

$doctorId = (int)($_GET['doctor_id'] ?? 0);
$date = $_GET['date'] ?? '';

if ($doctorId <= 0 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    http_response_code(400);
    echo json_encode(['error' => 'doctor_id and a valid date (YYYY-MM-DD) are required.']);
    exit;
}

require_once 'db.php';

$stmt = $pdo->prepare('SELECT id, slot_time, is_booked FROM time_slots WHERE doctor_id = ? AND slot_date = ? ORDER BY slot_time');
$stmt->execute([$doctorId, $date]);
$slots = $stmt->fetchAll();

echo json_encode($slots);
