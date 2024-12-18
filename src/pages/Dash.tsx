/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {
  FiPlus,
  FiCreditCard,
  FiRefreshCw,
  FiSearch
} from 'react-icons/fi';
import { 
  AiOutlineCar,
  AiOutlineIdcard,
  AiOutlineSafetyCertificate,
  AiOutlineFileProtect,
  AiOutlineFileText,
} from 'react-icons/ai';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import { SubscriptionRequired } from '../components/dashboard/SubscriptionRequired';
import { LicenseTypeGrid } from '../components/dashboard/LicenseTypeGrid';
import { AddLicenseModal } from '../components/dashboard/AddLicenseModal';
import { RenewLicenseModal } from '../components/dashboard/RenewLicenseModal';
import { DeleteLicenseModal } from '../components/dashboard/DeleteLicenseModal';
import ContractCard from '../components/dashboard/LicenseCard';

// Types
import { LicenseGroup, Contract, License } from '../types/LicenseGroup';

// Constants
const LICENSE_TYPES = [
  {
    id: 'drivers',
    title: "Driver's License",
    icon: AiOutlineIdcard,
  },
  {
    id: 'vehicles',
    title: 'Vehicle Registration',
    icon: AiOutlineCar,
  },
  {
    id: 'prpds',
    title: 'PrPD',
    icon: AiOutlineSafetyCertificate,
  },
  {
    id: 'firearms',
    title: 'Firearm License',
    icon: AiOutlineFileProtect,
  },
  {
    id: 'works',
    title: 'Work Contract',
    icon: AiOutlineFileText,
  },
  {
    id: 'passports',
    title: 'Passport',
    icon: AiOutlineIdcard,
  },
  {
    id: 'others',
    title: 'Other Document',
    icon: AiOutlineFileText,
  },
  {
    id: 'tvlicenses',
    title: 'TV License',
    icon: AiOutlineFileText,
  },
] as const;

export interface AddLicenseModalProps {
  open: boolean;
  onClose: () => void;
  licenseTypes: typeof LICENSE_TYPES;
  userTier: string | null;
  currentLicenses: LicenseGroup;
}

const Dash: React.FC = () => {
  // State management
  const [licenses, setLicenses] = useState<LicenseGroup>({
    vehicles: [],
    drivers: [],
    firearms: [],
    prpds: [],
    works: [],
    others: [],
    passports: [],
    tvlicenses: []
  });
  const [userTier, setUserTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<Contract | null>(null);
  const [licenseToDelete, setLicenseToDelete] = useState<Contract | null>(null);

  const navigate = useNavigate();

  // Fetch licenses from Supabase
  const fetchLicenses = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data: { session } } = await (await supabase).auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const [
        { data: vehicles },
        { data: drivers },
        { data: firearms },
        { data: prpd },
        { data: works },
        { data: others },
        { data: passports },
        { data: tvlicenses }
      ] = await Promise.all([
        (await supabase).from('vehicles').select('*').eq('user_id', session.user.id),
        (await supabase).from('drivers').select('*').eq('user_id', session.user.id),
        (await supabase).from('firearms').select('*').eq('user_id', session.user.id),
        (await supabase).from('prpd').select('*').eq('user_id', session.user.id),
        (await supabase).from('works').select('*').eq('user_id', session.user.id),
        (await supabase).from('other_documents').select('*').eq('user_id', session.user.id),
        (await supabase).from('passports').select('*').eq('user_id', session.user.id),
        (await supabase).from('tv_licenses').select('*').eq('user_id', session.user.id)
      ]);

      setLicenses({
        vehicles: vehicles || [],
        drivers: drivers || [],
        firearms: firearms || [],
        prpds: prpd || [],
        works: works || [],
        others: others || [],
        passports: passports || [],
        tvlicenses: tvlicenses || []
      });
    } catch (error: any) {
      toast.error('Error fetching licenses');
      console.error('Error:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Handlers
  const handleAddLicense = () => setIsAddModalOpen(true);
  const handleRenewLicense = (license: Contract) => {
    const licenseType = Object.entries(licenses).find(([_, items]) => 
      items.some(item => item.id === license.id)
    )?.[0] || null;
    
    setEditingLicense({...license, type: licenseType});
    setIsRenewModalOpen(true);
  };
  const handleDeleteLicense = (license: Contract) => {
    const licenseWithType = {
      ...license,
      type: Object.entries(licenses).find(([_, items]) => 
        items.some(item => item.id === license.id)
      )?.[0] || null
    };
    setLicenseToDelete(licenseWithType);
    setIsDeleteModalOpen(true);
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.promise(
      fetchLicenses(),
      {
        loading: 'Refreshing licenses...',
        success: 'Licenses refreshed successfully',
        error: 'Failed to refresh licenses'
      }
    ).finally(() => setIsRefreshing(false));
  };

  const fetchUserTier = useCallback(async () => {
    const { data: { session } } = await (await supabase).auth.getSession();
    if (session) {
      const { data: profile } = await (await supabase)
        .from('profiles')
        .select('type_of_user, subscription_status')
        .eq('id', session.user.id)
        .single();
      setUserTier(profile?.type_of_user || null);
      setHasActiveSubscription(profile?.subscription_status === 'active');
    }
  }, []);

  useEffect(() => {
    fetchUserTier();
  }, [fetchUserTier]);

  const handleSectionSelect = (section: string) => {
    if (selectedSection === section) {
      setSelectedSection(null);  // Deselect if clicking the same section
    } else {
      setSelectedSection(section);
    }
  };

  // Add this function to filter licenses
  const getFilteredLicenses = useCallback(() => {
    if (!searchQuery.trim()) return licenses;

    const query = searchQuery.toLowerCase().trim();
    const filtered: LicenseGroup = {
      vehicles: [],
      drivers: [],
      firearms: [],
      prpds: [],
      works: [],
      others: [],
      passports: [],
      tvlicenses: []
    };

    Object.entries(licenses).forEach(([type, items]) => {
      filtered[type] = items.filter((license) => {
        const searchableFields = [
          license.first_name,
          license.last_name,
          license.id_number,
          license.registration_number,
          license.make,
          license.model,
          license.license_number
        ].filter(Boolean); // Remove undefined/null values

        return searchableFields.some(field => 
          field?.toString().toLowerCase().includes(query)
        );
      });
    });

    return filtered;
  }, [licenses, searchQuery]);

  if (isLoading) {
    return <LoadingSpinner text="Loading your licenses..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">License Management</h1>
              <p className="text-gray-400">Manage all your licenses in one place</p>
            </div>
            
            {/* Search and Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[300px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ID, registration..."
                  className="w-full px-4 py-2 pl-10 bg-[#374151]/50 border border-indigo-500/20 
                    rounded-lg text-white placeholder-gray-400 focus:border-indigo-500/50 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 
                    hover:bg-indigo-500/20 transition-all duration-200 
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin duration-[3000ms]' : ''}`} />
                  Refresh
                </button>
                {hasActiveSubscription ? (
                  <button
                    onClick={handleAddLicense}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 
                      hover:bg-indigo-600 rounded-lg text-white transition-all duration-200"
                  >
                    <FiPlus /> Add License
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/price')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 
                      hover:bg-amber-600 rounded-lg text-white transition-all duration-200"
                  >
                    <FiCreditCard /> Upgrade Account
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* License Type Grid */}
          <LicenseTypeGrid
            licenses={getFilteredLicenses()}
            selectedSection={selectedSection}
            onSectionSelect={handleSectionSelect}
            userTier={userTier}
          />
        </div>

        {/* Main Content - Update to use filtered licenses */}
        {!hasActiveSubscription ? (
          <SubscriptionRequired />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(getFilteredLicenses())
              .filter(([type]) => selectedSection === null || type === selectedSection)
              .map(([type, items]) => (
                items.map((license: Contract) => (
                  <ContractCard
                    key={license.id}
                    contract={license}
                    type={type}
                    onRenew={handleRenewLicense}
                    onDelete={handleDeleteLicense}
                    onRefresh={handleRefresh}
                  />
                ))
              ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddLicenseModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        userTier={userTier}
        currentLicenses={licenses}
        licenseTypes={LICENSE_TYPES}
      />

      <RenewLicenseModal
        open={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        license={editingLicense as License | null}
        onRenew={fetchLicenses}
      />

      <DeleteLicenseModal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        license={licenseToDelete as License | null}
        onDelete={fetchLicenses}
      />
    </div>
  );
};

export default Dash;
