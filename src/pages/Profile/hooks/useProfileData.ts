import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clearTokens } from "../../../utils/auth";
import { useUser } from "../../../hooks/useUser";
import { ProfileState, UserProfile } from "../types";

const initialState: ProfileState = {
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
};

export function useProfileData() {
  const [state, setState] = useState<ProfileState>(initialState);
  const { user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const handleTokenExpiration = useCallback(() => {
    clearTokens();
    toast.error("Session expired. Please sign in again.");
    navigate("/", { replace: true });
  }, [navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const client = await supabase;
        
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
          (factor) => factor.factor_type === 'totp' && factor.status === 'verified'
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
      } catch (error: Error | unknown) {
        console.error("Error loading profile:", error);
        if (
          typeof error === 'object' && 
          error !== null && 
          'status' in error && 
          (error.status === 403 || error.status === 401)
        ) {
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

  // Check if user is authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      handleTokenExpiration();
    }
  }, [user, userLoading, handleTokenExpiration]);

  // Handle email changes
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
      } catch (error: unknown) {
        console.error("Error handling email verification:", error);
        toast.error("Failed to update email in profile!");
      }
    };

    handleEmailChange();
  }, [navigate, state.profile.email]);

  return { state, setState, user, userLoading, handleTokenExpiration };
} 