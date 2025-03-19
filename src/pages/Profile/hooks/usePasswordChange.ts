import { useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-toastify";
import { ProfileState, DispatchAction } from "../types";
import { validatePassword } from "../utils";

export function usePasswordChange(
  state: ProfileState,
  setState: DispatchAction
) {
  const handlePasswordChange = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      if (!state.passwordData.current_password) {
        throw new Error("Current password is required");
      }
      
      // Validate password requirements
      const validation = validatePassword(state.passwordData.new_password);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Check if passwords match
      if (state.passwordData.new_password !== state.passwordData.confirm_password) {
        throw new Error("New passwords don't match");
      }

      const client = await supabase;
      
      // First verify the current password
      const { error: signInError } = await client.auth.signInWithPassword({
        email: state.profile.email,
        password: state.passwordData.current_password
      });
      
      if (signInError) {
        throw new Error("Current password is incorrect");
      }
      
      // Use Supabase's updateUser method to change password
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
        },
        showPasswords: {
          current_password: false,
          new_password: false,
          confirm_password: false,
        }
      }));
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  }, [state.passwordData, state.profile.email, setState]);

  return { handlePasswordChange };
} 