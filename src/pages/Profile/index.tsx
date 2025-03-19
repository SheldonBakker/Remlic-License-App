import React, { useMemo } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { calculateDaysUntilExpiry } from "./utils";
import { useProfileData } from "./hooks/useProfileData";
import { useProfileUpdate } from "./hooks/useProfileUpdate";
import { usePasswordChange } from "./hooks/usePasswordChange";
import { useMfa } from "./hooks/useMfa";

// Components
import ProfileHeader from "./components/ProfileHeader";
import ProfileInfo from "./components/ProfileInfo";
import PersonalInfoModal from "./components/modals/PersonalInfoModal";
import PasswordChangeModal from "./components/modals/PasswordChangeModal";
import EmailConfirmModal from "./components/modals/EmailConfirmModal";
import MfaModal from "./components/modals/MfaModal";

const Profile: React.FC = () => {
  // Get profile data and state
  const { state, setState, user, userLoading, handleTokenExpiration } = useProfileData();
  
  // Profile update handlers
  const { 
    handleInputChange, 
    updateProfile, 
    handlePersonalInfoUpdate, 
    handleAvatarUpdate 
  } = useProfileUpdate(state, setState, handleTokenExpiration);
  
  // Password change handlers
  const { handlePasswordChange } = usePasswordChange(state, setState);
  
  // MFA handlers
  const {
    handleVerificationCodeChange,
    setupMfa,
    verifyAndEnableMfa,
    disableMfa,
  } = useMfa(state, setState);

  // Calculate days until subscription expiry
  const daysUntilExpiry = useMemo(
    () => calculateDaysUntilExpiry(state.profile.subscription_end_date),
    [state.profile.subscription_end_date]
  );

  // UI event handlers
  const startEditing = () => setState(prev => ({ ...prev, isEditing: true }));
  const cancelEditing = () => setState(prev => ({ ...prev, isEditing: false }));
  const startChangePassword = () => setState(prev => ({ ...prev, isChangingPassword: true }));
  const cancelPasswordChange = () => setState(prev => ({ ...prev, isChangingPassword: false }));
  const closePersonalInfoModal = () => setState(prev => ({ ...prev, showModal: false }));
  const closeEmailConfirmModal = () => 
    setState(prev => ({ ...prev, showEmailConfirmModal: false, newEmailAddress: "" }));
  const closeMfaModal = () => 
    setState(prev => ({ 
      ...prev, 
      showMfaModal: false, 
      verificationCode: "",
      mfaSecret: "",
      mfaQrCode: ""
    }));
    
  const onPasswordInputChange = (
    key: "current_password" | "new_password" | "confirm_password",
    value: string
  ) => {
    setState(prev => ({
      ...prev,
      passwordData: {
        ...prev.passwordData,
        [key]: value,
      }
    }));
  };
  
  const togglePasswordVisibility = (
    key: "current_password" | "new_password" | "confirm_password"
  ) => {
    setState(prev => ({
      ...prev,
      showPasswords: {
        ...prev.showPasswords,
        [key]: !prev.showPasswords[key],
      }
    }));
  };

  const handleSaveChanges = (confirmPassword?: string) => {
    updateProfile(state.editedProfile, confirmPassword);
  };

  // Loading state
  if (userLoading || state.isLoading) {
    return <LoadingSpinner text="Loading Profile..." />;
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]">
      <div className="max-w-4xl mx-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-indigo-500/20">
          {/* Profile Header */}
          <ProfileHeader
            profile={state.profile}
            isMfaEnabled={state.isMfaEnabled}
            uploadingAvatar={state.uploadingAvatar}
            handleAvatarChange={handleAvatarUpdate}
            setupMfa={setupMfa}
            daysUntilExpiry={daysUntilExpiry}
          />

          {/* Profile Info */}
          <ProfileInfo
            profile={state.profile}
            isEditing={state.isEditing}
            isSaving={state.isSaving}
            user={user}
            handleInputChange={handleInputChange}
            cancelEdit={cancelEditing}
            startEdit={startEditing}
            startChangePassword={startChangePassword}
            saveChanges={handleSaveChanges}
          />

          {/* Modals */}
          {state.showModal && (
            <PersonalInfoModal
              handleInputChange={handleInputChange}
              handlePersonalInfoUpdate={handlePersonalInfoUpdate}
              closeModal={closePersonalInfoModal}
            />
          )}

          {state.isChangingPassword && (
            <PasswordChangeModal
              state={state}
              handlePasswordChange={handlePasswordChange}
              cancelPasswordChange={cancelPasswordChange}
              onPasswordInputChange={onPasswordInputChange}
              togglePasswordVisibility={togglePasswordVisibility}
            />
          )}

          {state.showEmailConfirmModal && (
            <EmailConfirmModal
              newEmailAddress={state.newEmailAddress}
              closeModal={closeEmailConfirmModal}
            />
          )}

          {state.showMfaModal && (
            <MfaModal
              state={state}
              handleVerificationCodeChange={handleVerificationCodeChange}
              closeModal={closeMfaModal}
              verifyAndEnableMfa={verifyAndEnableMfa}
              disableMfa={disableMfa}
            />
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