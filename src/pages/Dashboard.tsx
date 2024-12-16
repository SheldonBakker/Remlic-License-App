/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../lib/supabase";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiPlus,
  FiCreditCard,
  FiTruck,
  FiTarget,
  FiFileText,
  FiFile,
  FiTrash2,
  FiRefreshCw,
  FiTv,
} from "react-icons/fi";
import { AiOutlineCar } from "react-icons/ai";
import { Dialog } from "@mui/material";
import Drivers from "../components/Drivers";
import Vehicle from "../components/Vehicle";
import Prpd from "../components/Prpd";
import Firearm from "../components/Firearm";
import Work from "../components/Work";
import Other from "../components/Other";
import Passport from "../components/Passport";
import TVLicense from "../components/TVLicense";
import LoadingSpinner from "../components/LoadingSpinner";
import StructuredData from "../components/StructuredData";
import React from "react";
import { SubscriptionRequired } from "../components/dashboard/SubscriptionRequired";
import { LicenseGroup, License } from "../types/LicenseGroup";
import { debounce } from "lodash";

const tierLicenseLimits: { [key: string]: number } = {
  basic: 2,
  standard: 8,
  professional: 12,
  advanced: 30,
  premium: Number.MAX_SAFE_INTEGER,
};

const Dashboard = () => {
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
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [editingLicense, setEditingLicense] = useState<
    | (License & {
        licenseType?:
          | "vehicle"
          | "driver"
          | "firearm"
          | "prpd"
          | "work"
          | "other"
          | "passport"
          | "tvlicense";
      })
    | null
  >(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setUserEmail] = useState("");
  const [openDrivers, setOpenDrivers] = useState(false);
  const [openVehicle, setOpenVehicle] = useState(false);
  const [openPrpd, setOpenPrpd] = useState(false);
  const [openFirearm, setOpenFirearm] = useState(false);
  const [, setSelectedLicenseType] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [openWork, setOpenWork] = useState(false);
  const [openOther, setOpenOther] = useState(false);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(true);
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const [openPassport, setOpenPassport] = useState(false);
  const [openTVLicense, setOpenTVLicense] = useState(false);

  const getPluralKey = (licenseType: string): string => {
    switch (licenseType) {
      case "driver":
      case "drivers":
        return "drivers";
      case "vehicle":
      case "vehicles":
        return "vehicles";
      case "firearm":
      case "firearms":
        return "firearms";
      case "prpd":
      case "prpds":
        return "prpds";
      case "work":
      case "works":
        return "works";
      case "other":
      case "others":
        return "others";
      case "passport":
      case "passports":
        return "passports";
      case "tvlicense":
      case "tvlicenses":
        return "tvlicenses";
      default:
        return "";
    }
  };

  const checkSubscription = useCallback(async () => {
    try {
      setIsSubscriptionLoading(true);
      const supabaseClient = await supabase;
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) return false;

      const cacheKey = `subscription_v1_${session.user.id}`;
      const memoryCache = (window as any).__subscriptionCache?.[cacheKey];
      if (memoryCache) {
        const { isActive, timestamp, type_of_user } = memoryCache;
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setHasActiveSubscription(isActive);
          setUserTier(type_of_user || null);
          setIsSubscriptionLoading(false);
          return isActive;
        }
      }

      const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("subscription_status, subscription_end_date, type_of_user")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      const isActive =
        profile?.subscription_status === "active" &&
        (!profile?.subscription_end_date ||
          new Date(profile.subscription_end_date) > new Date());

      const cacheData = {
        isActive,
        timestamp: Date.now(),
        type_of_user: profile?.type_of_user || null,
      };
      if (!(window as any).__subscriptionCache) {
        (window as any).__subscriptionCache = {};
      }
      (window as any).__subscriptionCache[cacheKey] = cacheData;
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

      setHasActiveSubscription(isActive);
      setUserTier(profile?.type_of_user || null);
      return isActive;
    } catch (error) {
      console.error("Error checking subscription:", error);
      setHasActiveSubscription(false);
      return false;
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, []);

  const fetchAllLicenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabaseClient = await supabase;
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const hasSubscription = await checkSubscription();
      if (!hasSubscription) {
        setError("Please subscribe to access license management features.");
        setIsLoading(false);
        return;
      }

      const cacheKey = `licenses_${session.user.id}`;
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
        const { licenses, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setLicenses(licenses);
          setIsLoading(false);
          return;
        }
      }

      const commonFields = "id, user_id, expiry_date, created_at";
      const [vehicles, drivers, firearms, prpds, works, others, passports, tvlicenses] =
        await Promise.all([
          supabaseClient
            .from("vehicles")
            .select(`${commonFields}, registration_number, make, model`)
            .eq("user_id", session.user.id)
            .order("expiry_date"),

          supabaseClient
            .from("drivers")
            .select(`${commonFields}, first_name, last_name, id_number`)
            .eq("user_id", session.user.id)
            .order("expiry_date"),

          supabaseClient
            .from("firearms")
            .select(
              `${commonFields}, make_model, caliber, registration_number, first_name, last_name`
            )
            .eq("user_id", session.user.id)
            .order("expiry_date"),

          supabaseClient
            .from("prpd")
            .select(`${commonFields}, first_name, last_name, id_number`)
            .eq("user_id", session.user.id)
            .order("expiry_date"),

          supabaseClient
            .from("works")
            .select(
              `${commonFields}, contract_name, contract_type, company_name, first_name, last_name`
            )
            .eq("user_id", session.user.id)
            .order("expiry_date"),

          supabaseClient
            .from("other_documents")
            .select(`${commonFields}, description`)
            .eq("user_id", session.user.id)
            .order("expiry_date"),

          supabaseClient
            .from("passports")
            .select(`${commonFields}, first_name, last_name, passport_number`)
            .eq("user_id", session.user.id)
            .order("expiry_date"),

          supabaseClient
            .from("tv_licenses")
            .select(`${commonFields}, first_name, last_name, license_number`)
            .eq("user_id", session.user.id)
            .order("expiry_date"),
        ]);

      const newLicenses = {
        vehicles: vehicles.data || [],
        drivers: drivers.data || [],
        firearms: firearms.data || [],
        prpds: prpds.data || [],
        works: works.data || [],
        others: others.data || [],
        passports: passports.data || [],
        tvlicenses: tvlicenses.data || [],
      };

      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          licenses: newLicenses,
          timestamp: Date.now(),
        })
      );

      setLicenses(newLicenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      setError("Failed to fetch licenses. Please try again later.");
      toast.error("Failed to fetch licenses");
    } finally {
      setIsLoading(false);
    }
  }, [navigate, checkSubscription]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await (await supabase).auth.getSession();
        if (!session) {
          navigate("/login", { replace: true });
          return;
        }

        sessionStorage.setItem("auth_status", "authenticated");
        fetchAllLicenses();
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/login", { replace: true });
      }
    };

    const cachedAuthStatus = sessionStorage.getItem("auth_status");
    if (cachedAuthStatus === "authenticated") {
      fetchAllLicenses();
    } else {
      checkAuth();
    }
  }, [navigate, fetchAllLicenses]);

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const supabaseClient = await supabase;
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        if (!session) return;

        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (user) {
          setUserEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error fetching user email:", error);
      }
    };

    fetchUserEmail();
  }, []);

  const LICENSE_TYPES = useMemo(
    () => [
      {
        id: "drivers",
        title: "Driver's License",
        icon: <FiCreditCard className="w-5 h-5" />,
      },
      {
        id: "vehicle",
        title: "Vehicle Registration",
        icon: <AiOutlineCar className="w-5 h-5" />,
      },
      {
        id: "prpd",
        title: "PrPD",
        icon: <FiTruck className="w-5 h-5" />,
      },
      {
        id: "firearm",
        title: "Firearm License",
        icon: <FiTarget className="w-5 h-5" />,
      },
      {
        id: "work",
        title: "Work Contract",
        icon: <FiFileText className="w-5 h-5" />,
      },
      {
        id: "other",
        title: "Other Document",
        icon: <FiFile className="w-5 h-5" />,
      },
      {
        id: "passport",
        title: "Passport",
        icon: <FiCreditCard className="w-5 h-5" />,
      },
      {
        id: "tvlicense",
        title: "TV License",
        icon: <FiTv className="w-5 h-5" />,
      },
    ],
    []
  );

  const filterLicenses = useMemo(() => {
    return (items: License[]) => {
      if (!searchQuery) return items;

      return items.filter((license) => {
        const searchFields = [
          license.registration,
          license.first_name,
          license.last_name,
          license.id_number,
        ].map((field) => field?.toLowerCase() || "");

        return searchFields.some((field) =>
          field.includes(searchQuery.toLowerCase())
        );
      });
    };
  }, [searchQuery]);

  const getLicenseType = useCallback(
    (license: any): string => {
      if (license.source_section) {
        return license.source_section.slice(0, -1);
      }

      for (const [section, items] of Object.entries(licenses)) {
        if (items.some((item: { id: any }) => item.id === license.id)) {
          return section.slice(0, -1);
        }
      }

      if (license.source_table) {
        switch (license.source_table) {
          case "vehicles":
            return "vehicle";
          case "drivers":
            return "driver";
          case "firearms":
            return "firearm";
          case "prpd":
            return "prpd";
          case "works":
            return "work";
          case "other_documents":
            return "other";
          case "tv_licenses":
            return "tvlicense";
          case "passports":
            return "passport";
        }
      }

      console.error("Could not determine license type:", license);
      return "";
    },
    [licenses]
  );

  const selectSection = (section: string) => {
    setSelectedSection(selectedSection === section ? null : section);
  };

  const handleSaveRenewal = async () => {
    try {
      const supabaseClient = await supabase;
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      if (
        !editingLicense?.licenseType ||
        !editingLicense.id ||
        !newExpiryDate
      ) {
        toast.error("Invalid license data or expiry date");
        return;
      }

      const tableMap: { [key: string]: string } = {
        prpd: "prpd",
        driver: "drivers",
        firearm: "firearms",
        vehicle: "vehicles",
        work: "works",
        other: "other_documents",
        passport: "passports",
        tvlicense: "tv_licenses",
      };

      const tableName = tableMap[editingLicense.licenseType];
      if (!tableName) {
        toast.error("Invalid license type");
        return;
      }

      const { error } = await supabaseClient
        .from(tableName)
        .update({ expiry_date: newExpiryDate })
        .eq("id", editingLicense.id)
        .eq("user_id", session.user.id)
        .select();

      if (error) throw error;

      toast.success("License renewed successfully");
      clearLicenseCache();
      await fetchAllLicenses();
      setIsRenewModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to renew license");
    }
  };

  const confirmDelete = async () => {
    if (!licenseToDelete) return;

    try {
      const supabaseClient = await supabase;
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const licenseType = getLicenseType(licenseToDelete);

      if (!licenseType) {
        toast.error("Could not determine license type");
        return;
      }

      const tableName =
        {
          vehicle: "vehicles",
          firearm: "firearms",
          driver: "drivers",
          prpd: "prpd",
          work: "works",
          other: "other_documents",
          passport: "passports",
          tvlicense: "tv_licenses",
        }[licenseType] || "";

      if (!tableName) {
        toast.error("Invalid license type");
        return;
      }

      const { error } = await supabaseClient
        .from(tableName)
        .delete()
        .eq("id", licenseToDelete.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast.success("License deleted successfully");
      clearLicenseCache();
      await fetchAllLicenses();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete license");
    } finally {
      setIsDeleteModalOpen(false);
      setLicenseToDelete(null);
    }
  };

  const handleAddLicense = () => {
    setSelectedLicenseType(null);
    setIsAddModalOpen(true);
  };

  const handleLicenseTypeSelect = useCallback(
    (type: string) => {
      const pluralKey = getPluralKey(type);
      const currentCount =
        licenses[pluralKey as keyof LicenseGroup]?.length ?? 0;
      const limit =
        tierLicenseLimits[userTier || "basic"] ?? tierLicenseLimits["basic"];
      if (currentCount >= limit) {
        toast.error(
          `You have reached the limit of ${limit} licenses for ${type}`
        );
        return;
      }

      setSelectedLicenseType(type);
      setIsAddModalOpen(false);
      setTimeout(() => {
        switch (type) {
          case "drivers":
            setOpenDrivers(true);
            break;
          case "vehicle":
            setOpenVehicle(true);
            break;
          case "prpd":
            setOpenPrpd(true);
            break;
          case "firearm":
            setOpenFirearm(true);
            break;
          case "work":
            setOpenWork(true);
            break;
          case "other":
            setOpenOther(true);
            break;
          case "passport":
            setOpenPassport(true);
            break;
          case "tvlicense":
            setOpenTVLicense(true);
            break;
        }
      }, 100);
    },
    [licenses, userTier]
  );

  const handleCloseDrivers = useCallback(() => {
    setOpenDrivers(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const handleCloseVehicle = useCallback(() => {
    setOpenVehicle(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const handleClosePrpd = useCallback(() => {
    setOpenPrpd(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const handleCloseFirearm = useCallback(() => {
    setOpenFirearm(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const handleCloseWork = useCallback(() => {
    setOpenWork(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const handleCloseOther = useCallback(() => {
    setOpenOther(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const handleClosePassport = useCallback(() => {
    setOpenPassport(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const handleCloseTVLicense = useCallback(() => {
    setOpenTVLicense(false);
    clearLicenseCache();
    fetchAllLicenses();
  }, [fetchAllLicenses]);

  const structuredData = useMemo(
    () => ({
      productData: {
        offers: {
          "@type": "Offer",
          price: "135",
          priceCurrency: "ZAR",
          priceValidUntil: "2024-12-31",
          availability: "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "89",
        },
        operatingSystem: "Web-based",
        applicationCategory: "BusinessApplication",
        features: [
          "License Tracking",
          "Automated Reminders",
          "Document Management",
          "Expiry Alerts",
        ],
      },
      breadcrumbData: {
        items: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://remlic.co.za",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Dashboard",
            item: "https://remlic.co.za/dashboard",
          },
        ],
      },
    }),
    []
  );

  const ErrorState = memo(({ error }: { error: string }) => (
    <div className="text-center py-12 bg-[#1f2937]/30 backdrop-blur-xl rounded-xl border border-red-500/20">
      <p className="text-red-400">{error}</p>
    </div>
  ));

  const clearLicenseCache = async () => {
    const {
      data: { session },
    } = await (await supabase).auth.getSession();
    if (session) {
      sessionStorage.removeItem(`licenses_${session.user.id}`);
    }
  };

  const renderCard = (content: React.ReactNode) => (
    <div className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-indigo-500/10 hover:border-indigo-500/20 transition-all duration-200">
      {content}
    </div>
  );

  const MemoizedLicenseCard = React.memo(
    ({
      license,
      type,
      setIsRenewModalOpen,
      setEditingLicense,
      setLicenseToDelete,
      setIsDeleteModalOpen,
    }: {
      license: License;
      type: string;
      setIsRenewModalOpen: (open: boolean) => void;
      setEditingLicense: (license: any) => void;
      setLicenseToDelete: (license: License | null) => void;
      setIsDeleteModalOpen: (open: boolean) => void;
    }) => {
      const [isPaused, setIsPaused] = useState<boolean | null>(null);
      const [isUpdating, setIsUpdating] = useState(false);

      useEffect(() => {
        const checkNotificationStatus = async () => {
          try {
            const supabaseClient = await supabase;
            const tableMap: { [key: string]: string } = {
              vehicle: "vehicles",
              driver: "drivers",
              firearm: "firearms",
              prpd: "prpd",
              work: "works",
              other: "other_documents",
              passport: "passports",
              tvlicense: "tv_licenses",
            };
            
            const tableName = tableMap[type];
            if (!tableName) {
              throw new Error("Invalid license type");
            }

            const { data, error } = await supabaseClient
              .from(tableName)
              .select('notifications_paused')
              .eq('id', license.id)
              .single();

            if (error) throw error;
            
            setIsPaused(data.notifications_paused || false);
          } catch (error) {
            console.error('Error checking notification status:', error);
            setIsPaused(false); // Default to false if there's an error
          }
        };

        checkNotificationStatus();
      }, [license.id, type]);

      const capitalizeFirstLetter = (str?: string) => {
        if (!str) return "";
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      const { isValid, daysLeft, isExpiringSoon } = getLicenseStatus(
        license.expiry_date
      );

      const handlePauseNotifications = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          setIsUpdating(true);
          const supabaseClient = await supabase;
          
          const tableMap: { [key: string]: string } = {
            vehicle: "vehicles",
            driver: "drivers",
            firearm: "firearms",
            prpd: "prpd",
            work: "works",
            other: "other_documents",
            passport: "passports",
            tvlicense: "tv_licenses",
          };
          
          const tableName = tableMap[type];
          if (!tableName) {
            throw new Error("Invalid license type");
          }

          const newPausedStatus = !isPaused;
          
          const { error } = await supabaseClient
            .from(tableName)
            .update({ notifications_paused: newPausedStatus })
            .eq('id', license.id)
            .select();

          if (error) throw error;

          setIsPaused(newPausedStatus);
          toast.success(newPausedStatus 
            ? 'Notifications paused successfully' 
            : 'Notifications resumed successfully'
          );

        } catch (error) {
          console.error('Error updating notification status:', error);
          toast.error('Failed to update notification status');
        } finally {
          setIsUpdating(false);
        }
      };

      const renderStatus = () => (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-indigo-500/20">
          <div
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg 
              bg-opacity-10 border border-opacity-20 transition-all duration-200 w-full
              ${
                isValid
                  ? "bg-green-500 border-green-500 text-green-400"
                  : "bg-red-500 border-red-500 text-red-400"
              }`}
          >
            {isValid ? (
              <>
                <FiCheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Valid</span>
              </>
            ) : (
              <>
                <FiAlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Expired</span>
              </>
            )}
          </div>
          <div
            className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg 
              bg-opacity-10 border border-opacity-20 w-full
              ${
                isExpiringSoon
                  ? "bg-yellow-500 border-yellow-500 text-yellow-400"
                  : isValid
                  ? "bg-indigo-500 border-indigo-500 text-indigo-400"
                  : "bg-red-500 border-red-500 text-red-400"
              }`}
          >
            <FiClock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {daysLeft > 0
                ? `${daysLeft} days left`
                : `${Math.abs(daysLeft)} days ago`}
            </span>
          </div>
        </div>
      );

      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-CA");
      };

      const renderField = (label: string, value: string | undefined) => (
        <div className="flex flex-col space-y-1">
          <span className="text-xs font-semibold text-indigo-400/70 tracking-wide uppercase">
            {label}
          </span>
          <span className="text-sm text-white/90 font-medium">
            {value || "N/A"}
          </span>
        </div>
      );

      const renderHeader = (title: string) => {
        const { isValid, daysLeft } = getLicenseStatus(license.expiry_date);
        const shouldShowPauseButton = !isValid || (isValid && daysLeft <= 30);

        return (
          <div className="mb-4 flex justify-between items-start">
            <h4 className="text-lg font-bold text-white tracking-tight leading-tight">
              {title}
            </h4>
            {isPaused !== null && shouldShowPauseButton && (
              <button
                onClick={handlePauseNotifications}
                disabled={isUpdating}
                className={`text-xs px-2 py-1 rounded-md transition-all duration-200
                  ${isPaused 
                    ? 'bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 border-gray-500/20 hover:border-gray-500/40' 
                    : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20 hover:border-yellow-500/40'
                  } border
                  ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-1">
                  {isUpdating && (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isPaused ? 'Resume Notifications' : 'Pause Notifications'}
                </div>
              </button>
            )}
          </div>
        );
      };

      const renderActions = () => (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-indigo-500/20">
          <button
            onClick={() => {
              setLicenseToDelete(license);
              setIsDeleteModalOpen(true);
            }}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 
              py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium 
              border border-red-500/20 hover:border-red-500/40
              flex items-center justify-center gap-2"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <button
            onClick={() => {
              setEditingLicense({ ...license, licenseType: type });
              setIsRenewModalOpen(true);
            }}
            className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 
              py-2 px-3 rounded-lg transition-all duration-200 text-sm font-medium 
              border border-green-500/20 hover:border-green-500/40
              flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Renew</span>
          </button>
        </div>
      );

      switch (type) {
        case "vehicle":
          return (
            <div className="space-y-4">
              {renderHeader(
                `${license.make?.toUpperCase()} ${license.model?.toUpperCase()}`
              )}
              <div className="grid grid-cols-2 gap-4">
                {renderField(
                  "Registration",
                  license.registration_number?.toUpperCase()
                )}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderStatus()}
              {renderActions()}
            </div>
          );

        case "driver":
          return (
            <div className="space-y-4">
              {renderHeader(`${license.first_name} ${license.last_name}`)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderField("ID Number", license.id_number)}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderStatus()}
              {renderActions()}
            </div>
          );

        case "firearm":
          return renderCard(
            <div className="space-y-3">
              {renderHeader(license.make_model?.toUpperCase() || "Firearm License")}
              {renderStatus()}
              <div className="grid grid-cols-2 gap-4 mt-3">
                {renderField(
                  "Owner",
                  `${capitalizeFirstLetter(license.first_name)} ${capitalizeFirstLetter(license.last_name)}`
                )}
                {renderField("Caliber", license.caliber?.toUpperCase())}
                {renderField(
                  "Registration",
                  license.registration_number?.toUpperCase()
                )}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderActions()}
            </div>
          );

        case "prpd":
          return renderCard(
            <div className="space-y-3">
              {renderHeader("PrPD License")}
              {renderStatus()}
              <div className="grid grid-cols-2 gap-4 mt-3">
                {renderField(
                  "Name",
                  `${capitalizeFirstLetter(
                    license.first_name
                  )} ${capitalizeFirstLetter(license.last_name)}`
                )}
                {renderField("ID Number", license.id_number)}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderActions()}
            </div>
          );

        case "work":
          return renderCard(
            <div className="space-y-3">
              {renderHeader(license.contract_name || "Work Contract")}
              {renderStatus()}
              <div className="grid grid-cols-2 gap-4 mt-3">
                {renderField(
                  "Contract Type",
                  capitalizeFirstLetter(license.contract_type)
                )}
                {renderField("Company", license.company_name)}
                {renderField(
                  "Contact Person",
                  `${capitalizeFirstLetter(
                    license.first_name
                  )} ${capitalizeFirstLetter(license.last_name)}`
                )}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderActions()}
            </div>
          );

        case "other":
          return renderCard(
            <div className="space-y-3">
              {renderHeader(license.description || "Other Document")}
              {renderStatus()}
              <div className="grid grid-cols-2 gap-4 mt-3">
                {renderField(
                  "Description",
                  license.description || "No description provided"
                )}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderActions()}
            </div>
          );

        case "passport":
          return renderCard(
            <div className="space-y-3">
              {renderHeader(`${license.first_name} ${license.last_name}`)}
              {renderStatus()}
              <div className="grid grid-cols-2 gap-4 mt-3">
                {renderField("Passport Number", license.passport_number)}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderActions()}
            </div>
          );

        case "tvlicense":
          return renderCard(
            <div className="space-y-3">
              {renderHeader("TV License")}
              {renderStatus()}
              <div className="grid grid-cols-2 gap-4 mt-3">
                {renderField("License Number", license.license_number)}
                {renderField("Expiry Date", formatDate(license.expiry_date))}
              </div>
              {renderActions()}
            </div>
          );

        default:
          return null;
      }
    }
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
      }, 300),
    []
  );

  return (
    <>
      <StructuredData type="product" data={structuredData.productData} />
      <StructuredData type="breadcrumb" data={structuredData.breadcrumbData} />
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-4 py-6">
        {isLoading || isSubscriptionLoading ? (
          <LoadingSpinner text="Loading..." />
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-indigo-500/20 mb-6">
              <div className="px-4 sm:px-8 py-4 sm:py-6">
                <div className="flex flex-col space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                        License Management
                      </h2>
                      <p className="text-xs text-white/70 mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                        {Object.values(licenses).flat().length} Total Licenses
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col sm:flex-row w-full gap-3">
                      <div className="relative flex-grow group">
                        <input
                          type="text"
                          onChange={(e) => debouncedSearch(e.target.value)}
                          placeholder="Search licenses..."
                          className="w-full bg-[#374151]/50 text-white border border-indigo-500/20 
                            rounded-xl px-4 py-2.5 pl-10 
                            focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                            placeholder-white/50 transition-all duration-200
                            group-hover:border-indigo-500/40 group-hover:bg-[#374151]/70"
                        />
                        <svg
                          className="absolute left-3 top-3 h-5 w-5 text-white/50 group-hover:text-white/70 transition-colors duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>

                      {hasActiveSubscription ? (
                        <>
                          <button
                            onClick={handleAddLicense}
                            className="hidden sm:flex items-center justify-center space-x-2 
                              bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2.5 px-6 rounded-xl 
                              transition-all duration-300 text-sm font-medium border border-indigo-600/50 
                              hover:border-indigo-500 shadow-lg shadow-indigo-500/20
                              hover:shadow-indigo-500/40 hover:scale-[1.02] transform relative
                              hover:from-indigo-600 hover:to-indigo-700"
                          >
                            <FiPlus className="w-4 h-4" />
                            <span>Add License</span>
                          </button>

                          <div className="relative sm:hidden">
                            <button
                              onClick={() =>
                                setShowMobileDropdown(!showMobileDropdown)
                              }
                              className="w-full flex items-center justify-center space-x-2 
                                bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-2.5 px-6 rounded-xl 
                                transition-all duration-300 text-sm font-medium border border-indigo-600/50"
                            >
                              <FiPlus className="w-4 h-4" />
                              <span>Add License</span>
                            </button>

                            {showMobileDropdown && (
                              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50">
                                <div className="absolute inset-x-4 top-[20%] bg-gray-800 rounded-xl shadow-lg border border-indigo-500/20 overflow-hidden">
                                  <div className="p-4 border-b border-indigo-500/20">
                                    <div className="flex items-center justify-between">
                                      <h3 className="text-lg font-semibold text-white">
                                        Select License Type
                                      </h3>
                                      <button
                                        onClick={() =>
                                          setShowMobileDropdown(false)
                                        }
                                        className="text-gray-400 hover:text-white"
                                      >
                                        <svg
                                          className="w-6 h-6"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  {LICENSE_TYPES.map((type) => {
                                    const pluralKey = getPluralKey(type.id);
                                    const currentCount =
                                      licenses[pluralKey as keyof LicenseGroup]
                                        ?.length ?? 0;
                                    const limit =
                                      tierLicenseLimits[userTier || "basic"] ??
                                      tierLicenseLimits["basic"];
                                    const isLimitReached =
                                      currentCount >= limit;

                                    return (
                                      <button
                                        key={type.id}
                                        onClick={() => {
                                          setShowMobileDropdown(false);
                                          handleLicenseTypeSelect(type.id);
                                        }}
                                        disabled={isLimitReached}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                                          ${
                                            isLimitReached
                                              ? "opacity-50 cursor-not-allowed bg-gray-700/50"
                                              : "hover:bg-gray-700/50"
                                          }
                                          ${
                                            LICENSE_TYPES.indexOf(type) !==
                                            LICENSE_TYPES.length - 1
                                              ? "border-b border-indigo-500/10"
                                              : ""
                                          }`}
                                      >
                                        <span className="text-indigo-400">
                                          {type.icon}
                                        </span>
                                        <span className="text-white">
                                          {type.title}
                                        </span>
                                        {isLimitReached && (
                                          <span className="ml-auto text-xs text-red-400">
                                            Limit reached
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => navigate("/price")}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 
                            bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 py-2.5 px-6 
                            rounded-xl transition-all duration-300 text-sm font-medium
                            border border-amber-400/50 shadow-lg shadow-amber-500/20 
                            hover:shadow-amber-500/40 hover:scale-[1.02] transform relative
                            hover:from-amber-500 hover:to-amber-600"
                        >
                          <FiCreditCard className="w-4 h-4" />
                          <span>Upgrade Account</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Object.entries(licenses).map(([type, items]) => {
                        const licenseType = LICENSE_TYPES.find((t) => {
                          const pluralKey = getPluralKey(t.id);
                          return pluralKey === type;
                        });
                        const limit =
                          tierLicenseLimits[userTier || "basic"] ??
                          tierLicenseLimits["basic"];
                        const isLimitReached = items.length >= limit;
                        return (
                          <div
                            key={type}
                            onClick={() => selectSection(type)}
                            className={`bg-[#1f2937]/30 backdrop-blur-xl rounded-xl p-2.5 border 
                              transition-all duration-300 cursor-pointer relative overflow-hidden group
                              ${
                                selectedSection === type
                                  ? "border-indigo-500 bg-stone-300/10 text-stone-300 shadow-lg shadow-indigo-500/10"
                                  : "border-indigo-500/20 hover:bg-stone-300/10 hover:text-stone-300 hover:border-stone-300/40 hover:shadow-lg hover:shadow-stone-300/5"
                              }
                              ${isLimitReached ? "opacity-70" : ""}
                            `}
                          >
                            <div className="flex flex-col space-y-1 relative z-10">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-white/70 text-xs font-medium tracking-wide uppercase group-hover:text-stone-300">
                                  {licenseType?.title || type}
                                </span>
                                <span
                                  className={`text-indigo-400 font-semibold text-xs tabular-nums group-hover:text-stone-300
                                    ${
                                      selectedSection === type
                                        ? "animate-pulse"
                                        : ""
                                    }
                                  `}
                                >
                                  {items.length}/
                                  {limit === Number.MAX_SAFE_INTEGER
                                    ? "∞"
                                    : limit}
                                </span>
                              </div>
                              <div className="w-full bg-indigo-500/10 rounded-full h-1.5 overflow-hidden group-hover:bg-stone-300/10">
                                <div
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-300 group-hover:bg-stone-300"
                                  style={{
                                    width: `${
                                      (items.length /
                                        (limit === Number.MAX_SAFE_INTEGER
                                          ? items.length || 1
                                          : limit)) *
                                      100
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                            {isLimitReached && (
                              <span className="absolute top-1 right-2 text-red-400 text-[10px] font-medium">
                                Limit reached
                              </span>
                            )}
                            {selectedSection === type && (
                              <div className="absolute inset-0 bg-gradient-to-br from-stone-300/5 to-transparent" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {!hasActiveSubscription ? (
                <SubscriptionRequired />
              ) : (
                <>
                  {(searchQuery ? true : selectedSection) && (
                    <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-xl border border-indigo-500/20">
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(licenses).flatMap(
                          ([section, items]) => {
                            if (!searchQuery && section !== selectedSection) {
                              return [];
                            }

                            return filterLicenses(items).map((license) => (
                              <div
                                key={license.id}
                                className="bg-[#374151]/50 rounded-xl p-4 border border-indigo-500/20
                                hover:bg-[#374151]/70 hover:border-indigo-500/40 transition-all duration-200"
                              >
                                <MemoizedLicenseCard
                                  license={license}
                                  type={section.slice(0, -1)}
                                  setIsRenewModalOpen={setIsRenewModalOpen}
                                  setEditingLicense={setEditingLicense}
                                  setLicenseToDelete={setLicenseToDelete}
                                  setIsDeleteModalOpen={setIsDeleteModalOpen}
                                />
                              </div>
                            ));
                          }
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && <ErrorState error={error} />}
            </div>
          </div>
        )}

        {isRenewModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
              <h3 className="text-2xl font-bold text-white">Renew License</h3>
              <div className="space-y-2">
                <label className="text-white/70 text-sm">New Expiry Date</label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full bg-[#374151] text-white border border-indigo-500/20 rounded-xl p-2.5 focus:border-indigo-500/50 focus:outline-none"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsRenewModalOpen(false)}
                  className="flex-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 py-2.5 px-4 rounded-xl transition-all duration-200 font-medium border border-gray-500/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRenewal}
                  className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-2.5 px-4 rounded-xl transition-all duration-200 font-medium border border-green-500/20"
                >
                  Renew License
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && licenseToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-red-500/20">
              <h3 className="text-2xl font-bold text-white">Confirm Delete</h3>
              <p className="text-white/70">
                Are you sure you want to delete this license? This action cannot
                be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 py-2.5 px-4 rounded-xl transition-all duration-200 font-medium border border-gray-500/20"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 px-4 rounded-xl transition-all duration-200 font-medium border border-red-500/20"
                >
                  Delete License
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddModalOpen && (
          <Dialog
            open={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              style: {
                backgroundColor: "transparent",
                boxShadow: "none",
              },
            }}
            sx={{
              "& .MuiDialog-paper": {
                backgroundColor: "transparent",
                margin: "16px",
              },
              "& .MuiBackdrop-root": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(4px)",
              },
              zIndex: 1400,
            }}
          >
            <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20 relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <h3 className="text-2xl font-bold text-white">
                Select License Type
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {LICENSE_TYPES.map((type) => {
                  const pluralKey = getPluralKey(type.id);
                  const currentCount =
                    licenses[pluralKey as keyof LicenseGroup]?.length ?? 0;
                  const limit =
                    tierLicenseLimits[userTier || "basic"] ??
                    tierLicenseLimits["basic"];
                  const isLimitReached = currentCount >= limit;
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleLicenseTypeSelect(type.id)}
                      disabled={isLimitReached}
                      className={`flex items-center space-x-3 p-4 rounded-xl ${
                        isLimitReached
                          ? "bg-gray-500/20 cursor-not-allowed opacity-50"
                          : "bg-[#374151]/50 hover:bg-[#374151]/70"
                      }
                        border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-200`}
                    >
                      <span className={`text-indigo-400`}>{type.icon}</span>
                      <span className="text-white font-medium">
                        {type.title}
                      </span>
                      {isLimitReached && (
                        <span className="text-red-400 text-sm ml-auto">
                          Limit reached
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 px-4 rounded-xl
                  transition-all duration-200 font-medium border border-red-500/20 hover:border-red-500/40"
              >
                Cancel
              </button>
            </div>
          </Dialog>
        )}

        <Dialog
          open={openVehicle}
          onClose={handleCloseVehicle}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <Vehicle
            onClose={handleCloseVehicle}
            editingLicense={editingLicense}
          />
        </Dialog>

        <Dialog
          open={openDrivers}
          onClose={handleCloseDrivers}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <Drivers
            onClose={handleCloseDrivers}
            editingLicense={editingLicense}
          />
        </Dialog>

        <Dialog
          open={openPrpd}
          onClose={handleClosePrpd}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <Prpd onClose={handleClosePrpd} editingLicense={editingLicense} />
        </Dialog>

        <Dialog
          open={openFirearm}
          onClose={handleCloseFirearm}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <Firearm
            onClose={handleCloseFirearm}
            editingLicense={editingLicense}
          />
        </Dialog>

        <Dialog
          open={openWork}
          onClose={handleCloseWork}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <Work onClose={handleCloseWork} editingLicense={editingLicense} />
        </Dialog>

        <Dialog
          open={openOther}
          onClose={handleCloseOther}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <Other 
            onClose={handleCloseOther} 
            editingLicense={editingLicense as any}
          />
        </Dialog>

        <Dialog
          open={openPassport}
          onClose={handleClosePassport}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <Passport
            onClose={handleClosePassport}
            editingPassport={editingLicense}
          />
        </Dialog>

        <Dialog
          open={openTVLicense}
          onClose={handleCloseTVLicense}
          maxWidth="md"
          fullWidth
          PaperProps={{
            style: {
              backgroundColor: "transparent",
              boxShadow: "none",
            },
          }}
        >
          <TVLicense
            onClose={handleCloseTVLicense}
            editingLicense={editingLicense}
          />
        </Dialog>
      </div>
    </>
  );
};

const getLicenseStatus = (expiryDate: string) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    isValid: daysLeft > 0,
    daysLeft,
    isExpiringSoon: daysLeft > 0 && daysLeft <= 30,
  };
};

export default Dashboard;
