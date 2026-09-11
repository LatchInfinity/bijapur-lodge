<?php

declare(strict_types=1);

return [
    'apps_script_web_app_url' => 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    'booking_shared_secret' => 'replace-with-a-long-random-secret',
    'allowed_origins' => [
        'https://thezari.co.in',
        'https://latchinfinity.github.io',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    'request_timeout_seconds' => 30,
];
