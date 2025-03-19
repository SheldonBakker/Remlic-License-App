import React from "react";
import { FiAlertCircle, FiSave, FiX } from "react-icons/fi";

interface PersonalInfoModalProps {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  handlePersonalInfoUpdate: () => Promise<void>;
  closeModal: () => void;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({
  handleInputChange,
  handlePersonalInfoUpdate,
  closeModal,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1f2937]/30 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6 border border-indigo-500/20">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold flex items-center text-white">
            <FiAlertCircle className="mr-2 text-indigo-400" />
            Important Information Needed
          </h3>
          <button
            onClick={closeModal}
            className="text-white/60 hover:text-white transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {[
            "first_name",
            "last_name",
            "contact_number",
            "id_number",
          ].map((field) => (
            <div key={field} className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                {field === "id_number"
                  ? "SA ID Number"
                  : field === "contact_number"
                  ? "Contact Number"
                  : field
                      .split("_")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
              </label>
              <input
                type={field === "contact_number" ? "tel" : "text"}
                placeholder={
                  field === "contact_number"
                    ? "+27 XX XXX XXXX"
                    : field === "id_number"
                    ? "YYMMDDXXXXXXX"
                    : `Enter your ${field.replace("_", " ")}`
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                  focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  text-white placeholder-white/30 transition-all duration-200"
                onChange={(e) => handleInputChange(e, field)}
              />
            </div>
          ))}
        </div>

        <div className="flex space-x-3 pt-4 border-t border-white/10">
          <button
            className="flex-1 bg-white/5 text-white py-2.5 rounded-xl hover:bg-white/10 
              transition-all duration-200 border border-white/10"
            onClick={closeModal}
          >
            Cancel
          </button>
          <button
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700
              transition-all duration-200 flex items-center justify-center space-x-2"
            onClick={handlePersonalInfoUpdate}
          >
            <FiSave className="h-4 w-4" />
            <span>Save Information</span>
          </button>
        </div>

        <p className="text-white/50 text-sm text-center">
          This information is required to complete your profile setup
        </p>
      </div>
    </div>
  );
};

export default PersonalInfoModal; 