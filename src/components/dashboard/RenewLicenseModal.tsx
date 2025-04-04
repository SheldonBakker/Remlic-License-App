import * as React from 'react';
import { Dialog } from '@mui/material';
import { FiX } from 'react-icons/fi';
import { License } from '../../types/LicenseGroup';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface RenewLicenseModalProps {
  open: boolean;
  onClose: () => void;
  license: License | null;
  onRenew: () => void;
}

export const RenewLicenseModal: React.FC<RenewLicenseModalProps> = ({
  open,
  onClose,
  license,
  onRenew,
}) => {
  const [newExpiryDate, setNewExpiryDate] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setNewExpiryDate('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleRenew = async () => {
    if (!newExpiryDate || !license?.id || isSubmitting) {
      toast.error('Please select an expiry date');
      return;
    }

    setIsSubmitting(true);

    try {
      const client = await supabase;
      const tableMapping: Record<string, string> = {
        vehicles: 'vehicles',
        drivers: 'drivers',
        firearms: 'firearms',
        prpd: 'prpds',
        prpds: 'prpd',
        works: 'works',
        others: 'other_documents',
        passports: 'passports',
        tvlicenses: 'tv_licenses',
        competency: 'competency'
      };

      const { error } = await client
        .from(tableMapping[license.type])
        .update({ expiry_date: newExpiryDate })
        .eq('id', license.id);

      if (error) throw error;

      toast.success('License renewed successfully');
      await onRenew();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to renew license');
    } finally {
      setIsSubmitting(false);
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
      <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Renew {license?.first_name ? `${license.first_name}'s License` : 'License'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              New Expiry Date
            </label>
            <input
              type="text"
              value={newExpiryDate}
              onChange={(e) => {
                const input = e.target.value.replace(/\D/g, '');
                if (input.length <= 8) {
                  let formatted = '';
                  if (input.length > 0) formatted += input.substring(0, 4);
                  if (input.length > 4) formatted += '-' + input.substring(4, 6);
                  if (input.length > 6) formatted += '-' + input.substring(6, 8);
                  setNewExpiryDate(formatted);
                }
              }}
              placeholder="YYYY-MM-DD"
              maxLength={10}
              className="w-full bg-[#374151] text-white border border-indigo-500/20 rounded-lg p-2
                focus:border-indigo-500/50 focus:outline-none"
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg
                bg-gray-500/10 text-gray-400 border border-gray-500/20
                hover:bg-gray-500/20 hover:border-gray-500/40 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                console.log('Renew button clicked');
                handleRenew();
              }}
              disabled={!newExpiryDate || isSubmitting}
              className="flex-1 py-2 px-4 rounded-lg
                bg-green-500/10 text-green-400 border border-green-500/20
                hover:bg-green-500/20 hover:border-green-500/40 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Renewing...' : 'Renew License'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}; 