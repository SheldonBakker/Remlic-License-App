/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PAYSTACK_PUBLIC_KEY: string
  readonly VITE_PAYSTACK_TIER1_PLAN_CODE: string
  readonly VITE_PAYSTACK_TIER2_PLAN_CODE: string
  readonly VITE_PAYSTACK_TIER3_PLAN_CODE: string
  readonly VITE_PAYSTACK_TIER4_PLAN_CODE: string
  readonly VITE_PAYSTACK_PREMIUM_PLAN_CODE: string
  readonly VITE_PAYSTACK_TIER1_MONTHLY_PLAN_CODE: string
  readonly VITE_PAYSTACK_TIER2_MONTHLY_PLAN_CODE: string
  readonly VITE_PAYSTACK_TIER3_MONTHLY_PLAN_CODE: string
  readonly VITE_PAYSTACK_TIER4_MONTHLY_PLAN_CODE: string
  readonly VITE_PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
