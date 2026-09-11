<?php

declare(strict_types=1);

const MAX_BODY_BYTES = 8192;
const TIMEZONE = 'Asia/Kolkata';
const DEVELOPMENT_ALLOWED_ORIGINS = [
    'https://thezari.co.in',
    'https://latchinfinity.github.io',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function getConfig(): array
{
    foreach (getConfigPaths() as $configPath) {
        if (is_file($configPath)) {
            $config = require $configPath;

            return is_array($config) ? $config : [];
        }
    }

    return [];
}

function getConfigPaths(): array
{
    return [
        __DIR__ . '/booking-config.php',
        dirname(__DIR__, 2) . '/booking-config.php',
    ];
}

function hasConfigFile(): bool
{
    foreach (getConfigPaths() as $configPath) {
        if (is_file($configPath)) {
            return true;
        }
    }

    return false;
}

function hasExampleConfigFile(): bool
{
    return is_file(__DIR__ . '/booking-config.example.php');
}

function isPlaceholderValue(string $value): bool
{
    return $value === ''
        || strpos($value, 'YOUR_DEPLOYMENT_ID') !== false
        || strpos($value, 'replace-with') !== false;
}

function getConfigStatus(array $config): array
{
    $appsScriptUrl = trim((string) ($config['apps_script_web_app_url'] ?? ''));
    $sharedSecret = trim((string) ($config['booking_shared_secret'] ?? ''));

    return [
        'configFileFound' => hasConfigFile(),
        'exampleConfigFileFound' => hasExampleConfigFile(),
        'hasAppsScriptUrl' => !isPlaceholderValue($appsScriptUrl),
        'hasSharedSecret' => !isPlaceholderValue($sharedSecret),
        'curlAvailable' => function_exists('curl_init'),
        'urlFopenEnabled' => filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN),
        'phpVersion' => PHP_VERSION,
    ];
}

function getBookingServiceConfig(array $config): array
{
    $appsScriptUrl = trim((string) ($config['apps_script_web_app_url'] ?? ''));
    $sharedSecret = trim((string) ($config['booking_shared_secret'] ?? ''));
    $timeout = (int) ($config['request_timeout_seconds'] ?? 30);

    if (!hasConfigFile()) {
        respond(503, [
            'ok' => false,
            'message' => hasExampleConfigFile()
                ? 'Booking config must be named booking-config.php, not booking-config.example.php.'
                : 'Booking service is not configured.',
        ]);
    }

    if (isPlaceholderValue($appsScriptUrl) || isPlaceholderValue($sharedSecret)) {
        respond(503, [
            'ok' => false,
            'message' => 'Booking service is not configured.',
        ]);
    }

    return [
        'appsScriptUrl' => $appsScriptUrl,
        'sharedSecret' => $sharedSecret,
        'timeout' => $timeout,
    ];
}

function normalizeOrigin(string $origin): string
{
    return rtrim(strtolower(trim($origin)), '/');
}

function applyCors(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = $config['allowed_origins'] ?? [];

    if (is_string($allowedOrigins)) {
        $allowedOrigins = [$allowedOrigins];
    }

    $allowedOrigins = array_values(array_unique(array_merge(
        $allowedOrigins,
        DEVELOPMENT_ALLOWED_ORIGINS
    )));
    $normalizedOrigin = normalizeOrigin($origin);
    $normalizedAllowedOrigins = array_map(
        static function ($allowedOrigin): string {
            return normalizeOrigin((string) $allowedOrigin);
        },
        $allowedOrigins
    );

    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
    header('Vary: Origin');

    if ($origin === '') {
        return;
    }

    if (in_array($normalizedOrigin, $normalizedAllowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$origin}");

        return;
    }

    respond(403, [
        'ok' => false,
        'message' => 'Booking requests are not allowed from this origin.',
    ]);
}

function readJsonBody(): array
{
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);

    if ($contentLength > MAX_BODY_BYTES) {
        respond(413, [
            'ok' => false,
            'message' => 'Booking request is too large.',
        ]);
    }

    $rawBody = file_get_contents('php://input') ?: '';
    $data = json_decode($rawBody, true);

    if (!is_array($data)) {
        respond(400, [
            'ok' => false,
            'message' => 'Please check your booking details.',
        ]);
    }

    return $data;
}

function validateBooking(array $data): array
{
    $name = trim((string) ($data['name'] ?? ''));
    $phone = preg_replace('/\D+/', '', (string) ($data['phone'] ?? '')) ?? '';
    $honeypot = trim((string) ($data['honeypot'] ?? $data['website'] ?? ''));
    $sourcePage = trim((string) ($data['sourcePage'] ?? ''));

    if ($honeypot !== '') {
        respond(422, [
            'ok' => false,
            'message' => 'Please check your booking details.',
        ]);
    }

    if (strlen($name) < 2 || preg_match('/\d/', $name)) {
        respond(422, [
            'ok' => false,
            'message' => 'Please enter a valid name.',
        ]);
    }

    if (!preg_match('/^\d{10}$/', $phone)) {
        respond(422, [
            'ok' => false,
            'message' => 'Please enter a 10 digit phone number.',
        ]);
    }

    $timezone = new DateTimeZone(TIMEZONE);
    $bookingId = 'BL-' . (new DateTimeImmutable('now', $timezone))->format('Ymd-His') . '-' . strtoupper(bin2hex(random_bytes(2)));

    return [
        'bookingId' => $bookingId,
        'name' => $name,
        'phone' => $phone,
        'sourcePage' => $sourcePage,
        'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'submittedAt' => (new DateTimeImmutable('now', $timezone))->format(DateTimeInterface::ATOM),
    ];
}

function forwardBooking(array $config, array $booking): array
{
    $serviceConfig = getBookingServiceConfig($config);

    $booking['secret'] = $serviceConfig['sharedSecret'];
    $payload = json_encode($booking);

    if ($payload === false) {
        respond(500, [
            'ok' => false,
            'message' => 'Booking request could not be prepared.',
        ]);
    }

    return sendToAppsScript($serviceConfig['appsScriptUrl'], $payload, $serviceConfig['timeout']);
}

function isRedirectStatusCode(int $statusCode): bool
{
    return in_array($statusCode, [301, 302, 303, 307, 308], true);
}

function getHeaderValue(string $headers, string $headerName): string
{
    $pattern = '/^' . preg_quote($headerName, '/') . ':\s*(.+)$/mi';

    if (!preg_match_all($pattern, $headers, $matches) || empty($matches[1])) {
        return '';
    }

    return trim((string) end($matches[1]));
}

function resolveRedirectUrl(string $baseUrl, string $location): string
{
    $location = trim($location);

    if ($location === '' || preg_match('/^https?:\/\//i', $location)) {
        return $location;
    }

    if (str_starts_with($location, '//')) {
        $baseParts = parse_url($baseUrl);
        $scheme = $baseParts['scheme'] ?? 'https';

        return $scheme . ':' . $location;
    }

    if (str_starts_with($location, '/')) {
        $baseParts = parse_url($baseUrl);
        $scheme = $baseParts['scheme'] ?? 'https';
        $host = $baseParts['host'] ?? '';

        return $host === '' ? $location : "{$scheme}://{$host}{$location}";
    }

    return rtrim(dirname($baseUrl), '/') . '/' . $location;
}

function sendCurlRequest(string $url, string $method, ?string $payload, int $timeout): array
{
    $curl = curl_init($url);
    $headers = ['Accept: application/json'];
    $curlOptions = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CONNECTTIMEOUT => min(10, $timeout),
        CURLOPT_TIMEOUT => $timeout,
    ];

    if ($method === 'POST') {
        $headers[] = 'Content-Type: application/json';
        $curlOptions[CURLOPT_POST] = true;
        $curlOptions[CURLOPT_POSTFIELDS] = $payload ?? '';
    } else {
        $curlOptions[CURLOPT_HTTPGET] = true;
    }

    $curlOptions[CURLOPT_HTTPHEADER] = $headers;
    curl_setopt_array($curl, $curlOptions);

    $response = curl_exec($curl);
    $statusCode = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $headerSize = (int) curl_getinfo($curl, CURLINFO_HEADER_SIZE);
    $error = curl_error($curl);
    curl_close($curl);

    if ($response === false || $error !== '') {
        respond(502, [
            'ok' => false,
            'message' => 'Booking request could not be saved right now.',
        ]);
    }

    return [
        'statusCode' => $statusCode,
        'headers' => substr((string) $response, 0, $headerSize) ?: '',
        'body' => substr((string) $response, $headerSize) ?: '',
        'url' => $url,
    ];
}

function sendToAppsScript(string $appsScriptUrl, string $payload, int $timeout): array
{
    if (function_exists('curl_init')) {
        $response = sendCurlRequest($appsScriptUrl, 'POST', $payload, $timeout);
        $redirectsFollowed = 0;

        while (isRedirectStatusCode($response['statusCode']) && $redirectsFollowed < 5) {
            $location = resolveRedirectUrl(
                (string) $response['url'],
                getHeaderValue((string) $response['headers'], 'Location')
            );

            if ($location === '') {
                break;
            }

            $response = sendCurlRequest($location, 'GET', null, $timeout);
            $redirectsFollowed += 1;
        }

        return [
            'statusCode' => $response['statusCode'],
            'body' => (string) $response['body'],
        ];
    }

    if (!filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        respond(503, [
            'ok' => false,
            'message' => 'Booking service needs PHP cURL or allow_url_fopen enabled.',
        ]);
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n",
            'content' => $payload,
            'ignore_errors' => true,
            'timeout' => $timeout,
        ],
    ]);

    $body = file_get_contents($appsScriptUrl, false, $context);
    $statusCode = 0;

    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches)) {
            $statusCode = (int) $matches[1];
            break;
        }
    }

    if ($body === false) {
        respond(502, [
            'ok' => false,
            'message' => 'Booking request could not be saved right now.',
        ]);
    }

    return [
        'statusCode' => $statusCode,
        'body' => (string) $body,
    ];
}

function checkAppsScript(array $config): array
{
    $serviceConfig = getBookingServiceConfig($config);
    $payload = json_encode([
        'action' => 'health',
        'secret' => $serviceConfig['sharedSecret'],
    ]);

    if ($payload === false) {
        respond(500, [
            'ok' => false,
            'message' => 'Booking health check could not be prepared.',
        ]);
    }

    $response = sendToAppsScript(
        $serviceConfig['appsScriptUrl'],
        $payload,
        $serviceConfig['timeout']
    );
    $result = json_decode($response['body'], true);

    return [
        'statusCode' => $response['statusCode'],
        'ok' => is_array($result) && ($result['ok'] ?? false) === true,
        'response' => is_array($result)
            ? [
                'ok' => $result['ok'] ?? false,
                'message' => $result['message'] ?? '',
                'config' => $result['config'] ?? null,
            ]
            : [
                'ok' => false,
                'message' => 'Apps Script did not return JSON.',
            ],
    ];
}

$config = getConfig();
applyCors($config);

if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['health'] ?? '') === '1') {
    respond(200, [
        'ok' => true,
        'service' => 'Bijapur Lodge bookings',
        'config' => getConfigStatus($config),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['health'] ?? '') === 'upstream') {
    $upstream = checkAppsScript($config);

    respond($upstream['ok'] ? 200 : 502, [
        'ok' => $upstream['ok'],
        'service' => 'Bijapur Lodge bookings',
        'phpConfig' => getConfigStatus($config),
        'appsScript' => $upstream,
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'ok' => false,
        'message' => 'Booking endpoint accepts POST requests only.',
    ]);
}

$booking = validateBooking(readJsonBody());
$appsScriptResponse = forwardBooking($config, $booking);
$appsScriptResult = json_decode($appsScriptResponse['body'], true);

if (
    $appsScriptResponse['statusCode'] < 200
    || $appsScriptResponse['statusCode'] >= 300
    || !is_array($appsScriptResult)
    || ($appsScriptResult['ok'] ?? false) !== true
) {
    respond(502, [
        'ok' => false,
        'message' => is_array($appsScriptResult) && !empty($appsScriptResult['message'])
            ? 'Apps Script: ' . $appsScriptResult['message']
            : 'Booking request could not be saved right now.',
    ]);
}

respond(200, [
    'ok' => true,
    'saved' => true,
    'bookingId' => $appsScriptResult['bookingId'] ?? $booking['bookingId'],
    'message' => 'Booking request saved.',
]);
