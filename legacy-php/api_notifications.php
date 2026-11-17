<?php
// MediSlot - api_notifications.php (Step 2)
// Patient only. Two actions:
//
//   GET  ?action=list  -> {"unread": N, "notifications": [{"id","message","is_read","created_at"}, ...]}
//                        newest first, max 20. Does NOT mark anything read.
//   POST ?action=read  -> marks ALL of this patient's notifications read
//                        (UPDATE is_read = 1) and returns {"unread": 0}.
//
// The bell in patient.php calls list first (to render), then POST read,
// so opening the bell shows the list and clears the badge to 0.
// Notification CREATION is not done here — that is the assistant side (Step 3).
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'patient') {
    http_response_code(403);
    echo json_encode(['error' => 'Not authorized.']);
    exit;
}

require_once 'db.php';

$userId = (int)$_SESSION['user_id'];
$action = $_GET['action'] ?? 'list';

if ($action === 'read' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$userId]);
    echo json_encode(['unread' => 0]);
    exit;
}

if ($action === 'list') {
    $stmt = $pdo->prepare('SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20');
    $stmt->execute([$userId]);
    $list = $stmt->fetchAll();

    $stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$userId]);
    $unread = (int)$stmt->fetchColumn();

    echo json_encode(['unread' => $unread, 'notifications' => $list]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Unknown action. Use ?action=list or POST ?action=read.']);
