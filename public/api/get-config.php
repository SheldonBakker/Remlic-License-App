<?php
define('SECURE_ACCESS', true);
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

try {
    $config = require_once('config.php');
    
    // Only return specific keys needed for the client
    echo json_encode([
        'SUPABASE_URL' => $config['SUPABASE_URL'],
        'SUPABASE_ANON_KEY' => $config['SUPABASE_ANON_KEY'],
        'PAYSTACK_PUBLIC_KEY' => $config['PAYSTACK_PUBLIC_KEY'],
        'PAYSTACK_TIER1_PLAN_CODE' => $config['PAYSTACK_TIER1_PLAN_CODE'],
        'PAYSTACK_TIER2_PLAN_CODE' => $config['PAYSTACK_TIER2_PLAN_CODE'],
        'PAYSTACK_TIER3_PLAN_CODE' => $config['PAYSTACK_TIER3_PLAN_CODE'],
        'PAYSTACK_TIER4_PLAN_CODE' => $config['PAYSTACK_TIER4_PLAN_CODE'],
        'PAYSTACK_PREMIUM_PLAN_CODE' => $config['PAYSTACK_PREMIUM_PLAN_CODE'],
        'PAYSTACK_TIER1_MONTHLY_PLAN_CODE' => $config['PAYSTACK_TIER1_MONTHLY_PLAN_CODE'],
        'PAYSTACK_TIER2_MONTHLY_PLAN_CODE' => $config['PAYSTACK_TIER2_MONTHLY_PLAN_CODE'],
        'PAYSTACK_TIER3_MONTHLY_PLAN_CODE' => $config['PAYSTACK_TIER3_MONTHLY_PLAN_CODE'],
        'PAYSTACK_TIER4_MONTHLY_PLAN_CODE' => $config['PAYSTACK_TIER4_MONTHLY_PLAN_CODE'],
        'PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE' => $config['PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE']
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}
