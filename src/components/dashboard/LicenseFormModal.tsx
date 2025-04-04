/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { Dialog } from '@mui/material';
import { FiX } from 'react-icons/fi';
import DriverLicenseForm from '../Forms/DriverLicenseForm';
import VehicleLicenseForm from '../Forms/VehicleLicenseForm';
import FirearmsLicenseForm from '../Forms/FirearmsLicenseForm';
import PRPDLicenseForm from '../Forms/PRPDLicenseForm';
import WorksLicenseForm from '../Forms/WorksLicenseForm';
import PassportForm from '../Forms/PassportForm';
import TVLicenseForm from '../Forms/TVLicenseForm';
import OtherDocumentsForm from '../Forms/OtherDocumentsForm';
import CompetencyLicenseForm from '../Forms/CompetencyLicenseForm';

interface LicenseFormModalProps {
  open: boolean;
  onClose: () => void;
  licenseType: string | null;
  editingLicense?: any;
}

export const LicenseFormModal: React.FC<LicenseFormModalProps> = ({
  open,
  onClose,
  licenseType,
  editingLicense
}) => {
  const renderForm = () => {
    switch (licenseType) {
      case 'drivers':
        return <DriverLicenseForm onClose={onClose} editingLicense={editingLicense} />;
      case 'vehicles':
        return <VehicleLicenseForm onClose={onClose} editingLicense={editingLicense} />;
      case 'firearms':
        return <FirearmsLicenseForm onClose={onClose} editingLicense={editingLicense} />;
      case 'competency':
        return <CompetencyLicenseForm onClose={onClose} editingLicense={editingLicense} />;
      case 'prpd':
        return <PRPDLicenseForm onClose={onClose} editingLicense={editingLicense} />;
      case 'works':
        return <WorksLicenseForm onClose={onClose} editingLicense={editingLicense} />;
      case 'passports':
        return <PassportForm onClose={onClose} editingLicense={editingLicense} />;
      case 'tvlicenses':
        return <TVLicenseForm onClose={onClose} editingLicense={editingLicense} />;
      case 'others':
        return <OtherDocumentsForm onClose={onClose} editingLicense={editingLicense} />;
      default:
        return null;
    }
  };

  const getFormTitle = () => {
    if (!licenseType) return '';
    
    const baseTitle = licenseType.slice(0, -1); // Remove 's' from the end
    const formattedType = baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1);
    
    // Special cases
    switch (licenseType) {
      case 'prpd':
        return 'PRPD License';
      case 'tvlicenses':
        return 'TV License';
      case 'others':
        return 'Other Document';
      case 'competency':
        return 'Competency Certificate';
      default:
        return `${formattedType} License`;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {editingLicense ? 'Edit' : 'Add'} {getFormTitle()}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        {renderForm()}
      </div>
    </Dialog>
  );
}; 