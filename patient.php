<?php
// MediSlot - patient.php (Step 2: Book Appointment + My Appointments)
// Session guard: patient only.
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'patient') {
    header('Location: login.php');
    exit;
}
require_once 'db.php';

$patientId = (int)$_SESSION['user_id'];
$patientName = $_SESSION['name'];

// ---------- Handle booking submission (POST to this page) ----------
// Creates an appointment with status 'pending'.
// IMPORTANT: the slot is NOT marked booked here (is_booked stays 0) —
// the assistant confirms it in a later step.
$error = '';
$postedDoctorId = 0;
$postedSlotDate = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['book'])) {
    $doctorId = (int)($_POST['doctor_id'] ?? 0);
    $slotId = (int)($_POST['slot_id'] ?? 0);
    $reason = trim($_POST['reason'] ?? '');
    if (strlen($reason) > 500) {
        $reason = substr($reason, 0, 500);
    }
    $postedDoctorId = $doctorId;

    if ($doctorId <= 0 || $slotId <= 0) {
        $error = 'Please choose a doctor, a date and a free time slot first.';
    } else {
        // Transaction + row lock, so two simultaneous requests for the same
        // slot cannot both slip past the duplicate check.
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('SELECT id FROM doctors WHERE id = ?');
            $stmt->execute([$doctorId]);
            if (!$stmt->fetch()) {
                $pdo->rollBack();
                $error = 'That doctor does not exist.';
            } else {
                // Slot must exist, belong to this doctor, and be free.
                $stmt = $pdo->prepare('SELECT id, slot_date, is_booked FROM time_slots WHERE id = ? AND doctor_id = ? FOR UPDATE');
                $stmt->execute([$slotId, $doctorId]);
                $slot = $stmt->fetch();

                if (!$slot) {
                    $pdo->rollBack();
                    $error = 'That time slot does not belong to the selected doctor.';
                } elseif ((int)$slot['is_booked'] === 1) {
                    $pdo->rollBack();
                    $error = 'Sorry, that slot is already booked. Please pick another time.';
                } else {
                    $postedSlotDate = $slot['slot_date'];
                    // No duplicate pending/confirmed appointment for same patient + slot.
                    // A cancelled appointment does NOT block a fresh request.
                    $stmt = $pdo->prepare("SELECT id FROM appointments WHERE patient_id = ? AND slot_id = ? AND status IN ('pending','confirmed') LIMIT 1");
                    $stmt->execute([$patientId, $slotId]);
                    if ($stmt->fetch()) {
                        $pdo->rollBack();
                        $error = 'You have already requested this slot.';
                    } else {
                        $stmt = $pdo->prepare("INSERT INTO appointments (patient_id, doctor_id, slot_id, reason, status) VALUES (?, ?, ?, ?, 'pending')");
                        $stmt->execute([$patientId, $doctorId, $slotId, $reason === '' ? null : $reason]);
                        $pdo->commit();
                        // PRG: avoid double-submit on refresh; keep doctor/date selected.
                        header('Location: patient.php?booked=1&doctor=' . $doctorId . '&date=' . urlencode($slot['slot_date']));
                        exit;
                    }
                }
            }
        } catch (PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = 'Something went wrong. Please try again.';
        }
    }
}

$booked = isset($_GET['booked']) && $_GET['booked'] === '1';

// ---------- Data for the page ----------
// Doctors (all, for cards + JS).
$doctors = $pdo->query('SELECT id, name, specialization, experience_years, education, photo_url FROM doctors ORDER BY name')->fetchAll();

// Distinct specializations for the tabs.
$specs = $pdo->query('SELECT DISTINCT specialization FROM doctors ORDER BY specialization')->fetchAll(PDO::FETCH_COLUMN);

// Slot dates per doctor: doctor_id => ['2026-11-16', ...] (for the calendar + default date).
$slotDates = [];
$stmt = $pdo->query('SELECT doctor_id, slot_date FROM time_slots GROUP BY doctor_id, slot_date ORDER BY slot_date');
foreach ($stmt->fetchAll() as $row) {
    $slotDates[(int)$row['doctor_id']][] = $row['slot_date'];
}
$allSlotDates = [];
foreach ($slotDates as $dates) {
    $allSlotDates = array_merge($allSlotDates, $dates);
}
$allSlotDates = array_values(array_unique($allSlotDates));
sort($allSlotDates);
$maxSlotDate = end($allSlotDates) ?: date('Y-m-d');

// Initial selection (from PRG params, else first doctor + its earliest slot date).
$initialDoctorId = $doctors ? (int)$doctors[0]['id'] : 0;
if (isset($_GET['doctor'])) {
    $want = (int)$_GET['doctor'];
    foreach ($doctors as $d) {
        if ((int)$d['id'] === $want) {
            $initialDoctorId = $want;
            break;
        }
    }
}
$initialDate = $slotDates[$initialDoctorId][0] ?? date('Y-m-d', strtotime('+1 day'));
if (isset($_GET['date']) && isset($slotDates[$initialDoctorId]) && in_array($_GET['date'], $slotDates[$initialDoctorId], true)) {
    $initialDate = $_GET['date'];
}

// After a failed booking, keep the doctor/date the patient had picked
// instead of resetting to the first doctor.
if ($error !== '' && $postedDoctorId > 0) {
    foreach ($doctors as $d) {
        if ((int)$d['id'] === $postedDoctorId) {
            $initialDoctorId = $postedDoctorId;
            break;
        }
    }
    if ($postedSlotDate !== '' && isset($slotDates[$initialDoctorId]) && in_array($postedSlotDate, $slotDates[$initialDoctorId], true)) {
        $initialDate = $postedSlotDate;
    }
}

// Unread notification count for the bell badge.
$stmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
$stmt->execute([$patientId]);
$unreadCount = (int)$stmt->fetchColumn();

// My Appointments: only this patient, newest first.
$stmt = $pdo->prepare('
    SELECT a.id, a.status, a.created_at, d.name AS doctor_name, t.slot_date, t.slot_time
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    JOIN time_slots t ON t.id = a.slot_id
    WHERE a.patient_id = ?
    ORDER BY a.created_at DESC
');
$stmt->execute([$patientId]);
$myAppointments = $stmt->fetchAll();

function initialsOf($name) {
    $name = trim(preg_replace('/^Dr\.?\s*/i', '', $name));
    $parts = preg_split('/\s+/', $name);
    $ini = '';
    foreach (array_slice($parts, 0, 2) as $p) {
        $ini .= strtoupper(substr($p, 0, 1));
    }
    return $ini === '' ? '?' : $ini;
}

function fmtTime($time) {
    return date('g:i A', strtotime($time));
}

function fmtDate($date) {
    return date('D, M j, Y', strtotime($date));
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediSlot - Book Appointment</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
<div class="layout">
    <aside class="sidebar">
        <a class="logo" href="patient.php">Medi<span>Slot</span></a>
        <nav>
            <a href="#book" class="active">Book Appointment</a>
            <a href="#my-appointments">My Appointments</a>
            <a href="logout.php">Logout</a>
        </nav>
        <div class="side-user">
            <?php echo htmlspecialchars($patientName); ?> (Patient)<br>
            <a href="logout.php">Logout</a>
        </div>
    </aside>

    <main class="main">
        <div class="topbar patient-topbar">
            <h1>Book Appointment</h1>
            <div class="top-right">
                <input type="text" id="doctorSearch" class="search-box" placeholder="Find doctors" aria-label="Find doctors">
                <div class="bell-wrap">
                    <button type="button" id="bellBtn" class="bell-btn" aria-label="Notifications" aria-expanded="false">
                        &#128276;
                        <?php if ($unreadCount > 0): ?>
                            <span class="bell-badge" id="bellBadge"><?php echo $unreadCount; ?></span>
                        <?php else: ?>
                            <span class="bell-badge hidden" id="bellBadge">0</span>
                        <?php endif; ?>
                    </button>
                    <div class="notif-dropdown hidden" id="notifPanel">
                        <div class="notif-head">Notifications</div>
                        <div id="notifList"><p class="muted">Loading...</p></div>
                    </div>
                </div>
                <span class="patient-name"><?php echo htmlspecialchars($patientName); ?></span>
            </div>
        </div>

        <?php if ($booked): ?>
            <div class="success">Request sent. Waiting for confirmation.</div>
        <?php endif; ?>
        <?php if ($error !== ''): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <div class="tabs" id="specTabs" role="tablist">
            <button type="button" class="tab active" data-spec="all">All</button>
            <?php foreach ($specs as $spec): ?>
                <button type="button" class="tab" data-spec="<?php echo htmlspecialchars($spec); ?>"><?php echo htmlspecialchars($spec); ?></button>
            <?php endforeach; ?>
        </div>

        <section id="book" class="book-grid">
            <!-- Column 1: Choose Doctor -->
            <div class="card col-doctors">
                <h2>Choose Doctor</h2>
                <div id="doctorList">
                    <?php foreach ($doctors as $d): ?>
                        <article class="doctor-card" data-id="<?php echo (int)$d['id']; ?>"
                                 data-name="<?php echo htmlspecialchars(strtolower($d['name'])); ?>"
                                 data-spec="<?php echo htmlspecialchars($d['specialization']); ?>">
                            <div class="doctor-head">
                                <?php if (!empty($d['photo_url'])): ?>
                                    <img class="doctor-avatar-img" src="<?php echo htmlspecialchars($d['photo_url']); ?>" alt="<?php echo htmlspecialchars($d['name']); ?>">
                                <?php else: ?>
                                    <span class="doctor-avatar"><?php echo htmlspecialchars(initialsOf($d['name'])); ?></span>
                                <?php endif; ?>
                                <div>
                                    <div class="doctor-name"><?php echo htmlspecialchars($d['name']); ?></div>
                                    <div class="muted">specialist | <?php echo (int)$d['experience_years']; ?> years experience</div>
                                    <span class="spec-pill"><?php echo htmlspecialchars($d['specialization']); ?></span>
                                </div>
                            </div>
                            <button type="button" class="btn btn-block select-doctor-btn" data-id="<?php echo (int)$d['id']; ?>">Book an appointment</button>
                        </article>
                    <?php endforeach; ?>
                </div>
                <p class="muted" id="noDoctorMsg" hidden>No doctors match your search.</p>
            </div>

            <!-- Column 2: Selected doctor's details -->
            <div class="card col-detail">
                <div class="doctor-detail" id="docDetail">
                    <div class="doctor-head">
                        <span class="doctor-avatar big" id="detailAvatar">?</span>
                        <div>
                            <div class="doctor-name big" id="detailName">—</div>
                            <div class="muted" id="detailMeta">—</div>
                            <span class="spec-pill" id="detailSpec">—</span>
                        </div>
                    </div>
                    <div class="detail-row">
                        <strong>Education</strong>
                        <p id="detailEducation" class="muted">—</p>
                    </div>
                    <div class="detail-row">
                        <strong>Experience</strong>
                        <p id="detailExperience" class="muted">—</p>
                    </div>
                </div>
            </div>

            <!-- Column 3: Calendar + Visit Hours + booking form -->
            <div class="col-slots">
                <div class="card">
                    <div class="cal-head">
                        <h2>Calendar</h2>
                        <div class="cal-nav">
                            <button type="button" id="calPrev" class="cal-nav-btn" aria-label="Previous month">&lt;</button>
                            <span id="calTitle" class="cal-title"></span>
                            <button type="button" id="calNext" class="cal-nav-btn" aria-label="Next month">&gt;</button>
                        </div>
                    </div>
                    <div class="cal-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
                    <div class="cal-grid" id="calGrid"></div>
                </div>

                <div class="card">
                    <h2>Visit Hours</h2>
                    <p class="muted small" id="visitDateLabel"></p>
                    <div class="slot-grid" id="slotGrid">
                        <p class="muted">Loading slots...</p>
                    </div>
                </div>

                <div class="card">
                    <form id="bookForm" method="POST" action="patient.php">
                        <input type="hidden" name="book" value="1">
                        <input type="hidden" name="doctor_id" id="formDoctorId" value="<?php echo $initialDoctorId; ?>">
                        <input type="hidden" name="slot_id" id="formSlotId" value="">
                        <div class="form-group">
                            <label for="reason">Reason <span class="muted">(optional)</span></label>
                            <textarea id="reason" name="reason" rows="2" maxlength="500" placeholder="Briefly describe your reason for the visit"></textarea>
                        </div>
                        <button type="submit" class="btn btn-block" id="bookSubmit">Book an appointment</button>
                        <p class="muted small centered" id="bookHint">Pick a date and a free time slot above first.</p>
                    </form>
                </div>
            </div>
        </section>

        <section id="my-appointments" class="card wide-card">
            <h2>My Appointments</h2>
            <?php if (empty($myAppointments)): ?>
                <p class="muted">No appointments yet. Book your first appointment above.</p>
            <?php else: ?>
                <table class="appt-table">
                    <thead>
                        <tr><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($myAppointments as $a): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($a['doctor_name']); ?></td>
                                <td><?php echo htmlspecialchars(fmtDate($a['slot_date'])); ?></td>
                                <td><?php echo htmlspecialchars(fmtTime($a['slot_time'])); ?></td>
                                <td><span class="badge badge-<?php echo htmlspecialchars($a['status']); ?>"><?php echo htmlspecialchars(ucfirst($a['status'])); ?></span></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </section>
    </main>
</div>

<script>
var DOCTORS = <?php echo json_encode($doctors, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
var SLOT_DATES = <?php echo json_encode($slotDates, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP); ?>;
var MAX_SLOT_DATE = <?php echo json_encode($maxSlotDate); ?>;

var selectedDoctorId = <?php echo (int)$initialDoctorId; ?>;
var selectedDate = <?php echo json_encode($initialDate); ?>;
var selectedSlotId = null;
var activeSpec = 'all';

// Month view state, starting on the selected date's month.
var viewParts = selectedDate.split('-');
var viewYear = parseInt(viewParts[0], 10);
var viewMonth = parseInt(viewParts[1], 10) - 1; // JS months are 0-based
var today = new Date();
var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
var maxParts = MAX_SLOT_DATE.split('-');
var maxYear = parseInt(maxParts[0], 10), maxMonth = parseInt(maxParts[1], 10) - 1;

function $(id) { return document.getElementById(id); }

function fmtTime12(hms) {
    var p = hms.split(':');
    var h = parseInt(p[0], 10), m = p[1];
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + m + ' ' + ampm;
}

function fmtDateLabel(iso) {
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function doctorById(id) {
    for (var i = 0; i < DOCTORS.length; i++) {
        if (parseInt(DOCTORS[i].id, 10) === id) return DOCTORS[i];
    }
    return null;
}

function initialsOf(name) {
    var n = name.replace(/^Dr\.?\s*/i, '').trim();
    var parts = n.split(/\s+/).slice(0, 2);
    var ini = '';
    parts.forEach(function (p) { ini += p.charAt(0).toUpperCase(); });
    return ini || '?';
}

/* ---- Doctor filtering (search + tabs) ---- */
function applyDoctorFilter() {
    var q = ($('doctorSearch').value || '').trim().toLowerCase();
    var visible = 0;
    document.querySelectorAll('.doctor-card').forEach(function (card) {
        var nameOk = !q || card.getAttribute('data-name').indexOf(q) !== -1;
        var specOk = activeSpec === 'all' || card.getAttribute('data-spec') === activeSpec;
        var show = nameOk && specOk;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    $('noDoctorMsg').hidden = visible !== 0;
}

$('doctorSearch').addEventListener('input', applyDoctorFilter);

document.querySelectorAll('#specTabs .tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('#specTabs .tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        activeSpec = tab.getAttribute('data-spec');
        applyDoctorFilter();
    });
});

/* ---- Doctor selection ---- */
function selectDoctor(id, keepDate) {
    var doc = doctorById(id);
    if (!doc) return;
    selectedDoctorId = id;
    $('formDoctorId').value = id;

    $('detailAvatar').textContent = initialsOf(doc.name);
    $('detailName').textContent = doc.name;
    $('detailMeta').textContent = 'specialist | ' + doc.experience_years + ' years experience';
    $('detailSpec').textContent = doc.specialization;
    $('detailEducation').textContent = doc.education || '—';
    $('detailExperience').textContent = doc.experience_years + ' years experience';

    // Highlight the selected doctor's card.
    document.querySelectorAll('.doctor-card').forEach(function (card) {
        card.classList.toggle('selected', parseInt(card.getAttribute('data-id'), 10) === id);
    });

    // Default date = earliest date with slots for this doctor.
    var dates = SLOT_DATES[id] || [];
    if (!keepDate || dates.indexOf(selectedDate) === -1) {
        selectedDate = dates.length ? dates[0] : todayStr;
        var parts = selectedDate.split('-');
        viewYear = parseInt(parts[0], 10);
        viewMonth = parseInt(parts[1], 10) - 1;
    }
    selectedSlotId = null;
    $('formSlotId').value = '';
    renderCalendar();
    loadSlots();
}

document.querySelectorAll('.select-doctor-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        selectDoctor(parseInt(btn.getAttribute('data-id'), 10), false);
        document.getElementById('book').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
});

/* ---- Calendar (month view) ---- */
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function renderCalendar() {
    var title = MONTHS[viewMonth] + ' ' + viewYear;
    $('calTitle').textContent = title;
    $('calPrev').disabled = (viewYear === today.getFullYear() && viewMonth === today.getMonth());
    $('calNext').disabled = (viewYear === maxYear && viewMonth === maxMonth);

    var first = new Date(viewYear, viewMonth, 1);
    var offset = (first.getDay() + 6) % 7; // Monday-first
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var dates = SLOT_DATES[selectedDoctorId] || [];

    var html = '';
    for (var i = 0; i < offset; i++) html += '<span class="cal-day empty"></span>';
    for (var d = 1; d <= daysInMonth; d++) {
        var iso = viewYear + '-' + String(viewMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var cls = 'cal-day';
        var disabled = dates.indexOf(iso) === -1 || iso < todayStr;
        if (iso === todayStr) cls += ' today';
        if (iso === selectedDate) cls += ' selected';
        if (disabled) cls += ' disabled';
        html += '<button type="button" class="' + cls + '" data-date="' + iso + '"' + (disabled ? ' disabled' : '') + '>' + d + '</button>';
    }
    $('calGrid').innerHTML = html;

    $('calGrid').querySelectorAll('.cal-day:not(.disabled):not(.empty)').forEach(function (btn) {
        btn.addEventListener('click', function () {
            selectedDate = btn.getAttribute('data-date');
            selectedSlotId = null;
            $('formSlotId').value = '';
            renderCalendar();
            loadSlots();
        });
    });
}

$('calPrev').addEventListener('click', function () {
    if (viewYear === today.getFullYear() && viewMonth === today.getMonth()) return;
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
});
$('calNext').addEventListener('click', function () {
    if (viewYear === maxYear && viewMonth === maxMonth) return;
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
});

/* ---- Visit Hours: load slots from api_slots.php ---- */
function loadSlots() {
    $('visitDateLabel').textContent = 'Slots for ' + fmtDateLabel(selectedDate);
    $('slotGrid').innerHTML = '<p class="muted">Loading slots...</p>';
    updateBookButton();

    fetch('api_slots.php?doctor_id=' + selectedDoctorId + '&date=' + encodeURIComponent(selectedDate))
        .then(function (resp) { return resp.json(); })
        .then(function (slots) {
            if (!slots || !slots.length) {
                $('slotGrid').innerHTML = '<p class="muted">No slots on this date.</p>';
                return;
            }
            var html = '';
            slots.forEach(function (s) {
                var booked = parseInt(s.is_booked, 10) === 1;
                html += '<button type="button" class="slot-btn' + (booked ? ' booked' : '') + '" data-slot-id="' + s.id + '"' + (booked ? ' disabled' : '') + '>' + fmtTime12(s.slot_time) + '</button>';
            });
            $('slotGrid').innerHTML = html;
            $('slotGrid').querySelectorAll('.slot-btn:not(.booked)').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    selectedSlotId = parseInt(btn.getAttribute('data-slot-id'), 10);
                    $('formSlotId').value = selectedSlotId;
                    $('slotGrid').querySelectorAll('.slot-btn').forEach(function (b) { b.classList.remove('selected'); });
                    btn.classList.add('selected');
                    updateBookButton();
                });
            });
        })
        .catch(function () {
            $('slotGrid').innerHTML = '<p class="error">Could not load slots. Please try again.</p>';
        });
}

function updateBookButton() {
    var ready = selectedSlotId !== null;
    $('bookSubmit').disabled = !ready;
    $('bookHint').textContent = ready ? 'Slot selected — add a reason (optional) and confirm.' : 'Pick a date and a free time slot above first.';
}

/* ---- Notifications bell ---- */
/* Flow: click bell -> GET api_notifications.php?action=list (renders list) ->
   POST api_notifications.php?action=read (marks all read) -> badge becomes 0/hidden. */
var notifOpen = false;
$('bellBtn').addEventListener('click', function () {
    var panel = $('notifPanel');
    if (notifOpen) {
        panel.classList.add('hidden');
        $('bellBtn').setAttribute('aria-expanded', 'false');
        notifOpen = false;
        return;
    }
    panel.classList.remove('hidden');
    $('bellBtn').setAttribute('aria-expanded', 'true');
    notifOpen = true;

    fetch('api_notifications.php?action=list')
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
            var list = data.notifications || [];
            $('notifList').innerHTML = '';
            if (!list.length) {
                $('notifList').innerHTML = '<p class="muted">No notifications yet.</p>';
            } else {
                // Build with textContent (never innerHTML) so a message can never inject HTML.
                list.forEach(function (n) {
                    var when = new Date(n.created_at.replace(' ', 'T'));
                    var div = document.createElement('div');
                    div.className = 'notif-item' + (parseInt(n.is_read, 10) === 0 ? ' unread' : '');
                    var p = document.createElement('p');
                    p.textContent = n.message;
                    var small = document.createElement('small');
                    small.className = 'muted';
                    small.textContent = isNaN(when.getTime()) ? n.created_at : when.toLocaleString();
                    div.appendChild(p);
                    div.appendChild(small);
                    $('notifList').appendChild(div);
                });
            }
            return fetch('api_notifications.php?action=read', { method: 'POST' });
        })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
            var badge = $('bellBadge');
            if (badge) {
                badge.textContent = '0';
                badge.classList.add('hidden');
            }
        })
        .catch(function () {
            $('notifList').innerHTML = '<p class="error">Could not load notifications.</p>';
        });
});

// Close the notification panel when clicking elsewhere.
document.addEventListener('click', function (e) {
    if (!notifOpen) return;
    if (!e.target.closest('.bell-wrap')) {
        $('notifPanel').classList.add('hidden');
        $('bellBtn').setAttribute('aria-expanded', 'false');
        notifOpen = false;
    }
});

/* ---- Init ---- */
applyDoctorFilter();
selectDoctor(selectedDoctorId, true);
</script>
</body>
</html>
