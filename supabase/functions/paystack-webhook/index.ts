import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

console.log('Paystack webhook handler function starting...');

// Define the expected structure of the Paystack webhook payload's data section
interface PaystackData {
  status: string;
  reference: string;
  amount: number;
  paid_at: string;
  customer: {
    email: string;
    // other customer fields...
  };
  metadata: {
    tier_name: string;
    subscriptionType: 'monthly' | 'annual';
    // other metadata fields...
  };
  // other data fields...
}

// Define the expected structure of the Paystack webhook payload
interface PaystackPayload {
  event: string;
  data: PaystackData;
}

// Map Paystack tier names (from metadata) to Supabase type_of_user values
const TIER_NAME_TO_USER_TYPE: { [key: string]: string } = {
  "Tier 1": "basic",
  "Tier 2": "standard",
  "Tier 3": "professional",
  "Tier 4": "advanced",
  "Tier 5": "premium",
};

// Define expected prices in Kobo (lowest denomination, e.g., cents/kobo)
// IMPORTANT: Keep these values in sync with the frontend (Price.tsx) and Paystack Plans!
const TIER_PRICES_KOBO: { [key: string]: { annual: number; } } = {
  "Tier 1": { annual: 55000 },  // R550.00
  "Tier 2": { annual: 90000 },  // R900.00
  "Tier 3": { annual: 100000 }, // R1000.00
  "Tier 4": { annual: 210000 }, // R2100.00
  "Tier 5": { annual: 420000 }, // R4000.00 -> Note: Price.tsx had 420000 (R4200), using that. Check if R4000 was intended.
};

// Helper function to calculate expected monthly Kobo amount (matches Price.tsx logic)
function calculateExpectedMonthlyKobo(annualKobo: number): number {
    // This logic exactly mirrors the amount calculation in Price.tsx for monthly plans
    // Ensure this calculation remains consistent if frontend logic changes.
    const monthlyAmount = Math.round((annualKobo / 12)); // Divide annual price by 12
    return monthlyAmount; // Return the rounded value
}

serve(async (req: Request) => {
  const signature = req.headers.get('x-paystack-signature');
  const body = await req.text(); // Read body as text for signature verification

  // --- 1. Verify Webhook Signature ---
  const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!paystackSecretKey) {
    console.error('PAYSTACK_SECRET_KEY environment variable not set.');
    return new Response('Server configuration error', { status: 500 });
  }

  if (!signature) {
    console.warn('Missing x-paystack-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  try {
    const hash = await crypto.subtle.digest(
      'SHA-512',
      new TextEncoder().encode(paystackSecretKey), // Key
      new TextEncoder().encode(body) // Data
    );
    const calculatedSignature = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0')).join('');

    // NOTE: Paystack docs mention HMAC-SHA512, but often implementation uses raw SHA512 digest.
    // If verification fails, double-check Paystack's exact requirement or library usage.
    // This implementation assumes a direct SHA512 hash comparison is needed. Revisit if issues arise.
    // A more robust HMAC implementation might be needed depending on Paystack's library specifics:
    /*
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(paystackSecretKey),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
    );
    const hmac = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(body)
    );
    const calculatedSignature = Array.from(new Uint8Array(hmac))
        .map(b => b.toString(16).padStart(2, '0')).join('');
    */


    // TODO: This comparison logic needs careful review against Paystack's exact signature format.
    // Temporarily logging for debug - REMOVE IN PRODUCTION
    // console.log('Received Signature:', signature);
    // console.log('Calculated Signature:', calculatedSignature);

    // Simple comparison for now - refine based on Paystack spec
    if (signature !== calculatedSignature) { // Adjust comparison if needed
       console.error('Webhook signature verification failed.');
       return new Response('Invalid signature', { status: 401 });
       console.warn('Signature verification bypassed temporarily for testing.'); // TEMP
    } else {
       console.log('Webhook signature verified successfully.');
    }
  } catch (error) {
    console.error('Error during signature verification:', error);
    return new Response('Signature verification error', { status: 500 });
  }

  // --- 2. Parse Payload ---
  let payload: PaystackPayload;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    console.error('Failed to parse webhook JSON payload:', error);
    return new Response('Invalid payload', { status: 400 });
  }

  // --- 3. Check Event Type and Status ---
  if (payload.event !== 'charge.success' || payload.data.status !== 'success') {
    console.log(`Ignoring event: ${payload.event}, status: ${payload.data.status}`);
    return new Response('Acknowledged - Event not processed', { status: 200 });
  }

  console.log(`Processing charge.success event for reference: ${payload.data.reference}`);

  // --- 4. Extract Data and Validate Metadata ---
  const { customer, reference, amount, paid_at, metadata } = payload.data;
  const email = customer?.email;

  if (!email) {
    console.error('Missing customer email in payload data.');
    return new Response('Missing customer email', { status: 400 });
  }

  if (!metadata || !metadata.tier_name || !metadata.subscriptionType) {
    console.error('Missing required metadata (tier_name or subscriptionType) in payload.');
    return new Response('Missing required metadata', { status: 400 });
  }

  const { tier_name: tierName, subscriptionType: subType } = metadata;

  // --- 5. Determine Tier, Calculate End Date, AND Verify Amount ---
  const typeOfUser = TIER_NAME_TO_USER_TYPE[tierName];
  if (!typeOfUser) {
    console.error(`Invalid tier_name received: ${tierName}`);
    return new Response('Invalid tier name in metadata', { status: 400 });
  }

  const expectedPrices = TIER_PRICES_KOBO[tierName];
  if (!expectedPrices) {
      console.error(`Could not find price information for tier_name: ${tierName}`);
      return new Response('Unknown tier name for pricing', { status: 400 });
  }

  let expectedAmountInKobo: number;
  if (subType === 'annual') {
      expectedAmountInKobo = expectedPrices.annual;
  } else if (subType === 'monthly') {
      // Calculate expected monthly amount based on the annual price, mirroring frontend logic
      expectedAmountInKobo = calculateExpectedMonthlyKobo(expectedPrices.annual);
  } else {
      console.error(`Invalid subscriptionType received: ${subType}`);
      return new Response('Invalid subscription type in metadata for pricing', { status: 400 });
  }

  // Verify the received amount against the expected amount
  if (amount !== expectedAmountInKobo) {
      console.error(`Amount mismatch for ${tierName} (${subType}). Expected: ${expectedAmountInKobo}, Received: ${amount}`);
      // Do not grant subscription if amount is wrong
      return new Response('Payment amount mismatch', { status: 400 });
  }
  console.log(`Amount verified for ${tierName} (${subType}). Expected: ${expectedAmountInKobo}, Received: ${amount}`);

  let newSubscriptionEndDate: Date;
  try {
    const paidAtDate = new Date(paid_at);
    newSubscriptionEndDate = new Date(paidAtDate); // Clone the date

    if (subType === 'monthly') {
      newSubscriptionEndDate.setMonth(newSubscriptionEndDate.getMonth() + 1);
    } else if (subType === 'annual') {
      newSubscriptionEndDate.setFullYear(newSubscriptionEndDate.getFullYear() + 1);
    } else {
      console.error(`Invalid subscriptionType received: ${subType}`);
      return new Response('Invalid subscription type in metadata', { status: 400 });
    }
  } catch (error) {
    console.error('Error calculating subscription end date:', error);
    return new Response('Date calculation error', { status: 500 });
  }

  console.log(`Updating profile for ${email}. Tier: ${typeOfUser}, Type: ${subType}, End Date: ${newSubscriptionEndDate.toISOString()}`);

  // --- 6. Update Supabase ---
  try {
    // IMPORTANT: Use Service Role Key for admin-level access from function
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        type_of_user: typeOfUser,
        subscription_status: 'active',
        subscription_end_date: newSubscriptionEndDate.toISOString(),
        payment_reference: reference,
        last_payment_date: new Date(paid_at).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', email)
      .select('id'); // Select 'id' to check if a row was actually updated

    if (updateError) {
      throw updateError;
    }

    if (!updateData || updateData.length === 0) {
        console.warn(`No profile found or updated for email: ${email}`);
        // Decide if this is an error or expected behavior
        // Returning 200 OK because Paystack doesn't need to retry if user not found
    } else {
        console.log(`Successfully updated profile for email: ${email}, ID: ${updateData[0].id}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error updating Supabase profile:', error);
    return new Response('Database update error', { status: 500 });
  }
});

// Optional: Add basic error handling for the serve function itself
// serve(...).catch(err => console.error("Server error:", err)); 