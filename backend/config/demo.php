<?php

declare(strict_types=1);

$bool = static fn (string $key, bool $default = false): bool => filter_var(
    env($key, $default ? 'true' : 'false'),
    FILTER_VALIDATE_BOOL
);

return [
    'enabled' => $bool('DEMO_ENABLED'),
    'reference_date' => env('DEMO_REFERENCE_DATE', 'now'),
    'dataset_variant' => env('DEMO_DATASET_VARIANT', 'standard'),
    'refresh_cron' => env('DEMO_REFRESH_CRON'),
    'allow_default_passwords' => $bool('DEMO_ALLOW_DEFAULT_PASSWORDS', false),
    'require_dedicated_database' => $bool('DEMO_REQUIRE_DEDICATED_DATABASE', true),
    // Keep demo logins intentionally simple and public. The login page may render this value directly.
    'login_password' => env('DEMO_LOGIN_PASSWORD', env('DEMO_DEFAULT_PASSWORD', 'demo-password')),
    // Deprecated aliases kept for backwards compatibility with older env files.
    'default_password' => env('DEMO_DEFAULT_PASSWORD', env('DEMO_LOGIN_PASSWORD', 'demo-password')),
    'admin_password' => env('DEMO_ADMIN_PASSWORD', env('DEMO_LOGIN_PASSWORD', env('DEMO_DEFAULT_PASSWORD', 'demo-password'))),
    'notice' => env(
        'DEMO_NOTICE',
        'Demo mode is active. Changes may be reset automatically and some admin actions are disabled.'
    ),
    'capabilities' => [
        'password_change' => $bool('DEMO_ALLOW_PASSWORD_CHANGE'),
        'user_management' => $bool('DEMO_ALLOW_USER_MANAGEMENT'),
        'settings_management' => $bool('DEMO_ALLOW_GLOBAL_SETTINGS_WRITE'),
        'holiday_management' => $bool('DEMO_ALLOW_HOLIDAY_WRITE'),
        'blackout_management' => $bool('DEMO_ALLOW_BLACKOUT_WRITE'),
        'work_schedule_management' => $bool('DEMO_ALLOW_WORK_SCHEDULE_WRITE'),
        'vacation_ledger_management' => $bool('DEMO_ALLOW_VACATION_LEDGER_WRITE'),
        'work_time_account_management' => $bool('DEMO_ALLOW_WORK_TIME_ACCOUNT_WRITE'),
        'cost_center_management' => $bool('DEMO_ALLOW_COST_CENTER_WRITE'),
        'user_group_management' => $bool('DEMO_ALLOW_USER_GROUP_WRITE'),
        'user_cost_center_management' => $bool('DEMO_ALLOW_USER_COST_CENTER_WRITE'),
        'time_lock_management' => $bool('DEMO_ALLOW_TIME_LOCK_WRITE'),
        'vacation_requests' => $bool('DEMO_ALLOW_VACATION_WRITE', true),
        'absence_requests' => $bool('DEMO_ALLOW_ABSENCE_WRITE', true),
        'time_tracking' => $bool('DEMO_ALLOW_TIME_TRACKING_WRITE', true),
        'time_booking_templates' => $bool('DEMO_ALLOW_TIME_BOOKING_TEMPLATE_WRITE', true),
        'favorites' => $bool('DEMO_ALLOW_COST_CENTER_FAVORITES_WRITE', true),
        'admin_reviews' => $bool('DEMO_ALLOW_ADMIN_REVIEW_WRITE', true),
    ],
    'messages' => [
        'password_change' => 'Password changes are disabled in demo mode.',
        'user_management' => 'User management is disabled in demo mode.',
        'settings_management' => 'Global settings cannot be changed in demo mode.',
        'holiday_management' => 'Holiday management is disabled in demo mode.',
        'blackout_management' => 'Blackout management is disabled in demo mode.',
        'work_schedule_management' => 'Work schedule management is disabled in demo mode.',
        'vacation_ledger_management' => 'Vacation ledger adjustments are disabled in demo mode.',
        'work_time_account_management' => 'Working time account adjustments are disabled in demo mode.',
        'cost_center_management' => 'Cost center management is disabled in demo mode.',
        'user_group_management' => 'User group management is disabled in demo mode.',
        'user_cost_center_management' => 'Cost center assignment is disabled in demo mode.',
        'time_lock_management' => 'Time locking is disabled in demo mode.',
        'vacation_requests' => 'Vacation requests are disabled in demo mode.',
        'absence_requests' => 'Absence requests are disabled in demo mode.',
        'time_tracking' => 'Time tracking changes are disabled in demo mode.',
        'time_booking_templates' => 'Template changes are disabled in demo mode.',
        'favorites' => 'Favorite changes are disabled in demo mode.',
        'admin_reviews' => 'Admin review actions are disabled in demo mode.',
    ],
];
