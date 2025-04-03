/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router-dom";
import { FiCheck } from "react-icons/fi";
import { useUser } from "../hooks/useUser";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import PaystackPop, {
  PaystackOptions,
  PaystackResponse,
} from "@paystack/inline-js";
import { useState, useEffect, useMemo, useCallback } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { TIER_LICENSE_LIMITS } from '../constants/licenses';

interface ExtendedPaystackOptions extends PaystackOptions {
  plan?: string;
  subaccount?: string;
  channels?: string[];
}

interface Config {
  PAYSTACK_PUBLIC_KEY: string;
  PAYSTACK_TIER1_PLAN_CODE: string;
  PAYSTACK_TIER2_PLAN_CODE: string;
  PAYSTACK_TIER3_PLAN_CODE: string;
  PAYSTACK_TIER4_PLAN_CODE: string;
  PAYSTACK_PREMIUM_PLAN_CODE: string;
  PAYSTACK_TIER1_MONTHLY_PLAN_CODE: string;
  PAYSTACK_TIER2_MONTHLY_PLAN_CODE: string;
  PAYSTACK_TIER3_MONTHLY_PLAN_CODE: string;
  PAYSTACK_TIER4_MONTHLY_PLAN_CODE: string;
  PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE: string;
}

const fetchConfig = async (): Promise<Config> => {
  // Check if running in development mode (Vite uses import.meta.env)
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    try {
      // In development mode, use environment variables
      return {
        PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
        PAYSTACK_TIER1_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER1_PLAN_CODE || '',
        PAYSTACK_TIER2_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER2_PLAN_CODE || '',
        PAYSTACK_TIER3_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER3_PLAN_CODE || '',
        PAYSTACK_TIER4_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER4_PLAN_CODE || '',
        PAYSTACK_PREMIUM_PLAN_CODE: import.meta.env.VITE_PAYSTACK_PREMIUM_PLAN_CODE || '',
        PAYSTACK_TIER1_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER1_MONTHLY_PLAN_CODE || '',
        PAYSTACK_TIER2_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER2_MONTHLY_PLAN_CODE || '',
        PAYSTACK_TIER3_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER3_MONTHLY_PLAN_CODE || '',
        PAYSTACK_TIER4_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_TIER4_MONTHLY_PLAN_CODE || '',
        PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE: import.meta.env.VITE_PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE || '',
      };
    } catch (error) {
      console.error('Failed to load environment variables:', error);
      toast.error('Failed to load configuration from environment variables');
      throw new Error('Could not load configuration from environment variables');
    }
  } else {
    // In production, use the API endpoint
    try {
      const response = await fetch('/api/get-config.php');
      if (!response.ok) throw new Error('Failed to fetch config from API');
      return await response.json();
    } catch (error) {
      console.error('Failed to load config from API:', error);
      toast.error('Failed to load configuration from server');
      throw error;
    }
  }
};

const Price = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setIsCheckingSubscription] = useState(false);
  const [currentUserTier, setCurrentUserTier] = useState<string | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'annual'>('annual');

  const tiers = useMemo(
    () => [
      {
        name: "Tier 1",
        price: "550",
        priceInKobo: 55000,
        monthlyPrice: "50",
        licenses: TIER_LICENSE_LIMITS.basic,
        highlight: false,
        features: [`${TIER_LICENSE_LIMITS.basic} licenses per category`],
      },
      {
        name: "Tier 2",
        price: "900",
        priceInKobo: 90000,
        monthlyPrice: "80",
        licenses: TIER_LICENSE_LIMITS.standard,
        highlight: false,
        features: [`${TIER_LICENSE_LIMITS.standard} licenses per category`],
      },
      {
        name: "Tier 3",
        price: "1000",
        priceInKobo: 100000,
        monthlyPrice: "100",
        licenses: TIER_LICENSE_LIMITS.professional,
        highlight: false,
        features: [`${TIER_LICENSE_LIMITS.professional} licenses per category`],
      },
      {
        name: "Tier 4",
        price: "2100",
        priceInKobo: 210000,
        monthlyPrice: "200",
        licenses: TIER_LICENSE_LIMITS.advanced,
        highlight: true,
        features: [`${TIER_LICENSE_LIMITS.advanced} licenses per category`],
      },
      {
        name: "Tier 5",
        price: "4000",
        priceInKobo: 420000,
        monthlyPrice: "350",
        licenses: TIER_LICENSE_LIMITS.premium,
        highlight: false,
        features: ["Unlimited licenses per category"],
      },
    ],
    []
  );

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const client = await supabase;
        const { data, error } = await client
          .from("profiles")
          .select("subscription_status, subscription_end_date, type_of_user")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setSubscriptionData(data);
        setCurrentUserTier(data.type_of_user);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Failed to load subscription data");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast.error("Loading timed out. Please refresh the page.");
    }, 10000);

    fetchSubscriptionData();

    return () => clearTimeout(timeoutId);
  }, [user?.id]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configData = await fetchConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Failed to load config:', error);
        toast.error('Failed to load configuration');
      }
    };
    loadConfig();
  }, []);

  const handleSubscription = useCallback(
    async (tierName: string) => {
      if (!user?.email) {
        toast.error("Please log in to subscribe");
        return;
      }

      if (!config) {
        toast.error("Configuration not loaded");
        return;
      }

      try {
        setIsCheckingSubscription(true);
        setIsProcessingPayment(true);

        const client = await supabase;
        const { data: profile, error: profileError } = await client
          .from("profiles")
          .select("subscription_status, type_of_user")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const tierToTypeMap: { [key: string]: string } = {
          "Tier 1": "basic",
          "Tier 2": "standard",
          "Tier 3": "professional",
          "Tier 4": "advanced",
          "Tier 5": "premium",
        };

        if (profile?.type_of_user === tierToTypeMap[tierName]) {
          toast.info("You are already subscribed to this plan");
          setIsProcessingPayment(false);
          return;
        }

        const paystackKey = config.PAYSTACK_PUBLIC_KEY;
        const planCode =
          subscriptionType === 'annual'
            ? tierName === "Tier 1"
              ? config.PAYSTACK_TIER1_PLAN_CODE
              : tierName === "Tier 2"
              ? config.PAYSTACK_TIER2_PLAN_CODE
              : tierName === "Tier 3"
              ? config.PAYSTACK_TIER3_PLAN_CODE
              : tierName === "Tier 4"
              ? config.PAYSTACK_TIER4_PLAN_CODE
              : config.PAYSTACK_PREMIUM_PLAN_CODE
            : tierName === "Tier 1"
            ? config.PAYSTACK_TIER1_MONTHLY_PLAN_CODE
            : tierName === "Tier 2"
            ? config.PAYSTACK_TIER2_MONTHLY_PLAN_CODE
            : tierName === "Tier 3"
            ? config.PAYSTACK_TIER3_MONTHLY_PLAN_CODE
            : tierName === "Tier 4"
            ? config.PAYSTACK_TIER4_MONTHLY_PLAN_CODE
            : config.PAYSTACK_PREMIUM_MONTHLY_PLAN_CODE;

        if (!paystackKey) {
          throw new Error("Paystack public key not found");
        }

        const selectedTier = tiers.find((tier) => tier.name === tierName);
        if (!selectedTier) {
          toast.error("Invalid tier selected");
          return;
        }

        const amount = subscriptionType === 'annual' 
          ? selectedTier.priceInKobo 
          : Math.round((selectedTier.priceInKobo / 12) * 100);

        if (amount < 100) {
          toast.error("Invalid subscription amount");
          return;
        }

        const paystack = new PaystackPop();
        const paystackOptions: ExtendedPaystackOptions = {
          key: paystackKey,
          email: user.email,
          amount: amount,
          currency: "ZAR",
          plan: planCode,
          channels: ["card"],
          metadata: {
            tier_name: tierName,
            custom_fields: [
              {
                display_name: "Tier",
                variable_name: "tier",
                value: tierName,
              },
            ],
            type: tierToTypeMap[tierName],
            subscriptionType,
          },
          onSuccess: async (response: PaystackResponse) => {
            try {
              const startDate = new Date();
              const endDate = new Date(startDate);
              if (subscriptionType === 'monthly') {
                endDate.setMonth(endDate.getMonth() + 1);
              } else {
                endDate.setFullYear(endDate.getFullYear() + 1);
              }

              const typeOfUserMap: { [key: string]: string } = {
                "Tier 1": "basic",
                "Tier 2": "standard",
                "Tier 3": "professional",
                "Tier 4": "advanced",
                "Tier 5": "premium",
              };

              const updateData = {
                type_of_user: typeOfUserMap[tierName],
                subscription_status: "active",
                subscription_end_date: endDate.toISOString(),
                payment_reference: response.reference,
                last_payment_date: startDate.toISOString(),
                updated_at: new Date().toISOString(),
              };

              const { error: updateError } = await client
                .from("profiles")
                .update(updateData)
                .eq("id", user.id);

              if (updateError) throw updateError;
              toast.success("Successfully subscribed!");
              navigate("/profile");
            } catch (error: any) {
              console.error("Error updating subscription:", error);
              toast.error("Payment successful but failed to update subscription status. Please contact support.");
            } finally {
              setIsProcessingPayment(false);
            }
          },
          onCancel: () => {
            toast.error("Subscription cancelled");
            setIsProcessingPayment(false);
          },
        };

        paystack.newTransaction(paystackOptions);
      } catch (error: any) {
        console.error("Subscription error:", error);
        toast.error("Failed to process subscription. Please try again later.");
        setIsProcessingPayment(false);
      } finally {
        setIsCheckingSubscription(false);
      }
    },
    [user?.email, user?.id, navigate, tiers, config, subscriptionType]
  );

  const renderActionButton = useMemo(
    () => (tier: (typeof tiers)[0]) => {
      if (!user) {
        return (
          <div className="space-y-3 relative z-10">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full px-6 py-3 rounded-xl transition-all duration-300
              bg-gradient-to-r from-indigo-500 to-purple-600
              hover:from-indigo-600 hover:to-purple-700
              text-white font-medium text-sm
              shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40
              cursor-pointer hover:scale-[1.02]
              relative z-10"
            >
              Sign In to Subscribe
            </button>
          </div>
        );
      }

      const tierToTypeMap: { [key: string]: string } = {
        "Tier 1": "basic",
        "Tier 2": "standard",
        "Tier 3": "professional",
        "Tier 4": "advanced",
        "Tier 5": "premium",
      };

      const tierLevelMap: { [key: string]: number } = {
        basic: 1,
        standard: 2,
        professional: 3,
        advanced: 4,
        premium: 5,
      };

      const isCurrentPlan = currentUserTier === tierToTypeMap[tier.name];
      const currentTierLevel = currentUserTier ? tierLevelMap[currentUserTier] : 0;
      const thisTierLevel = tierLevelMap[tierToTypeMap[tier.name]];
      const isLowerTier = thisTierLevel < currentTierLevel;

      return (
        <button
          onClick={() => handleSubscription(tier.name)}
          disabled={isProcessingPayment || isCurrentPlan || isLowerTier}
          className={`w-full px-6 py-3 rounded-xl transition-all duration-300
          ${
            isCurrentPlan
              ? "bg-green-600 text-white border-2 border-green-500"
              : isLowerTier
              ? "bg-gray-500/20 text-gray-300 border border-gray-500/30"
              : tier.highlight
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
              : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          }
          font-medium text-sm
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:scale-[1.02] relative z-10
          cursor-pointer`}
        >
          {isCurrentPlan
            ? "Current Plan"
            : isLowerTier
            ? "Unavailable"
            : isProcessingPayment
            ? "Processing..."
            : "Subscribe"}
        </button>
      );
    },
    [user, isProcessingPayment, navigate, handleSubscription, currentUserTier]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl animate-slow-spin"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 blur-3xl animate-slow-spin-reverse"></div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading your subscription details..." />
      ) : (
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-light mb-6">
              Select the perfect plan for your license management needs
            </p>
            <button
              onClick={() => navigate('/documentation')}
              className="px-8 py-3 rounded-xl
                bg-gradient-to-r from-indigo-500/80 to-purple-600/80
                hover:from-indigo-500 hover:to-purple-600
                text-white font-medium
                transition-all duration-300
                shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30
                hover:scale-[1.02]"
            >
              Learn More
            </button>
          </div>

          {/* Subscription Type Buttons */}
          <div className="flex justify-center mb-4 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSubscriptionType('annual')}
              className={`px-4 py-2 rounded-lg flex-1 transition-colors ${
                subscriptionType === 'annual' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-transparent text-gray-300 hover:bg-gray-700'
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => setSubscriptionType('monthly')}
              className={`px-4 py-2 rounded-lg flex-1 transition-colors ${
                subscriptionType === 'monthly' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-transparent text-gray-300 hover:bg-gray-700'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`group backdrop-blur-xl rounded-2xl p-6 
                transition-all duration-300 relative overflow-hidden
                ${
                  tier.highlight
                    ? "bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-2 border-amber-500/20 hover:border-amber-500/40"
                    : "bg-gradient-to-b from-white/10 to-transparent border border-white/10 hover:border-indigo-500/40"
                }
                flex flex-col justify-between`}
              >
                <div className="relative z-10 flex-grow flex flex-col">
                  {/* Tier Name */}
                  <h3 className={`text-xl font-bold mb-2 ${
                    tier.highlight ? 'text-amber-300' : 'text-white'
                  }`}>
                    {tier.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex flex-col mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-white">
                        R{subscriptionType === 'annual' ? tier.price : tier.monthlyPrice}
                      </span>
                      <span className="text-white/50 ml-2 text-sm">
                        /{subscriptionType === 'annual' ? 'year' : 'month'}
                      </span>
                    </div>
                    {subscriptionType === 'annual' && (
                      <div className="text-green-400 text-sm mt-1">
                        Save R{(Number(tier.monthlyPrice) * 12 - Number(tier.price)).toFixed(0)} with annual plan
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 text-white/80"
                      >
                        <FiCheck className={`h-5 w-5 ${
                          tier.highlight ? 'text-amber-400' : 'text-indigo-400'
                        } flex-shrink-0`} />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button section with updated styles */}
                <div className="mt-auto">
                  {renderActionButton(tier)}
                </div>

                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Price;
