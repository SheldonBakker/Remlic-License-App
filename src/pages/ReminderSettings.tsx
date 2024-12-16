/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { LicenseType } from "../types/LicenseGroup";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { FiLoader, FiSave } from "react-icons/fi";

interface License {
  id: string;
  expiry_date: string
  [key: string]: any;
}

type LicenseGroup = Record<LicenseType, License[]>;

interface ReminderSettings {
  notifications_enabled: boolean;
  reminder_days_before: number;
  reminder_frequency: string;
}

const ReminderSettings = () => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<LicenseGroup>({
    vehicles: [],
    drivers: [],
    firearms: [],
    prpds: [],
    works: [],
    others: [],
    passports: [],
    tvlicenses: [],
  });
  const [isLicensesLoading, setIsLicensesLoading] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [, setIsSubscriptionLoading] = useState(true);

  // Get current session
  const { user } = useUser();

  const [typeSettings, setTypeSettings] = useState<
    Record<
      string,
      {
        notifications_enabled: boolean;
        reminder_days_before: number;
        reminder_frequency: string;
      }
    >
  >({
    vehicles: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
    drivers: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
    firearms: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
    prpds: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
    works: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
    others: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
    passports: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
    tvlicenses: {
      notifications_enabled: false,
      reminder_days_before: 7,
      reminder_frequency: "weekly",
    },
  });
  const [editMode, setEditMode] = useState<Record<LicenseType, boolean>>({
    vehicles: false,
    drivers: false,
    firearms: false,
    prpds: false,
    works: false,
    others: false,
    passports: false,
    tvlicenses: false,
  });

  const [isUpdating, setIsUpdating] = useState<Record<LicenseType, boolean>>({
    vehicles: false,
    drivers: false,
    firearms: false,
    prpds: false,
    works: false,
    others: false,
    passports: false,
    tvlicenses: false,
  });

  const fetchLicenseData = useCallback(async () => {
    if (!user?.id) return null;
    
    try {
      const client = await supabase;
      const [
        { data: vehicles },
        { data: drivers },
        { data: firearms },
        { data: prpds },
        { data: works },
        { data: others },
        { data: passports },
        { data: tvlicenses },
      ] = await Promise.all([
        client.from("vehicles").select("*").eq("user_id", user.id),
        client.from("drivers").select("*").eq("user_id", user.id),
        client.from("firearms").select("*").eq("user_id", user.id),
        client.from("prpd").select("*").eq("user_id", user.id),
        client.from("works").select("*").eq("user_id", user.id),
        client.from("other_documents").select("*").eq("user_id", user.id),
        client.from("passports").select("*").eq("user_id", user.id),
        client.from("tv_licenses").select("*").eq("user_id", user.id),
      ]);

      return {
        vehicles: vehicles || [],
        drivers: drivers || [],
        firearms: firearms || [],
        prpds: prpds || [],
        works: works || [],
        others: others || [],
        passports: passports || [],
        tvlicenses: tvlicenses || [],
      };
    } catch (error) {
      throw new Error("Failed to fetch licenses");
    }
  }, [user?.id]);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return null;
    
    const client = await supabase;
    const { data: settings, error } = await client
      .from("license_type_settings")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw new Error("Failed to fetch settings");
    return settings;
  }, [user?.id]);

  const checkSubscription = useCallback(async () => {
    if (!user?.id) return false;

    try {
      setIsSubscriptionLoading(true);
      const client = await supabase;

      // Enhanced cache key with version for future updates
      const cacheKey = `subscription_v1_${user.id}`;

      // Check memory cache first (faster than sessionStorage)
      const memoryCache = (window as any).__subscriptionCache?.[cacheKey];
      if (memoryCache) {
        const { isActive, timestamp } = memoryCache;
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setSubscriptionStatus(isActive ? "active" : "inactive");
          return isActive;
        }
      }

      const { data: profile, error } = await client
        .from("profiles")
        .select("subscription_status, subscription_end_date")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const isActive =
        profile?.subscription_status === "active" &&
        (!profile?.subscription_end_date ||
          new Date(profile.subscription_end_date) > new Date());

      // Update cache
      const cacheData = { isActive, timestamp: Date.now() };
      if (!(window as any).__subscriptionCache) {
        (window as any).__subscriptionCache = {};
      }
      (window as any).__subscriptionCache[cacheKey] = cacheData;
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

      setSubscriptionStatus(isActive ? "active" : "inactive");
      return isActive;
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscriptionStatus("inactive");
      return false;
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const initializeData = async () => {
      if (!user?.id) {
        setError("Please sign in to access reminder settings");
        navigate("/login");
        return;
      }

      try {
        // Use the enhanced subscription check
        const isActive = await checkSubscription();

        // Only fetch licenses and settings if user has active subscription
        if (isActive) {
          const [licenseData, settings] = await Promise.all([
            fetchLicenseData().finally(() => setIsLicensesLoading(false)),
            fetchSettings().finally(() => setIsSettingsLoading(false)),
          ]);

          if (licenseData) setLicenses(licenseData);

          if (settings) {
            const settingsMap = settings.reduce(
              (acc: any, setting: any) => ({
                ...acc,
                [setting.type]: {
                  notifications_enabled: setting.notifications_enabled,
                  reminder_days_before: setting.reminder_days_before,
                  reminder_frequency: setting.reminder_frequency,
                },
              }),
              {}
            );
            setTypeSettings(settingsMap);
          }
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        toast.error("Failed to load data");
      }
    };

    initializeData();
  }, [user, fetchLicenseData, fetchSettings, checkSubscription, navigate]);

  const handleReminderSettingsChange = async (
    type: LicenseType,
    daysBefore: number,
    frequency: string
  ) => {
    if (!user?.id) {
      toast.error("Please sign in to update settings");
      return;
    }

    setIsUpdating(prev => ({ ...prev, [type]: true }));

    try {
      const client = await supabase;
      
      // Validate inputs
      if (daysBefore < 1 || daysBefore > 365) {
        throw new Error("Reminder days must be between 1 and 365");
      }
      
      if (!["daily", "weekly"].includes(frequency)) {
        throw new Error("Invalid reminder frequency");
      }

      const { error } = await client
        .from("license_type_settings")
        .upsert(
          {
            user_id: user.id,
            type,
            notifications_enabled: typeSettings[type]?.notifications_enabled ?? true,
            reminder_days_before: daysBefore,
            reminder_frequency: frequency,
          },
          {
            onConflict: "user_id,type",
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      setTypeSettings((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          reminder_days_before: daysBefore,
          reminder_frequency: frequency,
        },
      }));

      // Close edit mode after successful update
      setEditMode(prev => ({
        ...prev,
        [type]: false,
      }));

      toast.success("Reminder settings updated successfully");
    } catch (error) {
      console.error("Error updating reminder settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update reminder settings");
    } finally {
      setIsUpdating(prev => ({ ...prev, [type]: false }));
    }
  };

  const toggleEditMode = (type: LicenseType) => {
    setEditMode((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSave = (type: LicenseType) => {
    const settings = typeSettings[type];
    if (!settings) {
      toast.error("Invalid settings");
      return;
    }

    const { reminder_days_before, reminder_frequency } = settings;

    // Validate before saving
    if (!reminder_days_before || reminder_days_before < 1) {
      toast.error("Please enter a valid number of days");
      return;
    }

    if (!reminder_frequency) {
      toast.error("Please select a reminder frequency");
      return;
    }

    handleReminderSettingsChange(
      type,
      reminder_days_before,
      reminder_frequency
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-4 py-12">
      {error && (
        <div className="text-red-400 text-center mb-4 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      {(isLicensesLoading || isSettingsLoading) && (
        <LoadingSpinner text={`Loading ${isLicensesLoading ? "licenses" : "settings"}...`} />
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block mb-4">
            <span className="bg-indigo-500/10 text-indigo-400 text-sm font-medium px-4 py-1.5 rounded-full border border-indigo-500/20">
              Notification Preferences
            </span>
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-blue-100 to-white">
            Reminder Settings
          </h1>
          <p className="text-lg text-blue-200/70 max-w-2xl mx-auto">
            Customize how and when you receive notifications for your licenses
          </p>
        </div>

        {subscriptionStatus !== "active" ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 p-8 bg-white/[0.03] rounded-2xl border border-white/10 
            backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 
              group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative space-y-6">
              <div className="inline-block">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium px-4 py-1.5 
                  rounded-full shadow-lg shadow-indigo-500/30">
                  Premium Feature
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r 
                from-blue-200 via-blue-100 to-white">
                Unlock Smart Reminders
              </h1>

              <p className="text-lg text-blue-200/80 max-w-xl mx-auto">
                Never miss a renewal deadline again. Get timely notifications and manage all your license reminders in one place.
              </p>

              <div className="pt-4">
                <button
                  onClick={() => navigate("/price")}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl 
                    hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 font-medium 
                    shadow-lg shadow-indigo-500/30 transform hover:scale-105"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {!isLicensesLoading &&
              !isSettingsLoading &&
              Object.entries(licenses).map(([type, items]) =>
                items.length > 0 ? (
                  <div key={type} className="max-w-md w-full mx-auto">
                    <div className="group bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 
                      hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-x-0 h-px top-0 bg-gradient-to-r from-transparent via-indigo-500 
                        to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="p-6 space-y-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white group-hover:text-blue-200 transition-colors capitalize">
                              {type} Settings
                              <div className="text-sm font-normal text-blue-200/60">
                                ({items.length} {items.length === 1 ? "license" : "licenses"})
                              </div>
                            </h4>
                          </div>
                        </div>

                        {editMode[type as LicenseType] ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/70">
                                Remind me before
                              </label>
                              <div className="flex gap-3">
                                <input
                                  type="number"
                                  min="1"
                                  value={
                                    typeSettings[type]?.reminder_days_before ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    setTypeSettings((prev) => ({
                                      ...prev,
                                      [type]: {
                                        ...prev[type],
                                        reminder_days_before: parseInt(
                                          e.target.value
                                        ),
                                      },
                                    }))
                                  }
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white
                                  focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                />
                                <span className="text-blue-200/60 flex items-center">
                                  days
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/70">
                                Reminder frequency
                              </label>
                              <select
                                value={
                                  typeSettings[type]?.reminder_frequency ||
                                  "weekly"
                                }
                                onChange={(e) =>
                                  setTypeSettings((prev) => ({
                                    ...prev,
                                    [type]: {
                                      ...prev[type],
                                      reminder_frequency: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white
                                focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200
                                appearance-none cursor-pointer hover:bg-slate-700 hover:border-blue-500/30"
                              >
                                <option
                                  value="daily"
                                  className="text-black bg-white"
                                >
                                  Daily
                                </option>
                                <option
                                  value="weekly"
                                  className="text-black bg-white"
                                >
                                  Weekly
                                </option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-blue-200/80">
                              Remind me{" "}
                              {typeSettings[type]?.reminder_days_before || 7}{" "}
                              days before
                            </p>
                            <p className="text-blue-200/80">
                              Frequency:{" "}
                              {typeSettings[type]?.reminder_frequency ||
                                "weekly"}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          {editMode[type as LicenseType] ? (
                            <button
                              onClick={() => handleSave(type as LicenseType)}
                              disabled={isUpdating[type as LicenseType]}
                              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg 
                                hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105
                                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isUpdating[type as LicenseType] ? (
                                <>
                                  <FiLoader className="h-4 w-4 animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <FiSave className="h-4 w-4" />
                                  <span>Save</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleEditMode(type as LicenseType)}
                              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg 
                                hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              )}

            {(isLicensesLoading || isSettingsLoading) &&
              Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="animate-pulse">
                  <div className="bg-white/[0.07] rounded-2xl h-64" />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderSettings;
