import * as React from 'react';
import { useEffect, useCallback, memo, useReducer, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {
  FiPlus,
  FiCreditCard,
  FiRefreshCw,
  FiSearch
} from 'react-icons/fi';
import { LICENSE_TYPES } from '../constants/licenses';

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

export interface AddLicenseModalProps {
  open: boolean;
  onClose: () => void;
  licenseTypes: typeof LICENSE_TYPES;
  userTier: string | null;
  currentLicenses: LicenseGroup;
}

const MemoizedLicenseTypeGrid = memo(LicenseTypeGrid);
const MemoizedContractCard = memo(ContractCard);
const MemoizedAddLicenseModal = memo(AddLicenseModal);
const MemoizedRenewLicenseModal = memo(RenewLicenseModal);
const MemoizedDeleteLicenseModal = memo(DeleteLicenseModal);

// Replace multiple useState calls with useReducer for related state
interface DashState {
  licenses: LicenseGroup;
  userTier: string | null;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  selectedSection: string | null;
  isRefreshing: boolean;
  searchQuery: string;
  modals: {
    add: boolean;
    renew: boolean;
    delete: boolean;
  };
  editingLicense: Contract | null;
  licenseToDelete: Contract | null;
}

type DashAction =
  | { type: 'SET_LICENSES'; payload: LicenseGroup }
  | { type: 'SET_USER_TIER'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SUBSCRIPTION'; payload: boolean }
  | { type: 'SET_SECTION'; payload: string | null }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_MODAL'; modal: 'add' | 'renew' | 'delete'; value: boolean }
  | { type: 'SET_EDITING_LICENSE'; payload: Contract | null }
  | { type: 'SET_LICENSE_TO_DELETE'; payload: Contract | null };

const dashReducer = (state: DashState, action: DashAction): DashState => {
  switch (action.type) {
    case 'SET_LICENSES':
      return { ...state, licenses: action.payload };
    case 'SET_USER_TIER':
      return { ...state, userTier: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SUBSCRIPTION':
      return { ...state, hasActiveSubscription: action.payload };
    case 'SET_SECTION':
      return { ...state, selectedSection: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'TOGGLE_MODAL':
      return {
        ...state,
        modals: { ...state.modals, [action.modal]: action.value }
      };
    case 'SET_EDITING_LICENSE':
      return { ...state, editingLicense: action.payload };
    case 'SET_LICENSE_TO_DELETE':
      return { ...state, licenseToDelete: action.payload };
    default:
      return state;
  }
};

const Dash: React.FC = () => {
  // State management
  const [state, dispatch] = useReducer(dashReducer, {
    licenses: {
      vehicles: [],
      drivers: [],
      firearms: [],
      prpds: [],
      works: [],
      others: [],
      passports: [],
      tvlicenses: []
    },
    userTier: null,
    isLoading: true,
    hasActiveSubscription: false,
    selectedSection: null,
    isRefreshing: false,
    searchQuery: '',
    modals: {
      add: false,
      renew: false,
      delete: false
    },
    editingLicense: null,
    licenseToDelete: null
  });

  const navigate = useNavigate();

  // Fetch licenses from Supabase
  const fetchLicenses = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
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

      dispatch({ type: 'SET_LICENSES', payload: {
        vehicles: vehicles || [],
        drivers: drivers || [],
        firearms: firearms || [],
        prpds: prpd || [],
        works: works || [],
        others: others || [],
        passports: passports || [],
        tvlicenses: tvlicenses || []
      } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Error fetching licenses');
      console.error('Error:', errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [navigate]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  // Handlers
  const handleAddLicense = () => dispatch({ type: 'TOGGLE_MODAL', modal: 'add', value: true });
  const handleRenewLicense = useCallback((license: Contract) => {
    const licenseType = Object.entries(state.licenses).find(([type]) => 
      state.licenses[type].some(item => item.id === license.id)
    )?.[0] || null;
    
    dispatch({ type: 'SET_EDITING_LICENSE', payload: {...license, type: licenseType} });
    dispatch({ type: 'TOGGLE_MODAL', modal: 'renew', value: true });
  }, [state.licenses, dispatch]);
  const handleDeleteLicense = useCallback((license: Contract) => {
    const licenseWithType = {
      ...license,
      type: Object.entries(state.licenses).find(([type]) => 
        state.licenses[type].some(item => item.id === license.id)
      )?.[0] || null
    };
    dispatch({ type: 'SET_LICENSE_TO_DELETE', payload: licenseWithType });
    dispatch({ type: 'TOGGLE_MODAL', modal: 'delete', value: true });
  }, [state.licenses, dispatch]);
  const handleRefresh = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    toast.promise(
      fetchLicenses(),
      {
        loading: 'Refreshing licenses...',
        success: 'Licenses refreshed successfully',
        error: 'Failed to refresh licenses'
      }
    ).finally(() => dispatch({ type: 'SET_REFRESHING', payload: false }));
  }, [dispatch, fetchLicenses]);

  const fetchUserTier = useCallback(async () => {
    const { data: { session } } = await (await supabase).auth.getSession();
    if (session) {
      const { data: profile } = await (await supabase)
        .from('profiles')
        .select('type_of_user, subscription_status')
        .eq('id', session.user.id)
        .single();
      dispatch({ type: 'SET_USER_TIER', payload: profile?.type_of_user || null });
      dispatch({ type: 'SET_SUBSCRIPTION', payload: profile?.subscription_status === 'active' });
    }
  }, []);

  useEffect(() => {
    fetchUserTier();
  }, [fetchUserTier]);

  const handleSectionSelect = (section: string) => {
    if (state.selectedSection === section) {
      dispatch({ type: 'SET_SECTION', payload: null });  // Deselect if clicking the same section
    } else {
      dispatch({ type: 'SET_SECTION', payload: section });
    }
  };

  // Add this function to filter licenses
  const getFilteredLicenses = useCallback((licenses: LicenseGroup, searchQuery: string) => {
    if (!searchQuery.trim()) return licenses;

    const query = searchQuery.toLowerCase().trim();
    return Object.entries(licenses).reduce((filtered, [type, items]) => {
      filtered[type] = items.filter((license) => {
        const searchableFields = [
          license.first_name,
          license.last_name,
          license.id_number,
          license.registration_number,
          license.make,
          license.model,
          license.license_number
        ].filter(Boolean);

        return searchableFields.some(field => 
          field?.toString().toLowerCase().includes(query)
        );
      });
      return filtered;
    }, {
      vehicles: [],
      drivers: [],
      firearms: [],
      prpds: [],
      works: [],
      others: [],
      passports: [],
      tvlicenses: []
    } as LicenseGroup);
  }, []);

  // Use memo for expensive computations
  const filteredLicenses = useMemo(() => 
    getFilteredLicenses(state.licenses, state.searchQuery),
    [state.licenses, state.searchQuery, getFilteredLicenses]
  );

  // Optimize the license cards rendering
  const renderLicenseCards = useMemo(() => 
    Object.entries(filteredLicenses)
      .filter(([type]) => state.selectedSection === null || type === state.selectedSection)
      .map(([type, items]) => 
        items.map((license: Contract) => (
          <MemoizedContractCard
            key={license.id}
            contract={license}
            type={type}
            onRenew={handleRenewLicense}
            onDelete={handleDeleteLicense}
            onRefresh={handleRefresh}
          />
        ))
      ),
    [filteredLicenses, state.selectedSection, handleRenewLicense, handleDeleteLicense, handleRefresh]
  );

  if (state.isLoading) {
    return <LoadingSpinner text="Loading your licenses..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-indigo-500/20">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">License Management</h1>
                <p className="text-sm sm:text-base text-gray-400">Manage all your licenses in one place</p>
              </div>
            </div>
            
            {/* Search and Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              {/* Search Input */}
              <div className="relative w-full">
                <input
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                  placeholder="Search licenses..."
                  className="w-full px-4 py-2 pl-10 bg-[#374151]/50 border border-indigo-500/20 
                    rounded-lg text-white placeholder-gray-400 focus:border-indigo-500/50 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm sm:text-base"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={handleRefresh}
                  disabled={state.isRefreshing}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                    bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 
                    transition-all duration-200 disabled:opacity-50 
                    disabled:cursor-not-allowed w-full sm:w-auto text-sm sm:text-base"
                  title="Refresh"
                >
                  <FiRefreshCw className={`w-5 h-5 ${state.isRefreshing ? 'animate-spin duration-1000 ease-in-out' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                {state.hasActiveSubscription ? (
                  <button
                    onClick={handleAddLicense}
                    className="flex items-center justify-center gap-2 px-4 py-2 
                      bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white 
                      transition-all duration-200 w-full sm:w-auto text-sm sm:text-base"
                  >
                    <FiPlus /> 
                    <span className="hidden sm:inline">Add License</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/price')}
                    className="flex items-center justify-center gap-2 px-4 py-2 
                      bg-amber-500 hover:bg-amber-600 rounded-lg text-white 
                      transition-all duration-200 w-full sm:w-auto text-sm sm:text-base"
                  >
                    <FiCreditCard /> 
                    <span className="hidden sm:inline">Upgrade Account</span>
                    <span className="sm:hidden">Upgrade</span>
                  </button>
                )}
              </div>
            </div>

            {/* License Type Grid */}
            <div className="mt-2 sm:mt-4">
              <MemoizedLicenseTypeGrid
                licenses={filteredLicenses}
                selectedSection={state.selectedSection}
                onSectionSelect={handleSectionSelect}
                userTier={state.userTier}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        {!state.hasActiveSubscription ? (
          <SubscriptionRequired />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {renderLicenseCards}
          </div>
        )}
      </div>

      {/* Modals */}
      <MemoizedAddLicenseModal
        open={state.modals.add}
        onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'add', value: false })}
        userTier={state.userTier}
        currentLicenses={state.licenses}
        licenseTypes={LICENSE_TYPES}
      />

      <MemoizedRenewLicenseModal
        open={state.modals.renew}
        onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'renew', value: false })}
        license={state.editingLicense as License | null}
        onRenew={fetchLicenses}
      />

      <MemoizedDeleteLicenseModal
        open={state.modals.delete}
        onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'delete', value: false })}
        license={state.licenseToDelete as License | null}
        onDelete={fetchLicenses}
      />
    </div>
  );
};

export default Dash;