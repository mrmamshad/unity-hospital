<?php
// MediSlot - index.php - Landing page (public, guest only).
// Logged-in users go straight to their dashboard, same as login.php.
session_start();

if (isset($_SESSION['user_id'], $_SESSION['role'])) {
    header('Location: ' . ($_SESSION['role'] === 'assistant' ? 'assistant.php' : 'patient.php'));
    exit;
}

// Load doctors for the "Our Doctors" section. If the database is not
// imported yet, show the hero + buttons anyway — never fatal the page
// and never expose raw DB error details.
$doctors = [];
$dbReady = false;
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=medislot_db;charset=utf8mb4',
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    $doctors = $pdo->query('SELECT id, name, specialization, experience_years, education, photo_url FROM doctors ORDER BY name')->fetchAll();
    $dbReady = true;
} catch (Throwable $e) {
    $doctors = [];
    $dbReady = false;
}

function initialsOf($name) {
    $name = trim(preg_replace('/^Dr\.?\s*/i', '', $name));
    $parts = preg_split('/\s+/', $name);
    $ini = '';
    foreach (array_slice($parts, 0, 2) as $p) {
        $ini .= strtoupper(substr($p, 0, 1));
    }
    return $ini === '' ? '?' : $ini;
}

function displayDoctor($name) {
    $name = trim($name);
    if (stripos($name, 'Dr.') === 0 || stripos($name, 'Dr ') === 0) {
        return $name;
    }
    return 'Dr. ' . $name;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediSlot - Book Your Doctor Appointment</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="landing-header">
        <a class="landing-logo" href="index.php">Medi<span>Slot</span></a>
        <nav class="landing-nav">
            <a class="btn btn-sm" href="login.php">Login</a>
            <a class="btn btn-sm btn-light" href="register.php">Register</a>
        </nav>
    </header>

    <section class="hero">
        <div class="hero-inner">
            <h1>MediSlot</h1>
            <p class="hero-tag">Book your doctor appointment in minutes.</p>
            <p class="hero-sub">Choose a doctor, pick a free time slot, and get a confirmation notification when your appointment is confirmed.</p>
            <div class="hero-actions">
                <a class="btn btn-light" href="login.php">Book an Appointment</a>
                <a class="btn btn-outline" href="register.php">Register as Patient</a>
            </div>
            <?php if (!$dbReady): ?>
                <p class="db-note">The database is not set up yet — please import database.sql in phpMyAdmin first (see README.txt). You can still log in once the database is ready.</p>
            <?php endif; ?>
        </div>
    </section>

    <main class="landing-wrap">
        <?php if ($dbReady): ?>
            <section>
                <h2 class="section-title">Our Doctors</h2>
                <?php if (empty($doctors)): ?>
                    <p class="muted">No doctors are listed yet.</p>
                <?php else: ?>
                    <div class="doctors-grid">
                        <?php foreach ($doctors as $d): ?>
                            <div class="doctor-card landing-doctor-card">
                                <div class="doctor-head">
                                    <?php if (!empty($d['photo_url'])): ?>
                                        <img class="doctor-avatar-img" src="<?php echo htmlspecialchars($d['photo_url']); ?>" alt="<?php echo htmlspecialchars($d['name']); ?>">
                                    <?php else: ?>
                                        <span class="doctor-avatar"><?php echo htmlspecialchars(initialsOf($d['name'])); ?></span>
                                    <?php endif; ?>
                                    <div>
                                        <div class="doctor-name"><?php echo htmlspecialchars(displayDoctor($d['name'])); ?></div>
                                        <span class="spec-pill"><?php echo htmlspecialchars($d['specialization']); ?></span>
                                    </div>
                                </div>
                                <p><?php echo (int)$d['experience_years']; ?> years experience</p>
                                <?php if (!empty($d['education'])): ?>
                                    <p class="muted small"><?php echo htmlspecialchars($d['education']); ?></p>
                                <?php endif; ?>
                                <a class="btn btn-block" href="login.php" style="margin-top: 14px;">Book an appointment</a>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </section>
        <?php endif; ?>

        <section>
            <h2 class="section-title">How it works</h2>
            <div class="steps-grid">
                <div class="card step-card">
                    <div class="step-num">1</div>
                    <h3>Register as a patient</h3>
                    <p class="muted">Create your free patient account in a minute.</p>
                </div>
                <div class="card step-card">
                    <div class="step-num">2</div>
                    <h3>Choose a doctor and a free slot</h3>
                    <p class="muted">Pick a doctor, a date, and a time that works for you.</p>
                </div>
                <div class="card step-card">
                    <div class="step-num">3</div>
                    <h3>Get confirmation notification</h3>
                    <p class="muted">We notify you as soon as your appointment is confirmed.</p>
                </div>
            </div>
        </section>
    </main>

    <footer class="landing-footer">
        MediSlot — Hospital Appointment Management System
    </footer>
</body>
</html>
