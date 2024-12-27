import * as React from 'react';
import { Dialog } from '@mui/material';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { License as LicenseType } from '../../types/LicenseGroup';
import { supabase } from '../../lib/supabase'
import { toast } from 'react-hot-toast';

interface DeleteLicenseModalProps {
  open: boolean;
  onClose: () => void;
  license: LicenseType | null;
  onDelete: () => void;
}

export const DeleteLicenseModal: React.FC<DeleteLicenseModalProps> = ({
  open,
  onClose,
  license,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!license?.id || !license?.type || isDeleting) return;

    setIsDeleting(true);

    try {
      const client = await supabase;
      const tableMapping: Record<string, string> = {
        vehicles: 'vehicles',
        drivers: 'drivers',
        firearms: 'firearms',
        prpds: 'prpd',
        works: 'works',
        others: 'other_documents',
        passports: 'passports', 
        tvlicenses: 'tv_licenses'
      };

      const { error } = await client
        .from(tableMapping[license.type])
        .delete()
        .eq('id', license.id);

      if (error) throw error;

      onDelete();
      onClose();
      toast.success('License deleted successfully');
    } catch (error) {
      console.error('Error deleting license:', error);
      toast.error('Failed to delete license');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        style: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
        },
      }}
    >
      <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-6 border border-red-500/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Delete License</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 mb-6">
          <FiAlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">
            Are you sure you want to delete {license?.first_name 
              ? `${license.first_name} ${license.last_name}'s license`
              : 'this license'
            }? This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg
              bg-gray-500/10 text-gray-400 border border-gray-500/20
              hover:bg-gray-500/20 hover:border-gray-500/40 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2 px-4 rounded-lg
              bg-red-500/10 text-red-400 border border-red-500/20
              hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete License'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}; 