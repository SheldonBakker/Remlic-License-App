import React from "react";
import { FiEdit3, FiShield, FiUsers, FiCreditCard, FiLoader, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../types";
import { formatFieldValue, getAvatarUrl, isSubscriptionExpired, formatDate } from "../utils";

interface ProfileHeaderProps {
  profile: UserProfile;
  isMfaEnabled: boolean;
  uploadingAvatar: boolean;
  handleAvatarChange: (file: File) => void;
  setupMfa: () => Promise<void>;
  daysUntilExpiry: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isMfaEnabled,
  uploadingAvatar,
  handleAvatarChange,
  setupMfa,
  daysUntilExpiry,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#1f2937]/30 backdrop-blur-xl px-6 sm:px-8 py-8 sm:py-10 border-b border-indigo-500/20">
      <div className="flex flex-col sm:flex-row items-center sm:space-x-6">
        <div className="h-24 w-24 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm mb-4 sm:mb-0 border border-indigo-400/30 relative group overflow-hidden">
          <img
            src={getAvatarUrl(profile.avatar_url, profile.email)}
            alt="Profile"
            className="h-full w-full object-cover"
          />

          <button
            onClick={() => document.getElementById("avatar-upload")?.click()}
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
                handleAvatarChange(file);
              }
            }}
          />
          {uploadingAvatar && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <FiLoader className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="text-center sm:text-left flex-grow">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-white/70 mt-1 font-medium">
            ID: {profile.id_number}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {isMfaEnabled ? (
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
            {profile.type_of_user === "admin" && (
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
        {(profile.type_of_user === "registered" ||
          profile.subscription_status === "expired" ||
          isSubscriptionExpired(profile.subscription_end_date)) && (
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
      {profile.type_of_user !== "registered" &&
      profile.subscription_status === "active" &&
      !isSubscriptionExpired(profile.subscription_end_date) ? (
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
                    profile.type_of_user
                  )}{" "}
                  Plan
                </span>
              </div>
            </div>
            <div className="text-sm flex flex-col items-center sm:items-end">
              <span className="text-white font-medium">
                Valid until:{" "}
                {formatDate(profile.subscription_end_date || "")}
              </span>
              <span className="text-white/70">
                {daysUntilExpiry} days remaining
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProfileHeader; 