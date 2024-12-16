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

interface ExtendedPaystackOptions extends PaystackOptions {
  plan?: string;
  subaccount?: string;
  channels?: string[];
}

const Price = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [, setIsCheckingSubscription] = useState(false);
  const [currentUserTier, setCurrentUserTier] = useState<string | null>(null);

  const tiers = useMemo(
    () => [
      {
        name: "Tier 1",
        price: "150",
        priceInKobo: 15000,
        licenses: 2,
        highlight: false,
        features: ["2 licenses per category"],
      },
      {
        name: "Tier 2",
        price: "250",
        priceInKobo: 25000,
        licenses: 8,
        highlight: false,
        features: ["8 licenses per category"],
      },
      {
        name: "Tier 3",
        price: "350",
        priceInKobo: 35000,
        licenses: 12,
        highlight: false,
        features: ["12 licenses per category"],
      },
      {
        name: "Tier 4",
        price: "550",
        priceInKobo: 55000,
        licenses: 30,
        highlight: true,
        features: ["30 licenses per category"],
      },
      {
        name: "Premium",
        price: "1 000",
        priceInKobo: 100000,
        licenses: "∞",
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

  const handleSubscription = useCallback(
    async (tierName: string) => {
      if (!user?.email) {
        toast.error("Please log in to subscribe");
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
          "Premium": "premium",
        };

        if (profile?.type_of_user === tierToTypeMap[tierName]) {
          toast.info("You are already subscribed to this plan");
          setIsProcessingPayment(false);
          return;
        }

        let paystackKey;
        let planCode;

        if (import.meta.env.PROD) {
          const response = await fetch("/api/get-config.php");
          const config = await response.json();
          paystackKey = config.PAYSTACK_PUBLIC_KEY;
          planCode =
            tierName === "Tier 1"
              ? config.PAYSTACK_TIER1_PLAN_CODE
              : tierName === "Tier 2"
              ? config.PAYSTACK_TIER2_PLAN_CODE
              : tierName === "Tier 3"
              ? config.PAYSTACK_TIER3_PLAN_CODE
              : tierName === "Tier 4"
              ? config.PAYSTACK_TIER4_PLAN_CODE
              : config.PAYSTACK_PREMIUM_PLAN_CODE;
        } else {
          paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
          planCode =
            tierName === "Tier 1"
              ? import.meta.env.VITE_PAYSTACK_TIER1_PLAN_CODE
              : tierName === "Tier 2"
              ? import.meta.env.VITE_PAYSTACK_TIER2_PLAN_CODE
              : tierName === "Tier 3"
              ? import.meta.env.VITE_PAYSTACK_TIER3_PLAN_CODE
              : tierName === "Tier 4"
              ? import.meta.env.VITE_PAYSTACK_TIER4_PLAN_CODE
              : import.meta.env.VITE_PAYSTACK_PREMIUM_PLAN_CODE;
        }

        if (!paystackKey) {
          throw new Error("Paystack public key not found");
        }

        const selectedTier = tiers.find((tier) => tier.name === tierName);
        if (!selectedTier) {
          toast.error("Invalid tier selected");
          return;
        }

        const paystack = new PaystackPop();
        const paystackOptions: ExtendedPaystackOptions = {
          key: paystackKey,
          email: user.email,
          amount: selectedTier.priceInKobo,
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
          },
          onSuccess: async (response: PaystackResponse) => {
            try {
              const startDate = new Date();
              const endDate = new Date(startDate);
              endDate.setFullYear(endDate.getFullYear() + 1);

              const typeOfUserMap: { [key: string]: string } = {
                "Tier 1": "basic",
                "Tier 2": "standard",
                "Tier 3": "professional",
                "Tier 4": "advanced",
                "Premium": "premium",
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

              if (updateError) {
                console.error("Detailed update error:", updateError);
                throw updateError;
              }

              toast.success("Successfully subscribed!");
              navigate("/profile");
            } catch (error: any) {
              console.error("Error updating subscription:", error);
              console.error("Error details:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
              });
              toast.error(
                "Payment successful but failed to update subscription status. Please contact support."
              );
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
    [user?.email, user?.id, navigate, tiers]
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
        "Premium": "premium",
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
            <p className="text-xl text-white/80 max-w-2xl mx-auto font-light">
              Select the perfect plan for your license management needs
            </p>
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
                {/* Price Badge */}
                <div className="absolute -right-12 top-8 rotate-45 bg-indigo-500/20 px-12 py-1 text-xs text-white/80">
                  Annual
                </div>

                <div className="relative z-10 flex-grow flex flex-col">
                  {/* Tier Name */}
                  <h3 className={`text-xl font-bold mb-2 ${
                    tier.highlight ? 'text-amber-300' : 'text-white'
                  }`}>
                    {tier.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-extrabold text-white">R{tier.price}</span>
                    <span className="text-white/50 ml-2 text-sm">/year</span>
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
