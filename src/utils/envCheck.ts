export const checkEnvironmentVariables = () => {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    VITE_PAYSTACK_TIER1_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER1_PLAN_CODE,
    VITE_PAYSTACK_TIER2_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER2_PLAN_CODE,
    VITE_PAYSTACK_TIER3_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER3_PLAN_CODE,
    VITE_PAYSTACK_TIER4_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER4_PLAN_CODE,
    VITE_PAYSTACK_PREMIUM_PLAN_CODE: import.meta.env.VITE_PAYSTACK_PREMIUM_PLAN_CODE,
    VITE_PAYSTACK_TIER1_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER1_MONTHLY_PLAN_CODE,
    VITE_PAYSTACK_TIER2_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER2_MONTHLY_PLAN_CODE,
    VITE_PAYSTACK_TIER3_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER3_MONTHLY_PLAN_CODE,
    VITE_PAYSTACK_TIER4_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER4_MONTHLY_PLAN_CODE,
    VITE_PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE,
  }

  console.group('🔍 Environment Variables Check')
  console.log('Mode:', import.meta.env.MODE)
  console.log('Dev:', import.meta.env.DEV)
  console.log('Prod:', import.meta.env.PROD)
  
  const missing: string[] = []
  const present: string[] = []

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key)
      console.error(`❌ ${key}: MISSING`)
    } else {
      present.push(key)
      console.log(`✅ ${key}: ${value.substring(0, 20)}...`)
    }
  })

  console.log('\nSummary:')
  console.log(`✅ Present: ${present.length}`)
  console.log(`❌ Missing: ${missing.length}`)
  
  if (missing.length > 0) {
    console.error('\nMissing variables:', missing)
  }
  
  console.groupEnd()

  return {
    allPresent: missing.length === 0,
    missing,
    present
  }
}

