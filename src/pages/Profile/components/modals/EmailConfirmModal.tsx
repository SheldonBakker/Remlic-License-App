import React from "react";
import { FiMail, FiCheck } from "react-icons/fi";

interface EmailConfirmModalProps {
  newEmailAddress: string;
  closeModal: () => void;
}

export const EmailConfirmModal: React.FC<EmailConfirmModalProps> = ({
  newEmailAddress,
  closeModal,
}) => {
  return (
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
            {newEmailAddress}
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
            onClick={closeModal}
          >
            <FiCheck className="h-5 w-5" />
            <span>I Understand</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmModal; 