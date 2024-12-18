/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, ChangeEvent, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import {
  FiEdit3,
  FiSave,
  FiX,
  FiMail,
  FiPhone,
  FiHash,
  FiInfo,
  FiAlertCircle,
  FiLoader,
  FiCheck,
  FiLock,
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { clearTokens } from "../utils/auth";
import { useUser } from "../hooks/useUser";
import { memo } from "react";
import { IconType } from "react-icons/lib";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
  id_number: string | null;
  contact_number: string | null;
  type_of_user: string;
  subscription_end_date?: string;
  subscription_status: "active" | "inactive" | "expired";
  payment_reference?: string;
  last_payment_date?: string;
  avatar_url?: string;
}

interface State {
  isLoading: boolean;
  profile: UserProfile;
  isEditing: boolean;
  editedProfile: Partial<UserProfile>;
  showModal: boolean;
  isSaving: boolean;
  isChangingPassword: boolean;
  passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  };
  showPasswords: {
    current_password: boolean;
    new_password: boolean;
    confirm_password: boolean;
  };
  isProcessingPayment: boolean;
  showEmailConfirmModal: boolean;
  newEmailAddress: string;
  isMfaEnabled: boolean;
  showMfaModal: boolean;
  mfaSecret: string;
  mfaQrCode: string;
  verificationCode: string;
  mfaFactorId: string;
  mfaDisableCode: string;
  uploadingAvatar: boolean;
  avatarFile: File | null;
  verificationError?: string;
}

const formatFieldValue = (
  field: string,
  value: string | null
): string | null => {
  if (!value) return value;

  if (field === "type_of_user") {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

// Memoize the profile information display component
const ProfileInfoItem = memo(
  ({
    icon: Icon,
    label,
    value,
    field,
  }: {
    icon: IconType;
    label: string;
    value: string | null;
    field: string;
  }) => (
    <div className="relative">
      <div className="flex items-center space-x-2 text-white mb-1">
        <Icon className="h-4 w-4" />
        <label className="text-sm font-medium">{label}</label>
      </div>
      <p className="text-white/80 py-2">
        {formatFieldValue(field, value) || "Not Set"}
      </p>
    </div>
  )
);

// Memoize expensive calculations
const useMemoizedDaysUntilExpiry = (dateString?: string) => {
  return useMemo(() => {
    if (!dateString) return 0;
    const today = new Date();
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dateString]);
};

const formatVerificationCode = (code: string): string => {
  return code.replace(/[^0-9]/g, '').slice(0, 6);
};

const isValidVerificationCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

interface TOTPFactor {
  id: string;
  type: 'totp';
  totp: { qr_code: string; secret: string; uri: string; };
}

// Add this helper function near the top of the file
const getAvatarUrl = (url?: string, email?: string) => {
  if (url) {
    return url;
  }
  // Fallback to DiceBear avatar
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'default'}`;
};

const Profile = () => {
  const { user, loading: userLoading } = useUser();
  const [state, setState] = useState<State>({
    isLoading: true,
    profile: {
      first_name: null,
      last_name: null,
      email: "",
      id_number: null,
      contact_number: null,
      type_of_user: "registered",
      subscription_status: "inactive",
    } as UserProfile,
    isEditing: false,
    editedProfile: {} as Partial<UserProfile>,
    showModal: false,
    isSaving: false,
    isChangingPassword: false,
    passwordData: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    showPasswords: {
      current_password: false,
      new_password: false,
      confirm_password: false,
    },
    isProcessingPayment: false,
    showEmailConfirmModal: false,
    newEmailAddress: "",
    isMfaEnabled: false,
    showMfaModal: false,
    mfaSecret: "",
    mfaQrCode: "",
    verificationCode: "",
    mfaFactorId: "",
    mfaDisableCode: "",
    uploadingAvatar: false,
    avatarFile: null,
  });

  const navigate = useNavigate();
  const daysUntilExpiry = useMemoizedDaysUntilExpiry(
    state.profile.subscription_end_date
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, field: string) => {
      setState((prev) => ({
        ...prev,
        editedProfile: {
          ...prev.editedProfile,
          [field]: e.target.value,
        },
      }));
    },
    []
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleTokenExpiration = useCallback(() => {
    clearTokens();
    toast.error("Session expired. Please sign in again.");
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const client = await supabase;  // Get initialized client
        
        const { data: sessionData, error: sessionError } = await client.auth.getSession();

        if (sessionError || !sessionData.session) {
          handleTokenExpiration();
          return;
        }

        // Get MFA factors
        const { data: factorsData, error: listError } = await client.auth.mfa.listFactors();
        const factors = factorsData?.totp || [];

        if (listError) throw listError;

        const verifiedTOTP = factors.find(
          (factor: any) => factor.factor_type === 'totp' && factor.status === 'verified'
        );

        const { user } = sessionData.session;

        // Get user metadata from profiles table
        let profileData = null;
        const { data: initialProfileData, error: profileError } = await client
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          if (profileError.code === "PGRST116") {
            const { data: newProfile, error: createError } = await client
              .from("profiles")
              .insert([{
                id: user.id,
                email: user.email,
                type_of_user: "registered",
                subscription_status: "inactive",
              }])
              .select()
              .single();

            if (createError) throw createError;
            profileData = newProfile;
          } else {
            throw profileError;
          }
        } else {
          profileData = initialProfileData;
        }

        const userData = {
          email: user.email ?? "",
          first_name: profileData?.first_name ?? null,
          last_name: profileData?.last_name ?? null,
          id_number: profileData?.id_number ?? null,
          contact_number: profileData?.contact_number ?? null,
          type_of_user: profileData?.type_of_user ?? "registered",
          subscription_status: profileData?.subscription_status ?? "inactive",
          subscription_end_date: profileData?.subscription_end_date,
          payment_reference: profileData?.payment_reference,
          last_payment_date: profileData?.last_payment_date,
          avatar_url: profileData?.avatar_url,
        };

        setState((prev) => ({
          ...prev,
          profile: userData,
          isMfaEnabled: !!verifiedTOTP,
          mfaFactorId: verifiedTOTP?.id || "",
          showModal:
            !userData.first_name ||
            !userData.last_name ||
            !userData.id_number ||
            !userData.contact_number ||
            userData.first_name.trim() === "" ||
            userData.last_name.trim() === "" ||
            userData.id_number.trim() === "" ||
            userData.contact_number.trim() === "",
        }));
      } catch (error: any) {
        console.error("Error loading profile:", error);
        if (error.status === 403 || error.status === 401) {
          handleTokenExpiration();
        } else {
          toast.error("Failed to load profile!");
        }
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchProfileData();
  }, [handleTokenExpiration]);

  useEffect(() => {
    if (!userLoading && !user) {
      handleTokenExpiration();
    }
  }, [user, userLoading, handleTokenExpiration]);

  useEffect(() => {
    const handleEmailChange = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await (await supabase).auth.getSession();

        // If no session, don't proceed with email update
        if (!session || sessionError) {
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await (await supabase).auth.getUser();

        if (userError) throw userError;

        // Only update if user exists and has an email
        if (user?.email && user.email !== state.profile.email) {
          const { error: updateError } = await (await supabase)
            .from("profiles")
            .update({ email: user.email })
            .eq("id", user.id);

          if (updateError) throw updateError;

          setState((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              email: user.email || prev.profile.email,
            },
            showEmailConfirmModal: false,
            newEmailAddress: "",
          }));

          toast.success("Email updated successfully!");
          // Redirect to login only if session is lost
          if (!session) {
            navigate("/", { replace: true });
          }
        }
      } catch (error: any) {
        console.error("Error handling email verification:", error);
        toast.error("Failed to update email in profile!");
      }
    };

    handleEmailChange();
  }, [navigate, state.profile.email]);

  if (userLoading || state.isLoading) {
    return <LoadingSpinner text="Loading Profile..." />;
  }

  if (!user) {
    return null;
  }

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      setState((prev) => ({ ...prev, isSaving: true }));
      
      const client = await supabase;

      const { data: { user }, error: authError } = await client.auth.getUser();

      if (authError || !user) {
        handleTokenExpiration();
        return;
      }

      if (data.email && data.email !== state.profile.email) {
        await updateEmail(data.email);
        delete data.email;
      }

      if (Object.keys(data).length > 0) {
        const { error: updateError } = await client
          .from("profiles")
          .update(data)
          .eq("id", user.id);

        if (updateError) throw updateError;

        const { data: updatedUser, error: fetchError } = await client
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (fetchError) throw fetchError;

        setState((prev) => ({
          ...prev,
          profile: {
            ...updatedUser,
            email: user.email || prev.profile.email,
          },
          isEditing: false,
        }));

        toast.success("Profile updated successfully!");
      }
    } catch (error: any) {
      toast.error("Failed to update profile!");
      console.error(error);
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Refined password validation
  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    return { isValid: true, message: "" };
  };

  // Enhanced password change handler
  const handlePasswordChange = async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      const validation = validatePassword(state.passwordData.new_password);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      if (state.passwordData.new_password !== state.passwordData.confirm_password) {
        throw new Error("New passwords don't match");
      }

      const client = await supabase;
      const { error: updateError } = await client.auth.updateUser({
        password: state.passwordData.new_password
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully!");
      setState(prev => ({
        ...prev,
        isChangingPassword: false,
        passwordData: {
          current_password: "",
          new_password: "",
          confirm_password: "",
        }
      }));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const updateEmail = async (newEmail: string) => {
    try {
      setState((prev) => ({ ...prev, isSaving: true }));
      
      const client = await supabase;

      const { error: authError } = await client.auth.updateUser({
        email: newEmail,
      });

      if (authError) throw authError;

      setState((prev) => ({
        ...prev,
        editedProfile: {},
        isEditing: false,
        showEmailConfirmModal: true,
        newEmailAddress: newEmail,
      }));

      toast.success("Please check your email for verification link");
    } catch (error: any) {
      toast.error(error.message || "Failed to update email!");
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  async function handlePersonalInfoUpdate(): Promise<void> {
    try {
      const {
        data: { user },
        error: sessionError,
      } = await (await supabase).auth.getUser();

      if (sessionError || !user) {
        handleTokenExpiration();
        return;
      }

      const { error: updateError } = await (await supabase)
        .from("profiles")
        .update(state.editedProfile)
        .eq("id", user.id)
        .select();

      if (updateError) throw updateError;

      setState((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...state.editedProfile,
        },
        showModal: false,
        editedProfile: {},
      }));
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile!");
    }
  }

  // Add this helper function near your other utility functions
  const isSubscriptionExpired = (endDate?: string): boolean => {
    if (!endDate) return true;
    const today = new Date();
    const expiryDate = new Date(endDate);
    return today > expiryDate;
  };

  const setupMfa = async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      const client = await supabase;

      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (!session || sessionError) {
        throw new Error('Valid session required');
      }

      const { data: factorsData, error: factorsError } = await client.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      // First, unenroll any existing TOTP factors
      const existingFactors = factorsData.totp || [];
      for (const factor of existingFactors) {
        if (factor.factor_type === 'totp') {
          await client.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      // Generate a unique friendly name using timestamp
      const timestamp = new Date().getTime();
      const friendlyName = `Remlic-${session.user.email}-${timestamp}`;

      const { data, error } = await client.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Remlic',
        friendlyName: friendlyName,
      }) as { data: TOTPFactor | null, error: Error | null };

      if (error) throw error;

      if (!data || data.type !== 'totp') {
        throw new Error('Failed to generate TOTP data');
      }

      setState(prev => ({
        ...prev,
        mfaSecret: data.totp.secret,
        mfaQrCode: data.totp.qr_code,
        mfaFactorId: data.id,
        showMfaModal: true,
      }));

    } catch (error: any) {
      console.error('MFA Setup Error:', error);
      toast.error(error.message || "Failed to setup MFA");
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const verifyAndEnableMfa = async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));

      if (!state.mfaFactorId) {
        throw new Error('MFA setup not initialized');
      }

      // Create challenge
      const { data: challengeData, error: challengeError } = await (await supabase).auth.mfa.challenge({
        factorId: state.mfaFactorId
      });

      if (challengeError || !challengeData) {
        throw new Error('Failed to create challenge');
      }

      // Verify the challenge
      const { error: verifyError } = await (await supabase).auth.mfa.verify({
        factorId: state.mfaFactorId,
        challengeId: challengeData.id,
        code: state.verificationCode
      });

      if (verifyError) {
        throw verifyError;
      }

      // Update state after successful verification
      setState(prev => ({
        ...prev,
        isMfaEnabled: true,
        showMfaModal: false,
        verificationCode: "",
        mfaSecret: "",
        mfaQrCode: "",
      }));
      
      toast.success("2FA enabled successfully!");

    } catch (error: any) {
      console.error('MFA Verification Error:', error);
      toast.error(error.message || "Verification failed");
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const disableMfa = async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));

      // First verify the code
      const { data: challengeData, error: challengeError } = await (await supabase).auth.mfa.challenge({
        factorId: state.mfaFactorId
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await (await supabase).auth.mfa.verify({
        factorId: state.mfaFactorId,
        challengeId: challengeData.id,
        code: state.verificationCode,
      });

      if (verifyError) throw verifyError;

      // If verification successful, unenroll
      const { error: unenrollError } = await (await supabase).auth.mfa.unenroll({
        factorId: state.mfaFactorId
      });

      if (unenrollError) throw unenrollError;

      setState(prev => ({
        ...prev,
        isMfaEnabled: false,
        showMfaModal: false,
        verificationCode: "",
        mfaFactorId: "",
      }));

      toast.success("2FA disabled successfully!");

    } catch (error: any) {
      toast.error(error.message || "Failed to disable 2FA");
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleAvatarUpdate = async (file: File) => {
    try {
      setState(prev => ({ ...prev, uploadingAvatar: true }));
      
      const client = await supabase;
      
      // Get current user
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) throw userError;

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await client.storage
        .from('avatars') // Make sure this bucket exists in your Supabase project
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = client.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await client
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setState(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          avatar_url: publicUrl
        },
      }));

      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(error.message || 'Failed to update profile picture');
    } finally {
      setState(prev => ({ ...prev, uploadingAvatar: false }));
    }
  };

  // Enhanced MFA verification code handling
  const handleVerificationCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const code = formatVerificationCode(e.target.value);
    setState(prev => ({ 
      ...prev, 
      verificationCode: code,
      verificationError: code.length === 6 && !/^\d{6}$/.test(code) 
        ? "Please enter exactly 6 digits" 
        : ""
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
      <div className="max-w-4xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-indigo-500/20">
          <div className="bg-[#1f2937]/30 backdrop-blur-xl px-6 sm:px-8 py-8 sm:py-10 border-b border-indigo-500/20">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-6">
              <div className="h-24 w-24 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm mb-4 sm:mb-0 border border-indigo-400/30 relative group overflow-hidden">
                <img
                  src={getAvatarUrl(state.profile.avatar_url, state.profile.email)}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
                
                <button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                    transition-opacity duration-200 flex items-center justify-center text-white"
                >
                  <FiEdit3 className="h-5 w-5" />
                </button>
                
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAvatarUpdate(file);
                    }
                  }}
                />
                {state.uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <FiLoader className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left flex-grow">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {state.profile.first_name} {state.profile.last_name}
                </h2>
                <p className="text-white/70 mt-1 font-medium">
                  ID: {state.profile.id_number}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {state.isMfaEnabled ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-lg
                      bg-green-500/20 text-green-400 font-medium text-sm">
                      <FiShield className="h-4 w-4 mr-2" />
                      2FA Enabled
                    </span>
                  ) : (
                    <button
                      onClick={setupMfa}
                      className="inline-flex items-center px-4 py-2 rounded-lg
                        bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700
                        border border-blue-400/50 hover:border-blue-400/70
                        text-white font-medium text-sm transition-all duration-200
                        shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
                        transform hover:scale-[1.02]"
                    >
                      <FiShield className="h-4 w-4 mr-2" />
                      <span>Enable 2FA</span>
                    </button>
                  )}
                  {state.profile.type_of_user === "admin" && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="inline-flex items-center px-4 py-2 rounded-lg
                        bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700
                        border border-purple-400/50 hover:border-purple-400/70
                        text-white font-medium text-sm transition-all duration-200
                        shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30
                        transform hover:scale-[1.02]"
                    >
                      <FiUsers className="h-4 w-4 mr-2" />
                      <span>Admin Panel</span>
                    </button>
                  )}
                </div>
              </div>
              {(state.profile.type_of_user === "registered" ||
                state.profile.subscription_status === "expired" ||
                isSubscriptionExpired(state.profile.subscription_end_date)) && (
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={() => navigate("/price")}
                    className="group relative w-full sm:w-auto px-6 py-3 rounded-xl transition-all duration-300
                      bg-gradient-to-r from-amber-200 via-yellow-300 to-yellow-400
                      hover:from-amber-300 hover:via-yellow-400 hover:to-yellow-500
                      text-gray-900 font-semibold text-sm sm:text-base
                      shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30
                      border border-amber-200/20 hover:border-amber-300/30
                      transform hover:scale-[1.02]
                      flex items-center justify-center space-x-3"
                  >
                    <FiCreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="bg-gradient-to-r from-amber-900 to-yellow-800 bg-clip-text text-transparent">
                      Upgrade Account
                    </span>
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-yellow-300/20 to-yellow-200/20 
                        animate-shimmer transform -translate-x-full group-hover:translate-x-full transition-transform duration-1500"
                      />
                    </div>
                  </button>
                </div>
              )}
            </div>
            {state.profile.type_of_user !== "registered" &&
            state.profile.subscription_status === "active" &&
            !isSubscriptionExpired(state.profile.subscription_end_date) ? (
              <div className="mt-6 bg-[#1f2937]/30 backdrop-blur-xl rounded-xl p-4 mx-6 border border-indigo-500/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <FiCheck className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-white">
                        Active Subscription
                      </span>
                      <span className="text-sm text-white/70">
                        {formatFieldValue(
                          "type_of_user",
                          state.profile.type_of_user
                        )}{" "}
                        Plan
                      </span>
                    </div>
                  </div>
                  <div className="text-sm flex flex-col items-center sm:items-end">
                    <span className="text-white font-medium">
                      Valid until:{" "}
                      {formatDate(state.profile.subscription_end_date || "")}
                    </span>
                    <span className="text-white/70">
                      {daysUntilExpiry} days remaining
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="px-6 sm:px-8 py-8 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                  Editable Information
                </h3>
                {["email", "contact_number"].map((field) => (
                  <div key={field} className="relative">
                    <div className="flex items-center space-x-2 text-white mb-1">
                      {field === "email" && (
                        <>
                          <FiMail className="h-4 w-4" />
                          <label className="text-sm font-medium">
                            Email
                            {state.profile.email === user?.email ? (
                              user?.email_confirmed_at ? (
                                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                  Verified
                                </span>
                              ) : (
                                <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                  Not Verified
                                </span>
                              )
                            ) : (
                              <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                Pending Verification
                              </span>
                            )}
                          </label>
                        </>
                      )}
                      {field === "contact_number" && (
                        <FiPhone className="h-4 w-4" />
                      )}
                      {field === "contact_number" && (
                        <label className="text-sm font-medium">
                          Contact Number
                        </label>
                      )}
                    </div>
                    {state.isEditing ? (
                      <input
                        type={field === "email" ? "email" : "text"}
                        className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder-white/50"
                        defaultValue={
                          state.profile[field as keyof UserProfile] || ""
                        }
                        onChange={(e) => handleInputChange(e, field)}
                      />
                    ) : (
                      <p className="text-white/80 py-2">
                        {state.profile[field as keyof UserProfile]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
                  Personal Information
                </h3>
                {["first_name", "last_name", "id_number", "type_of_user"].map(
                  (field) => (
                    <ProfileInfoItem
                      key={field}
                      icon={field === "type_of_user" ? FiInfo : FiHash}
                      label={
                        field === "id_number"
                          ? "SA ID Number"
                          : field
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")
                      }
                      value={state.profile[field as keyof UserProfile] ?? null}
                      field={field}
                    />
                  )
                )}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                {state.isEditing ? (
                  <>
                    <button
                      className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 
                        bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30
                        border border-red-500/30 hover:border-red-500/50 text-white font-medium text-sm sm:text-base
                        disabled:opacity-50 flex items-center justify-center space-x-2"
                      onClick={() =>
                        setState((prev) => ({ ...prev, isEditing: false }))
                      }
                      disabled={state.isSaving}
                    >
                      <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Cancel</span>
                    </button>
                    <button
                      className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200
                        bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
                        border border-indigo-500/50 hover:border-indigo-500/70 text-white font-medium text-sm sm:text-base
                        disabled:opacity-50 flex items-center justify-center space-x-2"
                      onClick={() => updateProfile(state.editedProfile)}
                      disabled={state.isSaving}
                    >
                      {state.isSaving ? (
                        <>
                          <FiLoader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiSave className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200
                        bg-gradient-to-r from-indigo-500/20 to-purple-600/20 hover:from-indigo-500/30 hover:to-purple-600/30
                        border border-indigo-500/30 hover:border-indigo-500/50 text-white font-medium text-sm sm:text-base
                        flex items-center justify-center space-x-2"
                      onClick={() =>
                        setState((prev) => ({ ...prev, isEditing: true }))
                      }
                    >
                      <FiEdit3 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200
                        bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30
                        border border-emerald-500/30 hover:border-emerald-500/50 text-white font-medium text-sm sm:text-base
                        flex items-center justify-center space-x-2"
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          isChangingPassword: true,
                        }))
                      }
                    >
                      <FiLock className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Change Password</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {state.showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold flex items-center text-white">
                    <FiAlertCircle className="mr-2 text-indigo-400" />
                    Important Information Needed
                  </h3>
                  <button
                    onClick={() =>
                      setState((prev) => ({ ...prev, showModal: false }))
                    }
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  {[
                    "first_name",
                    "last_name",
                    "contact_number",
                    "id_number",
                  ].map((field) => (
                    <div key={field} className="space-y-2">
                      <label className="block text-sm font-medium text-white/80">
                        {field === "id_number"
                          ? "SA ID Number"
                          : field === "contact_number"
                          ? "Contact Number"
                          : field
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                      </label>
                      <input
                        type={field === "contact_number" ? "tel" : "text"}
                        placeholder={
                          field === "contact_number"
                            ? "+27 XX XXX XXXX"
                            : field === "id_number"
                            ? "YYMMDDXXXXXXX"
                            : `Enter your ${field.replace("_", " ")}`
                        }
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                          focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                          text-white placeholder-white/30 transition-all duration-200"
                        onChange={(e) => handleInputChange(e, field)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3 pt-4 border-t border-white/10">
                  <button
                    className="flex-1 bg-white/5 text-white py-2.5 rounded-xl hover:bg-white/10 
                      transition-all duration-200 border border-white/10"
                    onClick={() =>
                      setState((prev) => ({ ...prev, showModal: false }))
                    }
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700
                      transition-all duration-200 flex items-center justify-center space-x-2"
                    onClick={handlePersonalInfoUpdate}
                  >
                    <FiSave className="h-4 w-4" />
                    <span>Save Information</span>
                  </button>
                </div>

                <p className="text-white/50 text-sm text-center">
                  This information is required to complete your profile setup
                </p>
              </div>
            </div>
          )}
          {state.isChangingPassword && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold flex items-center text-white">
                    <FiLock className="mr-2 text-indigo-400" />
                    Change Password
                  </h3>
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        isChangingPassword: false,
                      }))
                    }
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  {[
                    { key: "new_password", label: "New Password" },
                    { key: "confirm_password", label: "Confirm New Password" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-white/80">
                        {label}
                      </label>
                      <div className="relative">
                        <input
                          type={state.showPasswords[key as keyof typeof state.showPasswords] ? "text" : "password"}
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                            focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            text-white placeholder-white/30 transition-all duration-200 pr-10"
                          value={state.passwordData[key as keyof typeof state.passwordData]}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            passwordData: {
                              ...prev.passwordData,
                              [key]: e.target.value,
                            }
                          }))}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
                          onClick={() => setState(prev => ({
                            ...prev,
                            showPasswords: {
                              ...prev.showPasswords,
                              [key]: !prev.showPasswords[key as keyof typeof prev.showPasswords],
                            }
                          }))}
                        >
                          {state.showPasswords[key as keyof typeof state.showPasswords] 
                            ? <FiEyeOff className="h-5 w-5" /> 
                            : <FiEye className="h-5 w-5" />
                          }
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Password requirements */}
                  <div className="space-y-2 text-sm text-white/60">
                    <p>Password must contain:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least 8 characters</li>
                      <li>One uppercase letter</li>
                      <li>One lowercase letter</li>
                      <li>One number</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-white/10">
                  <button
                    className="w-full bg-white/5 text-white py-2.5 rounde                    d-xl hover:bg-white/10 
                      transition-all duration-200 border border-white/10 text-sm sm:text-base"
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        isChangingPassword: false,
                      }))
                    }
                  >
                    Cancel
                  </button>
                  <button
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700
                      transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                    onClick={handlePasswordChange}
                    disabled={state.isSaving || 
                      !state.passwordData.new_password || 
                      !state.passwordData.confirm_password ||
                      state.passwordData.new_password !== state.passwordData.confirm_password}
                  >
                    {state.isSaving ? (
                      <>
                        <FiLoader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <FiLock className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {state.showEmailConfirmModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
                <div className="flex items-center space-x-3 text-white">
                  <FiMail className="h-6 w-6 text-indigo-400" />
                  <h3 className="text-xl font-bold">Verify Your New Email</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-white/80">
                    A verification email has been sent to:
                  </p>
                  <p className="text-indigo-400 font-medium">
                    {state.newEmailAddress}
                  </p>
                  <p className="text-white/80">
                    Please check your email and click the verification link to
                    complete the email change. Your current email will remain
                    active until you verify the new address.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700
                      transition-all duration-200 flex items-center justify-center space-x-2"
                    onClick={() =>
                      setState((prev) => ({
        ...prev,
                        showEmailConfirmModal: false,
                        newEmailAddress: "",
                      }))
                    }
                  >
                    <FiCheck className="h-5 w-5" />
                    <span>I Understand</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          {state.showMfaModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-xl font-bold flex items-center text-white">
                    <FiShield className="mr-2 text-indigo-400" />
                    {state.isMfaEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
                  </h3>
                  <button 
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      showMfaModal: false,
                      verificationCode: "",
                      mfaSecret: "",
                      mfaQrCode: "" 
                    }))}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {!state.isMfaEnabled && (
                    <>
                      <div className="space-y-4">
                        <img 
                          src={state.mfaQrCode} 
                          alt="QR Code" 
                          className="mx-auto bg-white p-2 rounded-lg"
                        />
                        <div className="text-white/80 space-y-2">
                          <p className="font-medium">Setup Instructions:</p>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                            <li>Scan the QR code with your authenticator app</li>
                            <li>Enter the 6-digit code shown in your app</li>
                          </ol>
                        </div>
                        {state.mfaSecret && (
                          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                            <p className="text-white/80 text-sm mb-2">Manual Setup Code:</p>
                            <code className="text-indigo-400 font-mono text-sm break-all">
                              {state.mfaSecret}
                            </code>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {state.isMfaEnabled && (
                    <div className="space-y-4">
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                        <p className="text-yellow-300 text-sm">
                          <FiAlertCircle className="inline-block mr-2" />
                          Disabling 2FA will make your account less secure. Are you sure?
                        </p>
                      </div>
                      <p className="text-white/80">
                        Enter the current 6-digit code from your authenticator app to confirm:
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white/80">
                        Verification Code
                      </label>
                      <span className="text-xs text-white/60">
                        Enter 6 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl
                        focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        text-white placeholder-white/30 transition-all duration-200 text-center text-2xl tracking-wider
                        ${isValidVerificationCode(state.verificationCode) 
                          ? 'border-green-500/50' 
                          : 'border-white/10'}`}
                      placeholder="000000"
                      value={state.verificationCode}
                      onChange={handleVerificationCodeChange}
                    />
                    {state.verificationError && (
                      <p className="text-red-400 text-xs mt-1">
                        {state.verificationError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-white/10">
                  <button 
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      showMfaModal: false,
                      verificationCode: "",
                      mfaSecret: "",
                      mfaQrCode: "" 
                    }))}
                    className="w-full bg-white/5 text-white py-2.5 rounded-xl hover:bg-white/10
                      transition-all duration-200 border border-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={state.isMfaEnabled ? disableMfa : verifyAndEnableMfa}
                    disabled={state.isSaving || !isValidVerificationCode(state.verificationCode)}
                    className={`w-full text-white py-2.5 rounded-xl
                      transition-all duration-200 flex items-center justify-center space-x-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${state.isMfaEnabled 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                  >
                    {state.isSaving ? (
                      <>
                        <FiLoader className="h-4 w-4 animate-spin" />
                        <span>{state.isMfaEnabled ? 'Disabling...' : 'Enabling...'}</span>
                      </>
                    ) : (
                      <>
                        <FiShield className="h-4 w-4" />
                        <span>{state.isMfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}</span>
                      </>
                    )}
                  </button>
                </div>

                {!state.isMfaEnabled && (
                  <p className="text-white/50 text-xs text-center">
                    Two-factor authentication adds an extra layer of security to your account by requiring a code from your authenticator app when signing in.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Profile;
