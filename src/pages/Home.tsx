import { useEffect, useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { FiClock, FiShield, FiFileText } from "react-icons/fi";
import Logo from "../assets/Remlic.png";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../lib/supabase";
import { useUser } from "../hooks/useUser";

interface UserStatus {
  isLoggedIn: boolean;
  isSubscriber: boolean;
  isRegistered: boolean;
  expiryDate?: string;
  type_of_user?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [userStatus, setUserStatus] = useState<UserStatus>({
    isLoggedIn: false,
    isSubscriber: false,
    isRegistered: false,
  });
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Memoize static data
  const features = useMemo(
    () => [
      {
        icon: <FiClock className="h-6 w-6" />,
        title: "Smart Reminders",
        description: "Get timely notifications before your licenses expire",
        path: "/dashboard",
        highlight: "Email notifications (SMS & WhatsApp coming soon)",
      },
      {
        icon: <FiFileText className="h-6 w-6" />,
        title: "License Management",
        description: "Track all your licenses and permits in one secure place",
        path: "/dashboard",
        highlight: "Multiple license types",
      },
      {
        icon: <FiShield className="h-6 w-6" />,
        title: "Premium Features",
        description: "Access advanced features with our premium subscription",
        path: "/price",
        highlight: "Advanced features and priority support",
      },
    ],
    []
  );

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setUserStatus({
          isLoggedIn: false,
          isSubscriber: false,
          isRegistered: false,
        });
        setIsPageLoading(false);
        return;
      }

      try {
        const { data: profile, error: profileError } = await (await supabase)
          .from("profiles")
          .select("type_of_user, subscription_status, subscription_end_date")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setUserStatus({
          isLoggedIn: true,
          isSubscriber: profile?.subscription_status === "active",
          isRegistered:
            profile?.type_of_user === "registered" ||
            profile?.type_of_user === "subscriber",
          expiryDate: profile?.subscription_end_date,
          type_of_user: profile?.type_of_user,
        });
      } catch (error) {
        console.error("Error checking subscription:", error);
        setUserStatus({
          isLoggedIn: false,
          isSubscriber: false,
          isRegistered: false,
        });
      } finally {
        setIsPageLoading(false);
      }
    };

    if (!loading) {
      checkSubscription();
    }
  }, [user, loading]);

  if (isPageLoading) {
    return <LoadingSpinner text="Loading Content..." />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Updated */}
          <div className="text-center mb-16">
            <img
              src={Logo}
              alt="License Manager Logo"
              className="h-32 mx-auto mb-6"
              loading="eager"
              width={128}
              height={128}
            />
            <div className="inline-block mb-4">
              <span className="bg-indigo-500/10 text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full border border-indigo-500/20">
                {userStatus.isSubscriber
                  ? `${userStatus.type_of_user
                      ?.charAt(0)
                      .toUpperCase()}${userStatus.type_of_user?.slice(
                      1
                    )} Member`
                  : userStatus.isRegistered
                  ? "Registered Member"
                  : "Start Managing Your Licenses Today"}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Professional License Management
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              South Africa's trusted platform for professional license and
              permit management. Streamline your regulatory compliance, automate
              renewal tracking, and secure your business documents all in one
              powerful dashboard. Perfect for businesses of all sizes managing
              multiple licenses and permits.
            </p>

            {/* Updated CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/documentation")}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 
                  transition-all duration-200 font-medium shadow-lg shadow-indigo-500/30"
              >
                View Documentation
              </button>
              {!userStatus.isLoggedIn && (
                <button
                  onClick={() => navigate("/price")}
                  className="px-8 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 
                    transition-all duration-200 font-medium"
                >
                  View Pricing
                </button>
              )}
            </div>
          </div>

          {/* Features Grid - Updated */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                onClick={() => navigate(feature.path)}
                className="group bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20 
                  hover:border-indigo-500/40 hover:bg-[#1f2937]/40 transition-all duration-300 cursor-pointer"
              >
                <div
                  className="h-12 w-12 bg-indigo-500/10 rounded-xl flex items-center justify-center 
                  text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-all duration-300"
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/70 mb-4">{feature.description}</p>
                <span className="text-sm text-indigo-400 font-medium">
                  {feature.highlight}
                </span>
              </div>
            ))}
          </div>

          {/* Why Choose Us Section */}
          <div className="max-w-4xl mx-auto mt-16 mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Why Choose Our Platform?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Secure Storage
                </h3>
                <p className="text-white/70">
                  Your data is encrypted and stored securely following industry
                  best practices
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Smart Notifications
                </h3>
                <p className="text-white/70">
                  Get timely reminders via email, with SMS and WhatsApp notifications coming soon
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Easy Management
                </h3>
                <p className="text-white/70">
                  Intuitive interface to manage all your licenses and permits in
                  one place
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Priority Support
                </h3>
                <p className="text-white/70">
                  Our dedicated support team is always ready to assist you
                </p>
              </div>
            </div>
          </div>

          {/* Trusted by Businesses Across South Africa */}
          <div className="max-w-4xl mx-auto mt-16 mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Trusted by Businesses Across South Africa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white/70 italic mb-4">
                  "RemLic has transformed how we manage our business licenses.
                  The automated notifications have saved us from costly
                  compliance issues multiple times."
                </p>
                <p className="text-white font-medium">
                  - John D., Operations Manager
                </p>
                <p className="text-white/50 text-sm">
                  Manufacturing Company, Johannesburg
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white/70 italic mb-4">
                  "The dashboard gives us complete visibility of all our permits
                  and licenses. It's become an essential tool for our compliance
                  team."
                </p>
                <p className="text-white font-medium">
                  - Sarah M., Compliance Officer
                </p>
                <p className="text-white/50 text-sm">Retail Chain, Cape Town</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Memoize the entire component
export default memo(Home);
