import { useEffect, useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { FiClock, FiShield, FiFileText, FiDatabase } from "react-icons/fi";
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
        title: "License Management Dashboard",
        description: "Centralized view of all licenses and their statuses",
        highlights: [
          "Easy to use",
          "Managing multiple licenses",
          "Real-time license status updates"
        ]
      },
      {
        icon: <FiFileText className="h-6 w-6" />,
        title: "Smart Notification System",
        description: "Customizable email alerts for expiration dates",
        highlights: [
          "Customizable reminder intervals",
          "Priority notifications for critical licenses",
          "Customizable alert settings"
        ]
      },
      {
        icon: <FiShield className="h-6 w-6" />,
        title: "Document Management",
        description: "Secure storage for license documents",
        highlights: [
          "License information Tracking",
          "Stay compliant with your licenses",
          "Information is encrypted and secure"
        ]
      },
      {
        icon: <FiDatabase className="h-6 w-6" />,
        title: "Asset Management",
        description: "Track and manage your business assets",
        highlights: [
          "Asset Information Storage",
          "Asset Renewal Tracking",
          "Personal License Management"
        ]
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
              Track and manage your licenses with RemLic's comprehensive dashboard. 
              <br />Get automated reminders, visual status tracking, and organized 
              categorization for all your business licenses and permits. 
              <br />
              Perfect for managing Firearm licenses, vehicle registrations, Drivers Licenses, and more.
            </p>

            {/* Updated CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/documentation")}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 
                  transition-all duration-200 font-medium shadow-lg shadow-indigo-500/30"
              >
                Learn More
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

          {/* Enhanced Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-gradient-to-b from-[#1f2937]/80 to-[#1f2937]/40 
                  backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20 
                  hover:border-indigo-500/50 transition-all duration-300
                  hover:shadow-lg hover:shadow-indigo-500/10 hover:translate-y-[-2px]"
              >
                <div
                  className="h-14 w-14 bg-gradient-to-tr from-indigo-600 to-indigo-400 
                    rounded-xl flex items-center justify-center text-white mb-6 
                    shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/40 
                    group-hover:scale-105 transition-all duration-300"
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/70 mb-6 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.highlights.map((highlight, i) => (
                    <li 
                      key={i} 
                      className="text-sm text-white/60 font-medium flex items-start
                        group-hover:text-white/70 transition-colors"
                    >
                      <span className="text-indigo-400 mr-2 text-lg">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
                <div 
                  className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            ))}
          </div>


          {/* Why Choose Us Section - Updated with Documentation content */}
          <div className="max-w-4xl mx-auto mt-16 mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Why Choose Our Platform?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Advanced Search
                </h3>
                <p className="text-white/70">
                  Easily find licenses using registration numbers, names, or ID numbers with our powerful search functionality
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Visual Status Tracking
                </h3>
                <p className="text-white/70">
                  Clear visual indicators show license status: valid (green), expiring soon (yellow), or expired (red)
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Organized Categories
                </h3>
                <p className="text-white/70">
                  Licenses are grouped by type for easy management and monitoring, with customizable notification settings per category
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Flexible Pricing
                </h3>
                <p className="text-white/70">
                  Plans starting from R150/year for basic needs up to R1,000/year for unlimited licenses with API access
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
