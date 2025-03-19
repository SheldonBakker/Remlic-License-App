import { useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-toastify";
import { ProfileState, DispatchAction, TOTPFactor } from "../types";
import { formatVerificationCode } from "../utils";

export function useMfa(state: ProfileState, setState: DispatchAction) {
  const handleVerificationCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const code = formatVerificationCode(e.target.value);
      setState((prev) => ({
        ...prev,
        verificationCode: code,
        verificationError:
          code.length === 6 && !/^\d{6}$/.test(code)
            ? "Please enter exactly 6 digits"
            : "",
      }));
    },
    [setState]
  );

  const setupMfa = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isSaving: true }));

      const client = await supabase;

      const {
        data: { session },
        error: sessionError,
      } = await client.auth.getSession();
      if (!session || sessionError) {
        throw new Error("Valid session required");
      }

      const { data: factorsData, error: factorsError } = await client.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      // First, unenroll any existing TOTP factors
      const existingFactors = factorsData.totp || [];
      for (const factor of existingFactors) {
        if (factor.factor_type === "totp") {
          await client.auth.mfa.unenroll({ factorId: factor.id });
        }
      }

      // Generate a unique friendly name using timestamp
      const timestamp = new Date().getTime();
      const friendlyName = `Remlic-${session.user.email}-${timestamp}`;

      const { data, error } = (await client.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Remlic",
        friendlyName: friendlyName,
      })) as { data: TOTPFactor | null; error: Error | null };

      if (error) throw error;

      if (!data || data.type !== "totp") {
        throw new Error("Failed to generate TOTP data");
      }

      setState((prev) => ({
        ...prev,
        mfaSecret: data.totp.secret,
        mfaQrCode: data.totp.qr_code,
        mfaFactorId: data.id,
        showMfaModal: true,
      }));
    } catch (error) {
      console.error("MFA Setup Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to setup MFA");
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [setState]);

  const verifyAndEnableMfa = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isSaving: true }));

      if (!state.mfaFactorId) {
        throw new Error("MFA setup not initialized");
      }

      const client = await supabase;

      // Create challenge
      const { data: challengeData, error: challengeError } = await client.auth.mfa.challenge({
        factorId: state.mfaFactorId,
      });

      if (challengeError || !challengeData) {
        throw new Error("Failed to create challenge");
      }

      // Verify the challenge
      const { error: verifyError } = await client.auth.mfa.verify({
        factorId: state.mfaFactorId,
        challengeId: challengeData.id,
        code: state.verificationCode,
      });

      if (verifyError) {
        throw verifyError;
      }

      // Update state after successful verification
      setState((prev) => ({
        ...prev,
        isMfaEnabled: true,
        showMfaModal: false,
        verificationCode: "",
        mfaSecret: "",
        mfaQrCode: "",
      }));

      toast.success("2FA enabled successfully!");
    } catch (error) {
      console.error("MFA Verification Error:", error);
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [state.mfaFactorId, state.verificationCode, setState]);

  const disableMfa = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isSaving: true }));

      const client = await supabase;

      // First verify the code
      const { data: challengeData, error: challengeError } = await client.auth.mfa.challenge({
        factorId: state.mfaFactorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await client.auth.mfa.verify({
        factorId: state.mfaFactorId,
        challengeId: challengeData.id,
        code: state.verificationCode,
      });

      if (verifyError) throw verifyError;

      // If verification successful, unenroll
      const { error: unenrollError } = await client.auth.mfa.unenroll({
        factorId: state.mfaFactorId,
      });

      if (unenrollError) throw unenrollError;

      setState((prev) => ({
        ...prev,
        isMfaEnabled: false,
        showMfaModal: false,
        verificationCode: "",
        mfaFactorId: "",
      }));

      toast.success("2FA disabled successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable 2FA");
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [state.mfaFactorId, state.verificationCode, setState]);

  return {
    handleVerificationCodeChange,
    setupMfa,
    verifyAndEnableMfa,
    disableMfa,
  };
} 