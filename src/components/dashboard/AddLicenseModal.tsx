import * as React from 'react';
import { Dialog } from '@mui/material';
import { FiX } from 'react-icons/fi';
import { LicenseGroup } from '../../types/LicenseGroup';
import { toast } from 'react-hot-toast';
import { TIER_LICENSE_LIMITS } from '../../constants/licenses';
import PRPDLicenseForm from '../Forms/PRPDLicenseForm';
import DriverLicenseForm from '../Forms/DriverLicenseForm';
import VehicleLicenseForm from '../Forms/VehicleLicenseForm';
import FirearmsLicenseForm from '../Forms/FirearmsLicenseForm';
import WorksLicenseForm from '../Forms/WorksLicenseForm';
import PassportForm from '../Forms/PassportForm';
import TVLicenseForm from '../Forms/TVLicenseForm';
import OtherDocumentsForm from '../Forms/OtherDocumentsForm';
import CustomScrollbar from '../common/CustomScrollbar';
import { LICENSE_TYPES } from '../../constants/licenses';

interface AddLicenseModalProps {
  open: boolean;
  onClose: () => void;
  licenseTypes: typeof LICENSE_TYPES;
  userTier: string | null;
  currentLicenses: LicenseGroup;
}

export const AddLicenseModal: React.FC<AddLicenseModalProps> = ({
  open,
  onClose,
  licenseTypes,
  userTier,
  currentLicenses
}) => {
  const [selectedType, setSelectedType] = React.useState<string | null>(null);

  const handleLicenseTypeSelect = (typeId: string) => {
    const currentCount = currentLicenses[typeId]?.length ?? 0;
    const limit = TIER_LICENSE_LIMITS[userTier || 'basic'];

    if (currentCount >= limit) {
      toast.error(`License limit reached for your ${userTier} tier`);
      return;
    }

    setSelectedType(typeId);
  };

  const handleFormClose = () => {
    setSelectedType(null);
    onClose();
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'drivers':
        return <DriverLicenseForm onClose={handleFormClose} />;
      case 'vehicles':
        return <VehicleLicenseForm onClose={handleFormClose} />;
      case 'firearms':
        return <FirearmsLicenseForm onClose={handleFormClose} />;
      case 'prpds':
        return <PRPDLicenseForm onClose={handleFormClose} />;
      case 'works':
        return <WorksLicenseForm onClose={handleFormClose} />;
      case 'passports':
        return <PassportForm onClose={handleFormClose} />;
      case 'tvlicenses':
        return <TVLicenseForm onClose={handleFormClose} />;
      case 'others':
        return <OtherDocumentsForm onClose={handleFormClose} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog
        open={open}
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
            <h2 className="text-lg sm:text-xl font-bold text-white">Add New License</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <CustomScrollbar className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            <div className="grid gap-3 sm:gap-4">
              {licenseTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleLicenseTypeSelect(type.id)}
                  className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl
                    bg-[#374151]/50 hover:bg-[#374151]/70 
                    border border-indigo-500/20 hover:border-indigo-500/40 
                    transition-all duration-200"
                >
                  <span className="text-indigo-400">
                    {React.createElement(type.icon, { 
                      className: 'w-5 h-5 sm:w-6 sm:h-6' 
                    })}
                  </span>
                  <div className="text-left">
                    <span className="text-white text-sm sm:text-base font-medium block">{type.title}</span>
                    {type.description && (
                      <span className="text-gray-400 text-xs sm:text-sm">{type.description}</span>
                    )}
                  </div>
                </button>
              ))}
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
    </>
  );
};

export default AddLicenseModal; 