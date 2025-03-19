import { useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { toast } from "react-toastify";
import { ProfileState, UserProfile, DispatchAction } from "../types";

export function useProfileUpdate(
  state: ProfileState,
  setState: DispatchAction,
  handleTokenExpiration: () => void
) {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
      setState((prev) => ({
        ...prev,
        editedProfile: {
          ...prev.editedProfile,
          [field]: e.target.value,
        },
      }));
    },
    [setState]
  );

  const updateEmail = useCallback(
    async (newEmail: string, confirmPassword: string) => {
      try {
        setState((prev) => ({ ...prev, isSaving: true }));
        
        const client = await supabase;

        // First verify the user's identity with their password
        const { error: signInError } = await client.auth.signInWithPassword({
          email: state.profile.email,
          password: confirmPassword
        });

        if (signInError) {
          throw new Error("Incorrect password. Please verify your current password.");
        }

        // Then update the email
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update email!";
        toast.error(errorMessage);
      } finally {
        setState((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [setState, state.profile.email]
  );

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>, confirmPassword?: string) => {
      try {
        setState((prev) => ({ ...prev, isSaving: true }));
        
        const client = await supabase;

        const { data: { user }, error: authError } = await client.auth.getUser();

        if (authError || !user) {
          handleTokenExpiration();
          return;
        }

        if (data.email && data.email !== state.profile.email) {
          if (!confirmPassword) {
            throw new Error("Password confirmation required to update email");
          }
          await updateEmail(data.email, confirmPassword);
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update profile!";
        toast.error(errorMessage);
        console.error(error);
      } finally {
        setState((prev) => ({ ...prev, isSaving: false }));
      }
    },
    [setState, state.profile.email, handleTokenExpiration, updateEmail]
  );

  const handlePersonalInfoUpdate = useCallback(
    async (): Promise<void> => {
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update profile!";
        toast.error(errorMessage);
      }
    },
    [setState, state.editedProfile, handleTokenExpiration]
  );

  const handleAvatarUpdate = useCallback(
    async (file: File) => {
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
      } catch (error: unknown) {
        console.error('Error updating avatar:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
        toast.error(errorMessage);
      } finally {
        setState(prev => ({ ...prev, uploadingAvatar: false }));
      }
    },
    [setState]
  );

  return {
    handleInputChange,
    updateProfile,
    handlePersonalInfoUpdate,
    handleAvatarUpdate
  };
} 