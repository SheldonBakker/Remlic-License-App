import React from "react";
import { FiLock, FiX, FiLoader, FiEye, FiEyeOff } from "react-icons/fi";
import { ProfileState } from "../../types";

interface PasswordChangeModalProps {
  state: ProfileState;
  handlePasswordChange: () => Promise<void>;
  cancelPasswordChange: () => void;
  onPasswordInputChange: (
    key: "current_password" | "new_password" | "confirm_password",
    value: string
  ) => void;
  togglePasswordVisibility: (
    key: "current_password" | "new_password" | "confirm_password"
  ) => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  state,
  handlePasswordChange,
  cancelPasswordChange,
  onPasswordInputChange,
  togglePasswordVisibility,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold flex items-center text-white">
            <FiLock className="mr-2 text-indigo-400" />
            Change Password
          </h3>
          <button
            onClick={cancelPasswordChange}
            className="text-white/60 hover:text-white transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {[
            { key: "current_password", label: "Current Password" },
            { key: "new_password", label: "New Password" },
            { key: "confirm_password", label: "Confirm New Password" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                {label}
              </label>
              <div className="relative">
                <input
                  type={
                    state.showPasswords[key as keyof typeof state.showPasswords]
                      ? "text"
                      : "password"
                  }
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                    focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    text-white placeholder-white/30 transition-all duration-200 pr-10"
                  value={
                    state.passwordData[key as keyof typeof state.passwordData]
                  }
                  onChange={(e) =>
                    onPasswordInputChange(
                      key as keyof typeof state.passwordData,
                      e.target.value
                    )
                  }
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
                  onClick={() =>
                    togglePasswordVisibility(
                      key as keyof typeof state.showPasswords
                    )
                  }
                >
                  {state.showPasswords[key as keyof typeof state.showPasswords] ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
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
            className="w-full bg-white/5 text-white py-2.5 rounded-xl hover:bg-white/10 
              transition-all duration-200 border border-white/10 text-sm sm:text-base"
            onClick={cancelPasswordChange}
          >
            Cancel
          </button>
          <button
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700
              transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
            onClick={handlePasswordChange}
            disabled={
              state.isSaving ||
              !state.passwordData.current_password ||
              !state.passwordData.new_password ||
              !state.passwordData.confirm_password ||
              state.passwordData.new_password !==
                state.passwordData.confirm_password
            }
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
  );
};

export default PasswordChangeModal; 