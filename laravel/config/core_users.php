<?php

return [
    'fixed_users' => [
        [
            'email' => env('BSW_FIXED_USER_EMAIL'),
            'role' => 'user',
        ],
        [
            'email' => env('BSW_FIXED_ADMIN_EMAIL'),
            'role' => 'admin',
        ],
        [
            'email' => env('BSW_FIXED_SUPERADMIN_EMAIL_1'),
            'role' => 'super_admin',
        ],
        [
            'email' => env('BSW_FIXED_SUPERADMIN_EMAIL_2'),
            'role' => 'super_admin',
        ],
    ],
    'fixed_password' => env('BSW_FIXED_USERS_PASSWORD', 'c4c4v4c4'),
];
