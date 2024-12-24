import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "../components/LoadingSpinner";

const Maintenance = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInMaintenance, setIsInMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const { data, error } = await (await supabase)
          .from("system_settings")
          .select("value")
          .eq("key", "maintenance_mode");

        if (error) throw error;
        setIsInMaintenance(data?.[0]?.value || false);
      } catch (error) {
        console.error("Error checking maintenance status:", error);
        setIsInMaintenance(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenanceStatus();

    // Set up real-time subscription
    const setupSubscription = async () => {
      const supabaseClient = await supabase;
      const subscription = supabaseClient
        .channel('system_settings_changes')
        .on(
          'system',
          {
            event: '*',
            schema: 'public',
            table: 'system_settings',
            filter: 'key=eq.maintenance_mode'
          },
          (payload: { new: { value: boolean } }) => {
            setIsInMaintenance(payload.new.value);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanup = setupSubscription();
    return () => {
      cleanup.then(unsubscribe => unsubscribe());
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="Checking system status..." />;
  }

  if (!isInMaintenance) {
    return null; // Or redirect to dashboard/home
  }

  return (
    <>
      <Helmet>
        <title>RemLic - System Maintenance</title>
        <meta name="description" content="System is currently under maintenance" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <div className="relative max-w-xl w-full">
          {/* Glow effects */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
          
          <div className="relative bg-gray-900/60 backdrop-blur-xl rounded-2xl p-12 shadow-2xl border border-gray-700/50">
            {/* Top accent line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-24 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

            <div className="mb-10">
              <svg
                className="mx-auto h-24 w-24 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>

            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                System Maintenance
              </h1>
              <p className="text-gray-300/90 text-lg leading-relaxed">
                We're currently performing scheduled maintenance to enhance your experience.
                <span className="block mt-2 text-gray-400/80">Please check back soon.</span>
              </p>
            </div>

            {/* Animated status indicators */}
            <div className="mt-12 space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-ping"></div>
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-ping [animation-delay:0.2s]"></div>
                <div className="h-2 w-2 bg-indigo-500 rounded-full animate-ping [animation-delay:0.4s]"></div>
              </div>
              <div className="flex justify-center">
                <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse"></div>
              </div>
            </div>

            {/* Bottom decorative elements */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-gray-500/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Maintenance;
