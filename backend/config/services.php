<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // Google-belepes. Kulcsok es GOOGLE_LOGIN_ENABLED nelkul a vegpontok 404-et adnak.
    // Az *_url ertekek csak a teszt-stubhoz valok, eleshen az alapertek (Google) marad.
    'google' => [
        'enabled' => (bool) env('GOOGLE_LOGIN_ENABLED', false),
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI', rtrim((string) env('APP_URL', 'http://localhost'), '/').'/api/v1/auth/google/callback'),
        'auth_url' => env('GOOGLE_AUTH_URL', 'https://accounts.google.com/o/oauth2/auth'),
        'token_url' => env('GOOGLE_TOKEN_URL', 'https://www.googleapis.com/oauth2/v4/token'),
        'userinfo_url' => env('GOOGLE_USERINFO_URL', 'https://www.googleapis.com/oauth2/v3/userinfo'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
