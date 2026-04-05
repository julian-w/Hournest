<?php

declare(strict_types=1);

$generatedPassword = null;
$hash = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputPassword = trim((string) ($_POST['password'] ?? ''));

    if ($inputPassword === '') {
        try {
            $inputPassword = rtrim(strtr(base64_encode(random_bytes(12)), '+/', '-_'), '=');
        } catch (Throwable $exception) {
            $error = 'Could not generate a random password automatically.';
        }
    }

    if ($error === null) {
        $generatedPassword = $inputPassword;
        $hash = password_hash($generatedPassword, PASSWORD_BCRYPT);

        if ($hash === false) {
            $error = 'Could not generate a bcrypt hash.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hournest Superadmin Password Helper</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f7f3ea;
            --card: #fffdf8;
            --ink: #1f2933;
            --accent: #a64b00;
            --border: #e6d7c2;
            --warn-bg: #fff4d6;
            --warn-border: #efb84d;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            background:
                radial-gradient(circle at top left, #f3d9b1 0, transparent 28%),
                linear-gradient(180deg, #f5eee3 0%, var(--bg) 100%);
            color: var(--ink);
        }

        main {
            max-width: 860px;
            margin: 48px auto;
            padding: 0 20px;
        }

        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 18px;
            padding: 28px;
            box-shadow: 0 18px 60px rgba(73, 42, 18, 0.08);
        }

        h1, h2 {
            margin-top: 0;
            color: #552400;
        }

        p, li, label {
            line-height: 1.55;
        }

        .warning {
            background: var(--warn-bg);
            border: 1px solid var(--warn-border);
            border-radius: 14px;
            padding: 16px 18px;
            margin-bottom: 24px;
        }

        form {
            display: grid;
            gap: 12px;
            margin-bottom: 28px;
        }

        input[type="text"] {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid var(--border);
            border-radius: 10px;
            font: inherit;
        }

        button {
            width: fit-content;
            border: 0;
            border-radius: 999px;
            padding: 12px 18px;
            font: inherit;
            font-weight: 700;
            background: var(--accent);
            color: #fff;
            cursor: pointer;
        }

        textarea {
            width: 100%;
            min-height: 104px;
            padding: 12px 14px;
            border: 1px solid var(--border);
            border-radius: 10px;
            font: 14px/1.45 Consolas, "Courier New", monospace;
            resize: vertical;
        }

        code {
            font-family: Consolas, "Courier New", monospace;
            font-size: 0.95em;
        }

        .error {
            color: #8a1c1c;
            font-weight: 700;
        }
    </style>
</head>
<body>
<main>
    <div class="card">
        <h1>Superadmin Password Helper</h1>
        <div class="warning">
            <strong>Wichtig:</strong> Diese Seite ist nur als Setup-Hilfe gedacht. Nutze sie zum Erzeugen eines
            Passworts und eines bcrypt-Hashes, trage den Hash in <code>backend/.env</code> bei
            <code>SUPERADMIN_PASSWORD</code> ein und lösche diese Datei danach wieder vom Server.
        </div>

        <form method="post">
            <label for="password">Optional eigenes Klartext-Passwort eingeben</label>
            <input id="password" name="password" type="text" value="">
            <button type="submit">Passwort und Hash erzeugen</button>
        </form>

        <?php if ($error !== null): ?>
            <p class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>

        <?php if ($generatedPassword !== null && $hash !== null): ?>
            <h2>Klartext-Passwort</h2>
            <textarea readonly><?= htmlspecialchars($generatedPassword, ENT_QUOTES, 'UTF-8') ?></textarea>

            <h2>Bcrypt-Hash für <code>SUPERADMIN_PASSWORD</code></h2>
            <textarea readonly><?= htmlspecialchars($hash, ENT_QUOTES, 'UTF-8') ?></textarea>
        <?php endif; ?>

        <h2>So verwendest du das Ergebnis</h2>
        <ol>
            <li>Öffne diese Datei einmal im Browser.</li>
            <li>Übernimm den Hash in <code>backend/.env</code> bei <code>SUPERADMIN_PASSWORD</code>.</li>
            <li>Melde dich mit dem angezeigten Klartext-Passwort an.</li>
            <li>Lösche danach <code>backend/public/superadmin-password-helper.php</code> wieder vom Server.</li>
        </ol>
    </div>
</main>
</body>
</html>
