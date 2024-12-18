import * as React from 'react';
import { Typography } from '@mui/material';
import { CheckCircle, Close } from '@mui/icons-material';
import { useEffect, useCallback } from 'react';

interface SuccessModalProps {
  title: string;
  message: string;
  onClose: () => void;
  onRefreshData?: () => Promise<void>;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ title, message, onClose, onRefreshData }) => {
  const handleClose = useCallback(async () => {
    if (onRefreshData) {
      await onRefreshData();
    }
    onClose();
  }, [onClose, onRefreshData]);

  // Auto-close after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-[#1f2937]/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-green-500/30
        shadow-2xl shadow-green-500/10 max-w-md w-full animate-fade-in">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white 
            transition-colors duration-200"
        >
          <Close className="text-2xl" />
        </button>

        <div className="flex flex-col items-center text-center">
          <CheckCircle className="text-green-500 text-5xl mb-4" />
          <Typography
            variant="h5"
            component="h2"
            className="text-2xl font-bold mb-2 text-white"
          >
            {title}
          </Typography>
          <Typography className="text-white/70 mb-6">
            {message}
          </Typography>
          <button
            onClick={handleClose}
            className="bg-gradient-to-r from-green-600 to-emerald-600 
              hover:from-green-500 hover:to-emerald-500 text-white py-2.5 px-6 
              rounded-lg transition-all duration-300 border border-white/20
              font-semibold shadow-md hover:shadow-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
