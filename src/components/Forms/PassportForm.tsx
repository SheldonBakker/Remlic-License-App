/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Typography } from '@mui/material';
import SuccessModal from '../dashboard/SuccessModal';

interface PassportFormProps {
  onClose: () => void;
  editingLicense?: any;
}

const PassportForm: React.FC<PassportFormProps> = ({ onClose, editingLicense }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: editingLicense?.first_name || '',
    lastName: editingLicense?.last_name || '',
    passportNumber: editingLicense?.passport_number || '',
    expiryDate: editingLicense?.expiry_date || ''
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await (await supabase).auth.getSession();
      if (!session) {
        toast.error('Please login to continue');
        return;
      }

      const licenseData = {
        user_id: session.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        passport_number: formData.passportNumber,
        expiry_date: formData.expiryDate,
        whatsapp_notifications_enabled: editingLicense ? (editingLicense.whatsapp_notifications_enabled || false) : true
      };

      let error;
      if (editingLicense) {
        ({ error } = await (await supabase)
          .from('passports')
          .update(licenseData)
          .eq('id', editingLicense.id));
      } else {
        ({ error } = await (await supabase)
          .from('passports')
          .insert([licenseData]));
      }

      if (error) throw error;

      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [formData, editingLicense ]);

  return (
    <>
      <div className="bg-[#1f2937]/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-indigo-500/30
        shadow-2xl shadow-indigo-500/10">
        <div className="mb-6">
          <Typography
            variant="h4"
            component="h1"
            className="text-2xl sm:text-3xl text-white font-bold mb-2 bg-gradient-to-r from-white to-white/70 
              bg-clip-text text-transparent"
          >
            Passport Information
          </Typography>
          <Typography variant="body1" className="text-white/60 text-base">
            Please fill in your passport details below
          </Typography>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                  transition-all duration-200 backdrop-blur-2xl outline-none
                  shadow-md shadow-black/10 hover:border-indigo-400/50"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                  transition-all duration-200 backdrop-blur-2xl outline-none
                  shadow-md shadow-black/10 hover:border-indigo-400/50"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
                Passport Number
              </label>
              <input
                type="text"
                value={formData.passportNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, passportNumber: e.target.value }))}
                className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                  transition-all duration-200 backdrop-blur-2xl outline-none
                  shadow-md shadow-black/10 hover:border-indigo-400/50"
                maxLength={20}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
                Expiry Date
              </label>
              <input
                type="text"
                value={formData.expiryDate}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                  let formattedDate = '';
                  
                  if (value.length <= 4) {
                    formattedDate = value.slice(0, 4); // Year (max 4 digits)
                  } else if (value.length <= 6) {
                    formattedDate = `${value.slice(0, 4)}-${value.slice(4, 6)}`; // Year-Month
                  } else {
                    formattedDate = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`; // Year-Month-Day
                  }
                  
                  setFormData(prev => ({ ...prev, expiryDate: formattedDate }));
                }}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                  transition-all duration-200 backdrop-blur-2xl outline-none
                  shadow-md shadow-black/10 hover:border-indigo-400/50"
                required
              />
              <p className="mt-1.5 text-white/50 text-xs">Format: YYYY-MM-DD</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto sm:min-w-[160px] bg-[#1f2937]/80 text-white/90 py-3 px-6 
                rounded-lg transition-all duration-200 border border-white/10
                font-semibold hover:bg-[#1f2937] hover:border-white/20 hover:shadow-lg
                backdrop-blur-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto sm:min-w-[160px] bg-gradient-to-r from-purple-600 to-indigo-600 
                hover:from-purple-500 hover:to-indigo-500 text-white py-3 px-6 
                rounded-lg transition-all duration-300 border border-white/20
                font-semibold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 
                disabled:opacity-50 disabled:cursor-not-allowed
                backdrop-blur-xl"
            >
              {isLoading ? 'Saving...' : (editingLicense ? 'Update Passport' : 'Save Passport Details')}
            </button>
          </div>
        </form>
      </div>
      
      {showSuccessModal && (
        <SuccessModal
          title="Success!"
          message={`Passport ${editingLicense ? 'updated' : 'added'} successfully`}
          onClose={() => {
            setShowSuccessModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
};

export default PassportForm; 