import * as React from 'react';
import { FiBellOff, FiBell } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { PauseConfirmationModal } from './PauseConfirmationModal';

interface PauseProps {
  isPaused: boolean;
  onTogglePause: () => void;
  licenseId: string;
  licenseType: 'drivers' | 'vehicles' | 'firearms' | 'prpds' | 'works' | 'passports' | 'tvlicenses' | 'other_documents';
  className?: string;
}

export const Pause: React.FC<PauseProps> = ({ 
  isPaused, 
  onTogglePause, 
  licenseId,
  licenseType,
  className = '' 
}) => {
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);

  const handleTogglePause = async () => {
    if (!isPaused) {
      setShowConfirmModal(true);
      return;
    }

    // Continue with pause toggle if resuming
    await updatePauseStatus();
  };

  const updatePauseStatus = async () => {
    onTogglePause();
    
    try {
      const client = await supabase;
      const { error } = await client
        .from(licenseType)
        .update({ notifications_paused: !isPaused })
        .eq('id', licenseId);

      if (error) {
        onTogglePause();
        toast.error('Failed to update notification settings');
        throw error;
      }
      
      toast.success(`Notifications ${!isPaused ? 'paused' : 'resumed'}`);
    } catch (error) {
      onTogglePause();
      console.error('Error toggling pause status:', error);
    }
  };

  return (
    <>
      <button
        onClick={handleTogglePause}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg
          ${isPaused 
            ? 'bg-gray-500/10 text-gray-300 border-gray-500/20 hover:bg-gray-500/20' 
            : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20'
          } border shadow-lg transition-all duration-200 ${className}`}
      >
        {isPaused ? (
          <>
            <FiBellOff className="w-4 h-4" />
            <span className="font-medium">Paused</span>
          </>
        ) : (
          <>
            <FiBell className="w-4 h-4" />
            <span className="font-medium">Active</span>
          </>
        )}
      </button>

      <PauseConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={() => {
          setShowConfirmModal(false);
          updatePauseStatus();
        }}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
};

export default Pause;
