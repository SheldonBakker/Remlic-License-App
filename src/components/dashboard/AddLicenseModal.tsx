import * as React from 'react';
import { Dialog } from '@mui/material';
import { FiX, FiSearch } from 'react-icons/fi';
import { LicenseGroup } from '../../types/LicenseGroup';
import { toast } from 'react-hot-toast';
import { LICENSE_TYPES_ARRAY, TIER_LICENSE_LIMITS, LICENSE_TYPES } from '../../constants/licenses';
import PRPDLicenseForm from '../Forms/PRPDLicenseForm';
import DriverLicenseForm from '../Forms/DriverLicenseForm';
import VehicleLicenseForm from '../Forms/VehicleLicenseForm';
import FirearmsLicenseForm from '../Forms/FirearmsLicenseForm';
import WorksLicenseForm from '../Forms/WorksLicenseForm';
import PassportForm from '../Forms/PassportForm';
import TVLicenseForm from '../Forms/TVLicenseForm';
import OtherDocumentsForm from '../Forms/OtherDocumentsForm';
import CompetencyLicenseForm from '../Forms/CompetencyLicenseForm';
import CustomScrollbar from '../common/CustomScrollbar';
import { PsiraSearchModal } from './PsiraSearchModal';

interface AddLicenseModalProps {
  open: boolean;
  onClose: () => void;
  userTier: string | null;
  currentLicenses: LicenseGroup;
  onAdd: () => Promise<void>;
}

export const AddLicenseModal: React.FC<AddLicenseModalProps> = ({
  open,
  onClose,
  userTier,
  currentLicenses,
  onAdd
}) => {
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [isPsiraModalOpen, setIsPsiraModalOpen] = React.useState(false);

  const handleLicenseTypeSelect = (typeId: string) => {
    console.log(`License type selected: ${typeId}`);

    if (typeId === 'psira') {
      console.log('PSIRA type selected, opening PSIRA modal directly.');
      setIsPsiraModalOpen(true);
      return;
    }

    const currentCount = currentLicenses[typeId as keyof LicenseGroup]?.length ?? 0;
    
    // Handle admin tier specially - give unlimited access
    if (userTier === 'admin') {
      console.log('Admin user, setting unlimited licenses');
      setSelectedType(typeId);
      return;
    }
    
    // For other tiers, check appropriate limits
    const tierKey = userTier || 'free';
    const tierLimits = TIER_LICENSE_LIMITS[tierKey] || TIER_LICENSE_LIMITS.free;
    
    let effectiveLimit = 0;
    if (tierLimits && typeof tierLimits === 'object' && typeId in tierLimits) {
      const limitForType = tierLimits[typeId as keyof typeof tierLimits];
      effectiveLimit = typeof limitForType === 'number' ? limitForType : 0;
    }

    if (currentCount >= effectiveLimit) {
      toast.error(`License limit (${effectiveLimit}) reached for your ${tierKey} tier`);
      console.log('Limit reached for non-PSIRA type, returning.');
      return;
    }

    console.log(`Setting selectedType to: ${typeId}`);
    setSelectedType(typeId);
  };

  const handleFormSubmitSuccess = async () => {
    await onAdd();
    setSelectedType(null);
    onClose();
  };

  const handleFormClose = () => {
    setSelectedType(null);
  };

  const handlePsiraSaveSuccess = async () => {
    await onAdd();
    setIsPsiraModalOpen(false);
    onClose();
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'drivers':
        return <DriverLicenseForm onClose={handleFormSubmitSuccess} />;
      case 'vehicles':
        return <VehicleLicenseForm onClose={handleFormSubmitSuccess} />;
      case 'firearms':
        return <FirearmsLicenseForm onClose={handleFormSubmitSuccess} />;
      case 'competency':
        return <CompetencyLicenseForm onClose={handleFormSubmitSuccess} />;
      case 'prpds':
        return <PRPDLicenseForm onClose={handleFormSubmitSuccess} />;
      case 'works':
        return <WorksLicenseForm onClose={handleFormSubmitSuccess} />;
      case 'passports':
        return <PassportForm onClose={handleFormSubmitSuccess} />;
      case 'tvlicenses':
        return <TVLicenseForm onClose={handleFormSubmitSuccess} />;
      case 'others':
        return <OtherDocumentsForm onClose={handleFormSubmitSuccess} />;
      default:
        return null;
    }
  };

  React.useEffect(() => {
    console.log(`isPsiraModalOpen state changed to: ${isPsiraModalOpen}`);
  }, [isPsiraModalOpen]);

  return (
    <>
      <Dialog
        open={open && !selectedType && !isPsiraModalOpen}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            margin: '16px',
          },
        }}
      >
        <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-indigo-500/20">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white">Add New License/Record</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <CustomScrollbar className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            <div className="grid gap-3 sm:gap-4">
              {LICENSE_TYPES_ARRAY.map((type) => {
                const typeConfig = LICENSE_TYPES[type.id];
                const iconColorClass = typeConfig?.tailwindClass?.text || 'text-indigo-400';

                return (
                  <button
                    key={type.id}
                    onClick={() => handleLicenseTypeSelect(type.id)}
                    className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl
                      bg-[#374151]/50 hover:bg-[#374151]/70 
                      border border-indigo-500/20 hover:border-indigo-500/40 
                      transition-all duration-200 text-left"
                  >
                    <span className={iconColorClass}>
                      {React.createElement(type.icon, { 
                        className: 'w-5 h-5 sm:w-6 sm:h-6' 
                      })}
                    </span>
                    <div className="flex-grow">
                      <span className="text-white text-sm sm:text-base font-medium block">{type.title}</span>
                      {type.description && (
                        <span className="text-gray-400 text-xs sm:text-sm">{type.description}</span>
                      )}
                    </div>
                    {type.id === 'psira' && (
                      <span className="ml-auto text-xs text-indigo-400 flex items-center gap-1">
                        <FiSearch className="w-3 h-3"/>
                        External Search
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CustomScrollbar>
        </div>
      </Dialog>

      <Dialog
        open={!!selectedType}
        onClose={handleFormClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            margin: '16px',
          },
        }}
      >
        {selectedType && renderForm()}
      </Dialog>

      <PsiraSearchModal 
        open={isPsiraModalOpen}
        onClose={() => setIsPsiraModalOpen(false)}
        onSaveSuccess={handlePsiraSaveSuccess}
      />
    </>
  );
};

export default AddLicenseModal; 