export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  paystack: {
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    plans: {
      tier1: import.meta.env.VITE_PAYSTACK_TIER1_PLAN_CODE,
      tier2: import.meta.env.VITE_PAYSTACK_TIER2_PLAN_CODE,
      tier3: import.meta.env.VITE_PAYSTACK_TIER3_PLAN_CODE,
      tier4: import.meta.env.VITE_PAYSTACK_TIER4_PLAN_CODE,
      premium: import.meta.env.VITE_PAYSTACK_PREMIUM_PLAN_CODE,
      tier1Monthly: import.meta.env.VITE_PAYSTACK_TIER1_MONTHLY_PLAN_CODE,
      tier2Monthly: import.meta.env.VITE_PAYSTACK_TIER2_MONTHLY_PLAN_CODE,
      tier3Monthly: import.meta.env.VITE_PAYSTACK_TIER3_MONTHLY_PLAN_CODE,
      tier4Monthly: import.meta.env.VITE_PAYSTACK_TIER4_MONTHLY_PLAN_CODE,
      premiumMonthly: import.meta.env.VITE_PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE,
    },
  },
}

const validateConfig = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_PAYSTACK_PUBLIC_KEY',
    'VITE_PAYSTACK_TIER1_PLAN_CODE',
    'VITE_PAYSTACK_TIER2_PLAN_CODE',
    'VITE_PAYSTACK_TIER3_PLAN_CODE',
    'VITE_PAYSTACK_TIER4_PLAN_CODE',
    'VITE_PAYSTACK_PREMIUM_PLAN_CODE',
    'VITE_PAYSTACK_TIER1_MONTHLY_PLAN_CODE',
    'VITE_PAYSTACK_TIER2_MONTHLY_PLAN_CODE',
    'VITE_PAYSTACK_TIER3_MONTHLY_PLAN_CODE',
    'VITE_PAYSTACK_TIER4_MONTHLY_PLAN_CODE',
    'VITE_PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE',
  ]

  const missing = requiredVars.filter(varName => !import.meta.env[varName])

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing)
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

if (import.meta.env.MODE !== 'test') {
  validateConfig()
}

