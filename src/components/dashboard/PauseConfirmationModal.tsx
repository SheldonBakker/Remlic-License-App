import * as React from 'react';
import { FiPause, FiX } from 'react-icons/fi';

interface PauseConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PauseConfirmationModal: React.FC<PauseConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl border border-indigo-500/20 p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <FiPause className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
              Pause Notifications
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <p className="text-white/70 mb-6 pl-[52px]">
          Are you sure you want to pause notifications for 7 days? You can resume them at any time.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-[#374151]/50 text-white/90 
              hover:bg-[#374151]/70 transition-all duration-200 
              border border-white/10 hover:border-white/20
              font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
              hover:from-indigo-500 hover:to-purple-500 text-white 
              transition-all duration-300 font-medium
              shadow-md hover:shadow-lg hover:shadow-indigo-500/20
              border border-white/20"
          >
            Confirm Pause
          </button>
        </div>
      </div>
    </div>
  );
}; 