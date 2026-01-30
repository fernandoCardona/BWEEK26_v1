<?php

return [
    'vat_rate' => (float) env('BSW_VAT_RATE', 21.0),
    'series' => [
        'proforma' => (string) env('BSW_PROFORMA_SERIES', 'PF'),
        'invoice' => (string) env('BSW_INVOICE_SERIES', 'F'),
    ],
    'issuer' => [
        'name' => (string) env('BSW_BILLING_ISSUER_NAME', 'Bears Sitges Week'),
        'tax_id' => (string) env('BSW_BILLING_ISSUER_TAX_ID', ''),
        'address_line1' => (string) env('BSW_BILLING_ISSUER_ADDRESS1', ''),
        'address_line2' => (string) env('BSW_BILLING_ISSUER_ADDRESS2', ''),
        'postal_code' => (string) env('BSW_BILLING_ISSUER_POSTAL_CODE', ''),
        'city' => (string) env('BSW_BILLING_ISSUER_CITY', ''),
        'province' => (string) env('BSW_BILLING_ISSUER_PROVINCE', ''),
        'country' => (string) env('BSW_BILLING_ISSUER_COUNTRY', 'España'),
        'email' => (string) env('BSW_BILLING_ISSUER_EMAIL', ''),
        'phone' => (string) env('BSW_BILLING_ISSUER_PHONE', ''),
    ],
];

