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

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/20 text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            System Maintenance
          </h1>
          <p className="text-gray-400 mb-6">
            We're currently performing scheduled maintenance to improve our
            services. Please check back soon.
          </p>
          <div className="animate-pulse flex justify-center">
            <div className="h-2 w-24 bg-indigo-500/30 rounded"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Maintenance;
