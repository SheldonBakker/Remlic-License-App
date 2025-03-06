<?php
header('Content-Type: application/json');

// Prevent direct file access
if (!defined('SECURE_ACCESS')) {
    http_response_code(404);
    die('Page not found');
}

// Check if request is coming from your domain
$allowed_referer = 'https://remlic.co.za';
if (!isset($_SERVER['HTTP_REFERER']) || 
    parse_url($_SERVER['HTTP_REFERER'], PHP_URL_HOST) !== parse_url($allowed_referer, PHP_URL_HOST)) {
    http_response_code(404);
    header('Location: /404'); // Redirect to a 404 page
    exit; // Ensure no further code is executed
}

return [
    'PAYSTACK_PUBLIC_KEY' => 'pk_live_55224ba86e9b61916f80bc6a5e0e652bbf0b3659',
    'SUPABASE_URL' => 'https://ywlyafdtnbozflknjsip.supabase.co',
    'SUPABASE_ANON_KEY' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bHlhZmR0bmJvemZsa25qc2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxMzIyOTIsImV4cCI6MjA0OTcwODI5Mn0.iG92jkUL3ZLpNKMUH0KSp4vS6R4NME3bJlgsjiwAUcM',
    'PAYSTACK_TIER1_PLAN_CODE' => 'PLN_nomqaqstb06fi2q',
    'PAYSTACK_TIER2_PLAN_CODE' => 'PLN_ero7dmueata5z0k',
    'PAYSTACK_TIER3_PLAN_CODE' => 'PLN_5s45g09vhcqfnxh',
    'PAYSTACK_TIER4_PLAN_CODE' => 'PLN_8jy5cz7x0i3yo9d',
    'PAYSTACK_PREMIUM_PLAN_CODE' => 'PLN_2psgre5bq7th7sm',
    'PAYSTACK_TIER1_MONTHLY_PLAN_CODE' => 'PLN_vfrgvsa6cdl0yjq',
    'PAYSTACK_TIER2_MONTHLY_PLAN_CODE' => 'PLN_bdhfvx0eluta2t1',
    'PAYSTACK_TIER3_MONTHLY_PLAN_CODE' => 'PLN_520arv1frw7ypgc',
    'PAYSTACK_TIER4_MONTHLY_PLAN_CODE' => 'PLN_9746enrrjg0i9v7',
    'PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE' => 'PLN_qoufjz4q3h38y6e'
];
