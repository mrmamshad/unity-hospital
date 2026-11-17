<?php
// MediSlot - assistant.php (Step 3: Appointment Requests — Confirm / Cancel)
// Session guard: assistant only.
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'assistant') {
    header('Location: login.php');
    exit;
}
require_once 'db.php';

$assistantName = $_SESSION['name'];

function displayDoctor($name) {
    $name = trim($name);
    if (stripos($name, 'Dr.') === 0 || stripos($name, 'Dr ') === 0) {
        return $name;
    }
    return 'Dr. ' . $name;
}

function fmtTime12($time) {
    return date('g:i A', strtotime($time));
}

function fmtDateLong($date) {
    return date('D, M j, Y', strtotime($date));
}

function redirectWith($params) {
    header('Location: assistant.php?' . http_build_query($params));
    exit;
}

// ---------- Flash messages (PRG: set on redirect, shown once) ----------
$msgMap = [
    'confirmed' => 'Appointment confirmed. The patient has been notified.',
    'cancelled' => 'Appointment cancelled. The slot is free again and the patient has been notified.',
];
$errMap = [
    'slot'       => 'Slot not available',
    'invalid'    => 'Invalid request.',
    'already'    => 'This appointment has already been cancelled.',
    'notpending' => 'Only a pending appointment can be confirmed.',
    'notcancellable' => 'This appointment cannot be cancelled.',
    'db'         => 'Something went wrong. Please try again.',
];
$flashMsg = (isset($_GET['msg']) && isset($msgMap[$_GET['msg']])) ? $msgMap[$_GET['msg']] : '';
$flashErr = (isset($_GET['err']) && isset($errMap[$_GET['err']])) ? $errMap[$_GET['err']] : '';

// ---------- Filter (default: Pending — the work queue) ----------
$allowedStatuses = ['all', 'pending', 'confirmed', 'cancelled'];
$filter = $_GET['status'] ?? 'pending';
if (!in_array($filter, $allowedStatuses, true)) {
    $filter = 'pending';
}

// ---------- Handle Confirm / Cancel (POST to this page) ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'], $_POST['appointment_id'])) {
    $appointmentId = (int)$_POST['appointment_id'];
    $action = $_POST['action'];
    $back = ['status' => $filter];

    if ($appointmentId <= 0 || !in_array($action, ['confirm', 'cancel'], true)) {
        redirectWith(array_merge($back, ['err' => 'invalid']));
    }

    try {
        $pdo->beginTransaction();

        // Lock the appointment row so two confirms cannot race.
        $stmt = $pdo->prepare('SELECT id, patient_id, doctor_id, slot_id, status FROM appointments WHERE id = ? FOR UPDATE');
        $stmt->execute([$appointmentId]);
        $appt = $stmt->fetch();
        if (!$appt) {
            $pdo->rollBack();
            redirectWith(array_merge($back, ['err' => 'invalid']));
        }

        // Doctor name + slot details for the notification message.
        $stmt = $pdo->prepare('SELECT name FROM doctors WHERE id = ?');
        $stmt->execute([(int)$appt['doctor_id']]);
        $doctorRow = $stmt->fetch();
        $doctorLabel = displayDoctor($doctorRow ? $doctorRow['name'] : 'Unknown');

        // Lock the slot row as well, so the is_booked check is atomic.
        $stmt = $pdo->prepare('SELECT slot_date, slot_time, is_booked FROM time_slots WHERE id = ? FOR UPDATE');
        $stmt->execute([(int)$appt['slot_id']]);
        $slot = $stmt->fetch();
        if (!$slot) {
            $pdo->rollBack();
            redirectWith(array_merge($back, ['err' => 'invalid']));
        }
        $dateStr = $slot['slot_date']; // YYYY-MM-DD, as stored
        $timeStr = fmtTime12($slot['slot_time']); // e.g. 10:00 AM

        if ($action === 'confirm') {
            if ($appt['status'] !== 'pending') {
                $pdo->rollBack();
                redirectWith(array_merge($back, ['err' => 'notpending']));
            }
            // The slot must still be free.
            if ((int)$slot['is_booked'] === 1) {
                $pdo->rollBack();
                redirectWith(array_merge($back, ['err' => 'slot']));
            }
            $stmt = $pdo->prepare("UPDATE appointments SET status = 'confirmed' WHERE id = ?");
            $stmt->execute([$appointmentId]);
            $stmt = $pdo->prepare('UPDATE time_slots SET is_booked = 1 WHERE id = ?');
            $stmt->execute([(int)$appt['slot_id']]);
            $message = "MediSlot: Your appointment with {$doctorLabel} on {$dateStr} at {$timeStr} is confirmed.";
            $stmt = $pdo->prepare('INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)');
            $stmt->execute([(int)$appt['patient_id'], $message]);
            $pdo->commit();
            redirectWith(array_merge($back, ['msg' => 'confirmed']));
        }

        // Cancel: allowed from pending or confirmed only.
        if ($appt['status'] === 'cancelled') {
            $pdo->rollBack();
            redirectWith(array_merge($back, ['err' => 'already']));
        }
        if (!in_array($appt['status'], ['pending', 'confirmed'], true)) {
            $pdo->rollBack();
            redirectWith(array_merge($back, ['err' => 'notcancellable']));
        }
        $stmt = $pdo->prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?");
        $stmt->execute([$appointmentId]);
        // Free the slot ONLY if no other confirmed appointment still uses it
        // (e.g. another patient was confirmed for this slot while this
        // request was pending). Blindly setting is_booked = 0 would free a
        // slot that still has a confirmed appointment on it.
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE slot_id = ? AND status = 'confirmed' AND id <> ?");
        $stmt->execute([(int)$appt['slot_id'], $appointmentId]);
        if ((int)$stmt->fetchColumn() === 0) {
            $stmt = $pdo->prepare('UPDATE time_slots SET is_booked = 0 WHERE id = ?');
            $stmt->execute([(int)$appt['slot_id']]);
        }
        $message = "MediSlot: Your appointment with {$doctorLabel} on {$dateStr} at {$timeStr} has been cancelled.";
        $stmt = $pdo->prepare('INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, 0)');
        $stmt->execute([(int)$appt['patient_id'], $message]);
        $pdo->commit();
        redirectWith(array_merge($back, ['msg' => 'cancelled']));
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        redirectWith(['status' => $filter, 'err' => 'db']);
    }
}

// ---------- Data: all appointment requests, newest first ----------
$sql = '
    SELECT a.id, a.status, a.reason, a.created_at,
           u.name AS patient_name, d.name AS doctor_name,
           t.slot_date, t.slot_time
    FROM appointments a
    JOIN users u ON u.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    JOIN time_slots t ON t.id = a.slot_id
';
$params = [];
if ($filter !== 'all') {
    $sql .= ' WHERE a.status = ?';
    $params[] = $filter;
}
$sql .= ' ORDER BY a.created_at DESC';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$requests = $stmt->fetchAll();

function tabUrl($status) {
    return 'assistant.php?status=' . urlencode($status);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediSlot - Appointment Requests</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="layout">
    <aside class="sidebar">
        <a class="logo" href="assistant.php">Medi<span>Slot</span></a>
        <nav>
            <a href="#requests" class="active">Appointment Requests</a>
            <a href="logout.php">Logout</a>
        </nav>
        <div class="side-user">
            <?php echo htmlspecialchars($assistantName); ?> (Assistant)<br>
            <a href="logout.php">Logout</a>
        </div>
    </aside>

    <main class="main">
        <div class="topbar">
            <h1>Appointment Requests</h1>
            <span class="patient-name"><?php echo htmlspecialchars($assistantName); ?></span>
        </div>

        <?php if ($flashMsg !== ''): ?>
            <div class="success"><?php echo htmlspecialchars($flashMsg); ?></div>
        <?php endif; ?>
        <?php if ($flashErr !== ''): ?>
            <div class="error"><?php echo htmlspecialchars($flashErr); ?></div>
        <?php endif; ?>

        <div class="tabs" id="statusTabs">
            <a class="tab<?php echo $filter === 'all' ? ' active' : ''; ?>" href="<?php echo htmlspecialchars(tabUrl('all')); ?>">All</a>
            <a class="tab<?php echo $filter === 'pending' ? ' active' : ''; ?>" href="<?php echo htmlspecialchars(tabUrl('pending')); ?>">Pending</a>
            <a class="tab<?php echo $filter === 'confirmed' ? ' active' : ''; ?>" href="<?php echo htmlspecialchars(tabUrl('confirmed')); ?>">Confirmed</a>
            <a class="tab<?php echo $filter === 'cancelled' ? ' active' : ''; ?>" href="<?php echo htmlspecialchars(tabUrl('cancelled')); ?>">Cancelled</a>
        </div>

        <section id="requests" class="card wide-card">
            <h2>Appointment Requests</h2>
            <?php if (empty($requests)): ?>
                <p class="muted">No appointment requests found for this filter.</p>
            <?php else: ?>
                <div class="table-wrap">
                    <table class="appt-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Doctor</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($requests as $r): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($r['patient_name']); ?></td>
                                    <td><?php echo htmlspecialchars(displayDoctor($r['doctor_name'])); ?></td>
                                    <td><?php echo htmlspecialchars(fmtDateLong($r['slot_date'])); ?></td>
                                    <td><?php echo htmlspecialchars(fmtTime12($r['slot_time'])); ?></td>
                                    <td><?php echo $r['reason'] !== null && $r['reason'] !== '' ? htmlspecialchars($r['reason']) : '<span class="muted">—</span>'; ?></td>
                                    <td><span class="badge badge-<?php echo htmlspecialchars($r['status']); ?>"><?php echo htmlspecialchars(ucfirst($r['status'])); ?></span></td>
                                    <td>
                                        <?php if ($r['status'] === 'pending'): ?>
                                            <form class="action-form" method="POST" action="assistant.php?status=<?php echo htmlspecialchars($filter); ?>">
                                                <input type="hidden" name="appointment_id" value="<?php echo (int)$r['id']; ?>">
                                                <input type="hidden" name="action" value="confirm">
                                                <button type="submit" class="btn btn-sm">Confirm</button>
                                            </form>
                                            <form class="action-form" method="POST" action="assistant.php?status=<?php echo htmlspecialchars($filter); ?>" onsubmit="return confirm('Cancel this appointment? The slot will be freed and the patient will be notified.');">
                                                <input type="hidden" name="appointment_id" value="<?php echo (int)$r['id']; ?>">
                                                <input type="hidden" name="action" value="cancel">
                                                <button type="submit" class="btn btn-sm btn-danger">Cancel</button>
                                            </form>
                                        <?php elseif ($r['status'] === 'confirmed'): ?>
                                            <form class="action-form" method="POST" action="assistant.php?status=<?php echo htmlspecialchars($filter); ?>" onsubmit="return confirm('Cancel this appointment? The slot will be freed and the patient will be notified.');">
                                                <input type="hidden" name="appointment_id" value="<?php echo (int)$r['id']; ?>">
                                                <input type="hidden" name="action" value="cancel">
                                                <button type="submit" class="btn btn-sm btn-danger">Cancel</button>
                                            </form>
                                        <?php else: ?>
                                            <span class="muted">—</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </section>
    </main>
</div>
</body>
</html>
