import React from "react";
import { FiAlertCircle, FiLoader, FiShield, FiX } from "react-icons/fi";
import { ProfileState } from "../../types";
import { isValidVerificationCode } from "../../utils";

interface MfaModalProps {
  state: ProfileState;
  handleVerificationCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  closeModal: () => void;
  verifyAndEnableMfa: () => Promise<void>;
  disableMfa: () => Promise<void>;
}

export const MfaModal: React.FC<MfaModalProps> = ({
  state,
  handleVerificationCodeChange,
  closeModal,
  verifyAndEnableMfa,
  disableMfa,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold flex items-center text-white">
            <FiShield className="mr-2 text-indigo-400" />
            {state.isMfaEnabled ? "Disable" : "Enable"} Two-Factor Authentication
          </h3>
          <button
            onClick={() =>
              closeModal()
            }
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
                Enter the current 6-digit code from your authenticator app to
                confirm:
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/80">
                Verification Code
              </label>
              <span className="text-xs text-white/60">Enter 6 digits</span>
            </div>
            <input
              type="text"
              maxLength={6}
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl
                focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                text-white placeholder-white/30 transition-all duration-200 text-center text-2xl tracking-wider
                ${
                  isValidVerificationCode(state.verificationCode)
                    ? "border-green-500/50"
                    : "border-white/10"
                }`}
              placeholder="000000"
              value={state.verificationCode}
              onChange={handleVerificationCodeChange}
            />
            {state.verificationError && (
              <p className="text-red-400 text-xs mt-1">{state.verificationError}</p>
            )}
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-white/10">
          <button
            onClick={closeModal}
            className="w-full bg-white/5 text-white py-2.5 rounded-xl hover:bg-white/10
              transition-all duration-200 border border-white/10"
          >
            Cancel
          </button>
          <button
            onClick={state.isMfaEnabled ? disableMfa : verifyAndEnableMfa}
            disabled={
              state.isSaving || !isValidVerificationCode(state.verificationCode)
            }
            className={`w-full text-white py-2.5 rounded-xl
              transition-all duration-200 flex items-center justify-center space-x-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                state.isMfaEnabled
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
          >
            {state.isSaving ? (
              <>
                <FiLoader className="h-4 animate-spin" />
                <span>{state.isMfaEnabled ? "Disabling..." : "Enabling..."}</span>
              </>
            ) : (
              <>
                <FiShield className="h-4 w-4" />
                <span>{state.isMfaEnabled ? "Disable 2FA" : "Enable 2FA"}</span>
              </>
            )}
          </button>
        </div>

        {!state.isMfaEnabled && (
          <p className="text-white/50 text-xs text-center">
            Two-factor authentication adds an extra layer of security to your
            account by requiring a code from your authenticator app when signing
            in.
          </p>
        )}
      </div>
    </div>
  );
};

export default MfaModal; 