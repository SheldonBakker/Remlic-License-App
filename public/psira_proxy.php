<?php

// Set the content type to JSON for the response
header('Content-Type: application/json');

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['message' => 'Error: Only POST requests are accepted.']);
    exit;
}

// Get the raw POST data
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true); // Decode JSON into an associative array

// --- Basic Input Validation ---
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(['message' => 'Error: Invalid JSON input.']);
    exit;
}

// Check if we're searching by PSIRA number or ID number
$usesPsiraNumber = isset($inputData['usesPsiraNumber']) && $inputData['usesPsiraNumber'] === true;

if ($usesPsiraNumber) {
    // Validate PSIRA number input
    if (!isset($inputData['psiraNumber']) || empty($inputData['psiraNumber'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['message' => 'Error: Missing psiraNumber field.']);
        exit;
    }
    
    $psiraNumber = $inputData['psiraNumber'];
    
    // Basic validation for PSIRA number (must not be empty after trim)
    if (trim($psiraNumber) === '') {
        http_response_code(400); // Bad Request
        echo json_encode(['message' => 'Error: Invalid PSIRA Number format.']);
        exit;
    }
} else {
    // Original ID number validation
    if (!isset($inputData['idNumber']) || empty($inputData['idNumber'])) {
        http_response_code(400); // Bad Request
        echo json_encode(['message' => 'Error: Missing idNumber field.']);
        exit;
    }
    
    $idNumber = $inputData['idNumber'];
    
    // More specific ID number validation (length, numeric)
    if (strlen($idNumber) !== 13 || !ctype_digit($idNumber)) {
        http_response_code(400); // Bad Request
        echo json_encode(['message' => 'Error: Invalid ID Number format provided to proxy.']);
        exit;
    }
}

// --- Prepare for PSIRA API Call ---
$psiraApiUrl = 'https://psiraapi.sortelearn.com/api/SecurityOfficer/Get_ApplicantDetails';

// Construct the payload required by the actual PSIRA API
$psiraPayload = [
    "ApplicationNo" => "",
    "ContactNo" => null,
    "IDNumber" => $usesPsiraNumber ? "" : $idNumber, // Use ID number if that's what was provided
    "SIRANo" => $usesPsiraNumber ? $psiraNumber : "", // Use PSIRA number if that's what was provided
    "CompanyName" => "",
    "ProfileId" => "4" // Keep this as "4" based on previous findings
];

$psiraPayloadJson = json_encode($psiraPayload);

// --- Make the cURL Request to PSIRA API ---
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $psiraApiUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $psiraPayloadJson);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); // Return response as a string
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json, text/plain, */*',
    'Content-Length: ' . strlen($psiraPayloadJson),
    'skip: true',
    'Referer: https://digitalservices.psira.co.za',
    'Origin: https://digitalservices.psira.co.za'
    // Previously: DO NOT set Origin, Referer, etc. unless absolutely proven necessary
    // Now: These headers are required for the PSIRA API to accept the request
]);
// Set timeout to prevent script hanging indefinitely (e.g., 30 seconds)
curl_setopt($ch, CURLOPT_TIMEOUT, 30); 
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);

// Execute the request
$responseBody = curl_exec($ch);
$httpStatusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); // Get HTTP status code
$curlError = curl_error($ch); // Get cURL specific errors (e.g., connection refused)
$curlErrno = curl_errno($ch); // Get cURL error number

curl_close($ch);

// --- Handle the Response ---
if ($curlErrno) {
    // Handle cURL errors (network level, DNS, timeout, etc.)
    http_response_code(502); // Bad Gateway (indicates proxy couldn't reach upstream)
    echo json_encode([
        'message' => 'Proxy Error: Failed to connect to the PSIRA API.',
        'curl_error_code' => $curlErrno,
        'curl_error_message' => $curlError
    ]);
    exit;
}

// Enhanced error handling for API errors (e.g. 500 Internal Server Error)
if ($httpStatusCode >= 400) {
    // Forward the status code received from PSIRA
    http_response_code($httpStatusCode);
    
    // Try to decode the response to see if there's useful error information
    $decodedResponse = json_decode($responseBody, true);
    $errorMessage = isset($decodedResponse['Message']) ? $decodedResponse['Message'] : 'Unknown API error';
    
    echo json_encode([
        'message' => 'PSIRA API Error: ' . $errorMessage,
        'status_code' => $httpStatusCode,
        'response_body' => $responseBody
    ]);
    exit;
}

// Forward the status code received from PSIRA
http_response_code($httpStatusCode); 

// Echo the raw response body received from PSIRA directly to the frontend
// The frontend JavaScript will parse this JSON as before
echo $responseBody;

?>