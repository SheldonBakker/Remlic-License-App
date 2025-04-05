/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useCallback, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Typography } from '@mui/material';
import SuccessModal from '../dashboard/SuccessModal';

interface WorksLicenseFormProps {
  onClose: () => void;
  editingLicense?: any;
}

const WorksLicenseForm: React.FC<WorksLicenseFormProps> = ({ onClose, editingLicense }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    contractName: editingLicense?.contract_name || '',
    contractType: editingLicense?.contract_type || '',
    companyName: editingLicense?.company_name || '',
    firstName: editingLicense?.first_name || '',
    lastName: editingLicense?.last_name || '',
    contactNumber: editingLicense?.contact_number || '',
    emailAddress: editingLicense?.email_address || '',
    expiryDate: editingLicense?.expiry_date || ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
        contract_name: formData.contractName,
        contract_type: formData.contractType,
        company_name: formData.companyName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        contact_number: formData.contactNumber,
        email_address: formData.emailAddress,
        expiry_date: formData.expiryDate,
        whatsapp_notifications_enabled: editingLicense ? (editingLicense.whatsapp_notifications_enabled || false) : true
      };

      let error;
      if (editingLicense) {
        ({ error } = await (await supabase)
          .from('works')
          .update(licenseData)
          .eq('id', editingLicense.id));
      } else {
        ({ error } = await (await supabase)
          .from('works')
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
    <div className="bg-[#1f2937]/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-indigo-500/30
      shadow-2xl shadow-indigo-500/10">
      <div className="mb-6">
        <Typography
          variant="h4"
          component="h1"
          className="text-2xl sm:text-3xl text-white font-bold mb-2 bg-gradient-to-r from-white to-white/70 
            bg-clip-text text-transparent"
        >
          Works Contract Information
        </Typography>
        <Typography variant="body1" className="text-white/60 text-base">
          Please fill in your works contract details below
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
              Contract Name
            </label>
            <input
              type="text"
              value={formData.contractName}
              onChange={(e) => setFormData(prev => ({ ...prev, contractName: e.target.value }))}
              className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                transition-all duration-200 backdrop-blur-2xl outline-none
                shadow-md shadow-black/10 hover:border-indigo-400/50"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
              Contract Type
            </label>
            <input
              type="text"
              value={formData.contractType}
              onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
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
              Company Name
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                transition-all duration-200 backdrop-blur-2xl outline-none
                shadow-md shadow-black/10 hover:border-indigo-400/50"
              maxLength={200}
              required
            />
          </div>

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
              Contact Number
            </label>
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
              className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                transition-all duration-200 backdrop-blur-2xl outline-none
                shadow-md shadow-black/10 hover:border-indigo-400/50"
              pattern="^\+?[0-9\s-]{10,20}$"
              title="Please enter a valid phone number"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-white/80 text-sm font-semibold mb-1 tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={formData.emailAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
              className="w-full p-3 bg-[#1f2937]/60 border border-indigo-500/30 rounded-lg text-white 
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 
                transition-all duration-200 backdrop-blur-2xl outline-none
                shadow-md shadow-black/10 hover:border-indigo-400/50"
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
            {isLoading ? 'Saving...' : (editingLicense ? 'Update Contract' : 'Save Contract Details')}
          </button>
        </div>
      </form>

      {showSuccessModal && (
        <SuccessModal
          title="Success!"
          message={`Works License ${editingLicense ? 'updated' : 'added'} successfully`}
          onClose={() => {
            setShowSuccessModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};

export default WorksLicenseForm; 