<?php
header('Content-Type: application/json');

$to = 'hello@explorelandfarms.com';

function respond($ok, $error = '') {
    echo json_encode(['ok' => $ok, 'error' => $error]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Invalid request method.');
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$subject = trim($_POST['subject'] ?? 'General question');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    respond(false, 'Please fill in your name, email, and message.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please enter a valid email address.');
}

$emailSafe = str_replace(["\r", "\n"], '', $email);
$mailSubject = 'ExploreLand Farms — ' . $subject . ' (from ' . $name . ')';

$body = "New enquiry from the ExploreLand Farms website:\n\n";
$body .= "Name: $name\n";
$body .= "Email: $email\n";
$body .= "Phone: " . ($phone !== '' ? $phone : 'Not provided') . "\n";
$body .= "Subject: $subject\n\n";
$body .= "Message:\n$message\n";

$headers = "From: ExploreLand Farms Website <no-reply@explorelandfarms.com>\r\n";
$headers .= "Reply-To: $name <$emailSafe>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, $mailSubject, $body, $headers);

if ($sent) {
    respond(true);
} else {
    respond(false, 'The message could not be sent right now. Please call or WhatsApp us directly.');
}
