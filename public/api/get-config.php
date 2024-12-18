<?php
define('SECURE_ACCESS', true);
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
    'PAYSTACK_PREMIUM_PLAN_CODE' => $config['PAYSTACK_PREMIUM_PLAN_CODE']
]);
