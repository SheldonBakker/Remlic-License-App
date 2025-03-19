import React, { memo, useState } from "react";
import { FiEdit3, FiSave, FiX, FiMail, FiPhone, FiHash, FiInfo, FiLoader, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { UserProfile, ProfileInfoItemProps } from "../types";
import { formatFieldValue } from "../utils";

// Memoized ProfileInfoItem component
const ProfileInfoItem = memo(({ icon: Icon, label, value, field }: ProfileInfoItemProps) => (
  <div className="relative">
    <div className="flex items-center space-x-2 text-white mb-1">
      <Icon className="h-4 w-4" />
      <label className="text-sm font-medium">{label}</label>
    </div>
    <p className="text-white/80 py-2">{formatFieldValue(field, value) || "Not Set"}</p>
  </div>
));

interface UserData {
  email?: string;
  email_confirmed_at?: string | null;
}

interface ProfileInfoProps {
  profile: UserProfile;
  isEditing: boolean;
  isSaving: boolean;
  user: UserData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  cancelEdit: () => void;
  startEdit: () => void;
  startChangePassword: () => void;
  saveChanges: (confirmPassword?: string) => void;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({
  profile,
  isEditing,
  isSaving,
  user,
  handleInputChange,
  cancelEdit,
  startEdit,
  startChangePassword,
  saveChanges,
}) => {
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailChanged, setIsEmailChanged] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setIsEmailChanged(newEmail !== profile.email);
    handleInputChange(e, "email");
  };

  const handleSaveWithConfirmation = () => {
    saveChanges(isEmailChanged ? confirmPassword : undefined);
  };

  return (
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
                      {profile.email === user?.email ? (
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
                {field === "contact_number" && <FiPhone className="h-4 w-4" />}
                {field === "contact_number" && (
                  <label className="text-sm font-medium">Contact Number</label>
                )}
              </div>
              {isEditing ? (
                <input
                  type={field === "email" ? "email" : "text"}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder-white/50"
                  defaultValue={profile[field as keyof UserProfile] || ""}
                  onChange={field === "email" ? handleEmailChange : (e) => handleInputChange(e, field)}
                />
              ) : (
                <p className="text-white/80 py-2">{profile[field as keyof UserProfile]}</p>
              )}
            </div>
          ))}

          {/* Password confirmation when email is changed */}
          {isEditing && isEmailChanged && (
            <div className="relative mt-4">
              <div className="flex items-center space-x-2 text-white mb-1">
                <FiLock className="h-4 w-4" />
                <label className="text-sm font-medium">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <span className="text-xs text-white/60">(Required to change email)</span>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 text-white placeholder-white/50 pr-10"
                  placeholder="Enter your current password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">
            Personal Information
          </h3>
          {["first_name", "last_name", "id_number", "type_of_user"].map((field) => (
            <ProfileInfoItem
              key={field}
              icon={field === "type_of_user" ? FiInfo : FiHash}
              label={
                field === "id_number"
                  ? "SA ID Number"
                  : field
                      .split("_")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")
              }
              value={profile[field as keyof UserProfile] ?? null}
              field={field}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          {isEditing ? (
            <>
              <button
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 
                  bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30
                  border border-red-500/30 hover:border-red-500/50 text-white font-medium text-sm sm:text-base
                  disabled:opacity-50 flex items-center justify-center space-x-2"
                onClick={cancelEdit}
                disabled={isSaving}
              >
                <FiX className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Cancel</span>
              </button>
              <button
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200
                  bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700
                  border border-indigo-500/50 hover:border-indigo-500/70 text-white font-medium text-sm sm:text-base
                  disabled:opacity-50 flex items-center justify-center space-x-2"
                onClick={handleSaveWithConfirmation}
                disabled={isSaving || (isEmailChanged && !confirmPassword)}
              >
                {isSaving ? (
                  <>
                    <FiLoader className="h-4 sm:h-5 sm:w-5 animate-spin" />
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
                onClick={startEdit}
              >
                <FiEdit3 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Edit Profile</span>
              </button>
              <button
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200
                  bg-gradient-to-r from-emerald-500/20 to-teal-600/20 hover:from-emerald-500/30 hover:to-teal-600/30
                  border border-emerald-500/30 hover:border-emerald-500/50 text-white font-medium text-sm sm:text-base
                  flex items-center justify-center space-x-2"
                onClick={startChangePassword}
              >
                <FiLock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Change Password</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileInfo; 