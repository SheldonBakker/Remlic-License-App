<?php
header('Content-Type: application/json');

// Prevent direct file access
if (!defined('SECURE_ACCESS')) {
    http_response_code(403);
    die('Direct access not permitted');
}

return [
    'PAYSTACK_PUBLIC_KEY' => 'pk_live_55224ba86e9b61916f80bc6a5e0e652bbf0b3659',
    'SUPABASE_URL' => 'https://ywlyafdtnbozflknjsip.supabase.co',
    'SUPABASE_ANON_KEY' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3bHlhZmR0bmJvemZsa25qc2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3NjQ4MDQsImV4cCI6MjA0ODM0MDgwNH0.dWNf7EYpZeR5yyd52DLMR9P69upIVXKKZy42dNcAlz8',
    'PAYSTACK_TIER1_PLAN_CODE' => 'PLN_nomqaqstb06fi2q',
    'PAYSTACK_TIER2_PLAN_CODE' => 'PLN_ero7dmueata5z0k',
    'PAYSTACK_TIER3_PLAN_CODE' => 'PLN_5s45g09vhcqfnxh',
    'PAYSTACK_TIER4_PLAN_CODE' => 'PLN_8jy5cz7x0i3yo9d',
    'PAYSTACK_PREMIUM_PLAN_CODE' => 'PLN_2psgre5bq7th7sm'
];
