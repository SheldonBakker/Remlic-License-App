import * as React from 'react';
import { FiBellOff, FiBell } from 'react-icons/fi';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { PauseConfirmationModal } from './PauseConfirmationModal';
import { LicenseType } from '../../types/LicenseGroup';

interface PauseProps {
  isPaused: boolean;
  onTogglePause: () => void;
  licenseId: string;
  licenseType: LicenseType;
  className?: string;
}

export const Pause: React.FC<PauseProps> = ({ 
  isPaused: initialIsPaused,
  onTogglePause, 
  licenseId,
  licenseType,
  className = '' 
}) => {
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [localPauseState, setLocalPauseState] = React.useState(initialIsPaused);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isUpdating) {
      setLocalPauseState(initialIsPaused);
    }
  }, [initialIsPaused, isUpdating]);

  const updatePauseStatus = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    const newPauseState = !localPauseState;
    
    try {
      const client = await supabase;
      const tableMapping: Record<LicenseType, string> = {
        drivers: 'drivers',
        vehicles: 'vehicles',
        firearms: 'firearms',
        prpd: 'prpd',
        works: 'works',
        passports: 'passports',
        tvlicenses: 'tv_licenses',
        others: 'other_documents',
        psira: 'psira_records'
      };
      
      const tableName = tableMapping[licenseType];
      
      if (!tableName) {
        toast.error(`Cannot update pause status: Unknown type ${licenseType}`);
        console.error(`Invalid license type for pause update: ${licenseType}`);
        setIsUpdating(false);
        return;
      }

      const { error } = await client
        .from(tableName)
        .update({ notifications_paused: newPauseState })
        .eq('id', licenseId);

      if (error) throw error;
      
      setLocalPauseState(newPauseState);
      onTogglePause();
      toast.success(`Notifications ${newPauseState ? 'paused' : 'resumed'}`);
    } catch (error) {
      console.error('Error toggling pause status:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsUpdating(false);
      setShowConfirmModal(false);
    }
  };

  const handleTogglePause = () => {
    if (!localPauseState) {
      setShowConfirmModal(true);
      return;
    }
    updatePauseStatus();
  };

  return (
    <>
      <button
        onClick={handleTogglePause}
        disabled={isUpdating}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg
          ${isUpdating ? 'opacity-80 cursor-not-allowed' : ''} 
          ${localPauseState 
            ? 'bg-gray-500/10 text-gray-300 border-gray-500/20 hover:bg-gray-500/20' 
            : 'bg-blue-500/10 text-blue-300 border-blue-500/20 hover:bg-blue-500/20'
          } border shadow-lg transition-all duration-200 ${className}`}
      >
        {isUpdating ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
                fill="none"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="font-medium">
              {localPauseState ? 'Resuming...' : 'Pausing...'}
            </span>
          </div>
        ) : localPauseState ? (
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
        onConfirm={updatePauseStatus}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
};

export default Pause;
