import * as React from 'react';
import { useEffect, useCallback, memo, useReducer, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import {
  FiPlus,
  FiCreditCard,
  FiRefreshCw,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiX
} from 'react-icons/fi';
import { LICENSE_TYPES } from '../constants/licenses';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import { useInView } from 'react-intersection-observer';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import { SubscriptionRequired } from '../components/dashboard/SubscriptionRequired';
import { LicenseTypeGrid } from '../components/dashboard/LicenseTypeGrid';
import { AddLicenseModal } from '../components/dashboard/AddLicenseModal';
import { RenewLicenseModal } from '../components/dashboard/RenewLicenseModal';
import { DeleteLicenseModal } from '../components/dashboard/DeleteLicenseModal';
import ContractCard from '../components/dashboard/LicenseCard';
import { PsiraSearchModal } from '../components/dashboard/PsiraSearchModal';

// Types
import { LicenseGroup, Contract, License } from '../types/LicenseGroup';

const MemoizedLicenseTypeGrid = memo(LicenseTypeGrid);
const MemoizedContractCard = memo(ContractCard);
const MemoizedAddLicenseModal = memo(AddLicenseModal);
const MemoizedRenewLicenseModal = memo(RenewLicenseModal);
const MemoizedDeleteLicenseModal = memo(DeleteLicenseModal);

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
  isGridCollapsed: boolean;
  isSearchOpen: boolean;
  isPsiraModalOpen: boolean;
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
  | { type: 'SET_LICENSE_TO_DELETE'; payload: Contract | null }
  | { type: 'TOGGLE_GRID_COLLAPSE'; payload: boolean }
  | { type: 'TOGGLE_SEARCH'; payload: boolean }
  | { type: 'TOGGLE_PSIRA_MODAL'; payload: boolean };

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
    case 'TOGGLE_GRID_COLLAPSE':
      return { ...state, isGridCollapsed: action.payload };
    case 'TOGGLE_SEARCH':
      return { ...state, isSearchOpen: action.payload };
    case 'TOGGLE_PSIRA_MODAL':
      return { ...state, isPsiraModalOpen: action.payload };
    default:
      return state;
  }
};

// Constants for grid layout
const CARD_HEIGHT = 320;
const CARD_WIDTH = 400;
const GRID_GAP = 16;
const VERTICAL_GAP = 100;
const MOBILE_VERTICAL_GAP = 80; 
const EFFECTIVE_CARD_WIDTH = CARD_WIDTH + GRID_GAP;
const EFFECTIVE_CARD_HEIGHT = CARD_HEIGHT + VERTICAL_GAP;
const MOBILE_EFFECTIVE_CARD_HEIGHT = CARD_HEIGHT + MOBILE_VERTICAL_GAP + 40;

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

const useProgressiveLoading = (options = {}) => {
  const result = useInView({ threshold: 0, triggerOnce: true, ...options });
  return [result[0], result[1]] as [(node?: Element | null | undefined) => void, boolean];
};

const Dash: React.FC = () => {
  // Initialize state including psira
  const initialLicenseState = useMemo<LicenseGroup>(() => ({
    vehicles: [], drivers: [], firearms: [], prpds: [], works: [], 
    others: [], passports: [], tvlicenses: [], psira: [], competency: []
  }), []);
  const [state, dispatch] = useReducer(dashReducer, {
    licenses: initialLicenseState,
    userTier: null,
    isLoading: true,
    hasActiveSubscription: false,
    selectedSection: null,
    isRefreshing: false,
    searchQuery: '',
    modals: { add: false, renew: false, delete: false },
    editingLicense: null,
    licenseToDelete: null,
    isGridCollapsed: false,
    isSearchOpen: false,
    isPsiraModalOpen: false,
  });

  const navigate = useNavigate();
  const debouncedSearch = useDebounce(state.searchQuery, 300);
  const abortController = useRef<AbortController | null>(null);

  const checkSubscriptionValidity = useCallback((subscriptionEndDate: string | null): boolean => {
    if (!subscriptionEndDate) return false;
    const now = new Date();
    const endDate = new Date(subscriptionEndDate);
    return endDate > now;
  }, []);

  // Reverted initialization logic
  useEffect(() => {
    const initializeDashboard = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const supabaseInstance = await supabase;
        const { data: { session } } = await supabaseInstance.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        const { data: profileData } = await supabaseInstance
          .from('profiles')
          .select('type_of_user, subscription_status, subscription_end_date')
          .eq('id', session.user.id)
          .single();

        const isSubscriptionValid = checkSubscriptionValidity(profileData?.subscription_end_date);
        dispatch({ type: 'SET_SUBSCRIPTION', payload: profileData?.subscription_status === 'active' && isSubscriptionValid });

        // Fetch profile and licenses using dynamic table names
        const tableNames = Object.keys(LICENSE_TYPES).map(key => LICENSE_TYPES[key].table);
        const [profileResult, ...results] = await Promise.all([
          supabaseInstance
            .from('profiles')
            .select('type_of_user, subscription_status')
            .eq('id', session.user.id)
            .single(),
          ...tableNames.map(table => supabaseInstance
              .from(table)
              .select('*')
              .eq('user_id', session.user.id)
            )
        ]);

        dispatch({ type: 'SET_USER_TIER', payload: profileResult.data?.type_of_user || null });

        const newLicenses = { ...initialLicenseState };
        Object.keys(LICENSE_TYPES).forEach((key, index) => {
          const groupKey = key as keyof LicenseGroup;
          if (results[index]?.data) {
            newLicenses[groupKey] = results[index].data as Contract[];
          }
        });

        dispatch({ type: 'SET_LICENSES', payload: newLicenses });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error('Error loading dashboard');
        console.error('Error:', errorMessage);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    initializeDashboard();
  }, [navigate, checkSubscriptionValidity, initialLicenseState]);

  // Define handleRefresh *before* handlePsiraSaveSuccess
  const handleRefresh = useCallback(async () => {
    if (state.isRefreshing) return;
    if (abortController.current) { abortController.current.abort(); }
    abortController.current = new AbortController();
    dispatch({ type: 'SET_REFRESHING', payload: true });
    try {
      const supabaseInstance = await supabase;
      const { data: { session } } = await supabaseInstance.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const tableNames = Object.keys(LICENSE_TYPES).map(key => LICENSE_TYPES[key].table);
      const [profileResult, ...results] = await Promise.all([
        supabaseInstance
          .from('profiles')
          .select('type_of_user, subscription_status')
          .eq('id', session.user.id)
          .single(),
        ...tableNames.map(table => supabaseInstance
            .from(table)
            .select('*')
            .eq('user_id', session.user.id)
          )
      ]);

      dispatch({ type: 'SET_USER_TIER', payload: profileResult.data?.type_of_user || null });
      dispatch({ type: 'SET_SUBSCRIPTION', payload: profileResult.data?.subscription_status === 'active' });

      const refreshedLicenses = { ...initialLicenseState };
      const worksIndex = Object.keys(LICENSE_TYPES).indexOf('works');

      Object.keys(LICENSE_TYPES).forEach((key, index) => {
          const groupKey = key as keyof LicenseGroup;
          if (results[index]?.data) {
            if (groupKey === 'works' && worksIndex === index) {
              refreshedLicenses[groupKey] = Array.from(new Map(results[index].data.map((item: Contract) => [item.id, item])).values());
            } else {
              refreshedLicenses[groupKey] = results[index].data as Contract[];
            }
          }
       });

      dispatch({ type: 'SET_LICENSES', payload: refreshedLicenses });
      toast.success('Dashboard refreshed');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Refresh aborted'); return;
      }
      toast.error('Error refreshing dashboard');
      console.error('Error:', error);
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [state.isRefreshing, navigate, initialLicenseState]);

  // Handlers
  const handleAddLicense = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODAL', modal: 'add', value: true });
  }, []);
  const handleRenewLicense = useCallback((license: Contract) => {
    const licenseType = Object.entries(state.licenses).find(([/* type */, items]) => 
      items.some((item: Contract) => item.id === license.id)
    )?.[0] || null;
    dispatch({ type: 'SET_EDITING_LICENSE', payload: {...license, type: licenseType} });
    dispatch({ type: 'TOGGLE_MODAL', modal: 'renew', value: true });
  }, [state.licenses, dispatch]);
  const handleDeleteLicense = useCallback((license: Contract) => {
    const licenseWithType = {
      ...license,
      type: Object.entries(state.licenses).find(([/* type */, items]) => 
        items.some((item: Contract) => item.id === license.id)
      )?.[0] || null
    };
    dispatch({ type: 'SET_LICENSE_TO_DELETE', payload: licenseWithType });
    dispatch({ type: 'TOGGLE_MODAL', modal: 'delete', value: true });
  }, [state.licenses, dispatch]);

  // Define handlePsiraSaveSuccess *after* handleRefresh
  const handlePsiraSaveSuccess = useCallback(async () => {
    await handleRefresh();
    dispatch({ type: 'TOGGLE_PSIRA_MODAL', payload: false }); 
  }, [handleRefresh]);

  const handleSectionSelect = useCallback((section: string) => {
    dispatch({ type: 'SET_SECTION', payload: section === state.selectedSection ? null : section });
  }, [state.selectedSection]);

  const handleSearch = useCallback((value: string) => {
    dispatch({ type: 'SET_SEARCH', payload: value });
  }, []);

  const handleGridCollapse = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID_COLLAPSE', payload: !state.isGridCollapsed });
  }, [state.isGridCollapsed]);

  // Filtering logic (reverted, add psira_number)
  const getFilteredLicenses = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    if (!query) return state.licenses;
    const searchCache = new Map<string, boolean>();
    const initialFilteredState: LicenseGroup = { ...initialLicenseState };

    return Object.entries(state.licenses).reduce((filtered, [type, items]) => {
      const groupKey = type as keyof LicenseGroup;
      const typedItems: Contract[] = Array.isArray(items) ? items : [];
      
      filtered[groupKey] = typedItems.filter((license) => {
        const cacheKey = `${license.id}-${query}`;
        if (searchCache.has(cacheKey)) { return searchCache.get(cacheKey)!; }

        const searchableFields = [
          license.first_name, license.last_name, license.id_number,
          license.registration_number, license.make, license.model,
          license.license_number, license.psira_number // Added psira_number
        ].filter((field): field is string => typeof field === 'string');

        const matches = searchableFields.some(field => field.toLowerCase().includes(query));
        searchCache.set(cacheKey, matches);
        return matches;
      });
      return filtered;
    }, initialFilteredState);
  }, [state.licenses, debouncedSearch, initialLicenseState]);

  // LicenseTypeGridWithVirtualization (unchanged from original potentially)
  const LicenseTypeGridWithVirtualization = useMemo(() => {
    return (
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        state.isGridCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
      }`}>
        <div className="max-h-[300px] sm:max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent"> 
          <MemoizedLicenseTypeGrid
            licenses={getFilteredLicenses}
            selectedSection={state.selectedSection}
            onSectionSelect={handleSectionSelect}
            userTier={state.userTier}
          />
        </div>
      </div>
    );
  }, [
    state.isGridCollapsed, 
    getFilteredLicenses, 
    state.selectedSection, 
    state.userTier,
    handleSectionSelect
  ]);

  // renderLicenseCards (unchanged from original potentially)
  const renderLicenseCards = useMemo(() => {
    const selectedType = state.selectedSection;
    return Object.entries(getFilteredLicenses)
      .filter(([type]) => !selectedType || type === selectedType)
      .flatMap(([type, items]) => 
        items.map((license: Contract) => ({
          license,
          type,
          id: `${type}-${license.id}` // Ensure unique key
        }))
      );
  }, [getFilteredLicenses, state.selectedSection]);

  const [gridRef, gridInView] = useProgressiveLoading();
  const [cardsRef, cardsInView] = useProgressiveLoading({ rootMargin: '100px' });

  if (state.isLoading) {
    return <LoadingSpinner text="Loading your licenses..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section - Enhanced layout */}
        <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-indigo-500/20">
          <div className="flex flex-col gap-4">
            {/* Enhanced Search and Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Search Input (Full width on mobile, flex-grow on desktop) */}
              <div className="relative flex-grow w-full order-1">
                <div className="w-full flex items-center bg-[#374151]/50 border border-indigo-500/20 
                  rounded-lg hover:border-indigo-500/40 focus-within:border-indigo-500/50 
                  focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-200">
                  <FiSearch className="ml-3 text-gray-400 flex-shrink-0" size={18} />
                  <input
                    type="text"
                    value={state.searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search licenses by name, number, or description..."
                    className="w-full px-3 py-2.5 bg-transparent border-0 
                      text-white placeholder-gray-400 focus:outline-none text-base"
                  />
                  {state.searchQuery && (
                    <button 
                      onClick={() => handleSearch('')}
                      className="mr-3 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Action Buttons Group (Better organization for mobile and desktop) */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-2 sm:flex-shrink-0">
                {/* License Types Toggle - Enhanced button */}
                <button
                  onClick={handleGridCollapse}
                  className={`flex items-center justify-center h-11 px-4 py-2 rounded-lg 
                    transition-all duration-200 ${state.isGridCollapsed 
                      ? 'bg-[#374151]/50 text-indigo-400 hover:bg-[#374151]/70 border border-indigo-500/20 hover:border-indigo-500/40' 
                      : 'bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-500'
                    }`}
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span className="relative">
                      <span className="absolute -left-1 -top-1 w-1.5 h-1.5 rounded-full bg-indigo-300 animate-ping opacity-75"></span>
                      <span className="absolute -left-1 -top-1 w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                    </span>
                    License Types
                    {state.isGridCollapsed ? <FiChevronDown className="w-4 h-4"/> : <FiChevronUp className="w-4 h-4"/>}
                  </span>
                </button>
                
                {/* Action buttons on a single row for mobile, inline with search on desktop */}
                <div className="flex gap-3 w-full sm:w-auto">
                  {/* Refresh Button - Enhanced */}
                  <button
                    onClick={handleRefresh}
                    disabled={state.isRefreshing}
                    className="flex flex-1 sm:flex-initial items-center justify-center h-11 gap-2 px-4 py-2 rounded-lg 
                      bg-[#374151]/50 text-indigo-400 hover:bg-[#374151]/70 
                      border border-indigo-500/20 hover:border-indigo-500/40
                      transition-all duration-200 disabled:opacity-50 
                      disabled:cursor-not-allowed"
                    title="Refresh your licenses"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${state.isRefreshing ? 'animate-spin duration-1000 ease-in-out' : ''}`} />
                    <span className="text-sm font-medium">{state.isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                  
                  {/* Add/Upgrade Button - Enhanced */}
                  {state.hasActiveSubscription ? (
                    <button
                      onClick={handleAddLicense}
                      className="flex flex-1 sm:flex-initial items-center justify-center h-11 gap-2 px-4 py-2 
                        bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white 
                        border border-indigo-500
                        transition-all duration-200"
                    >
                      <FiPlus className="w-4 h-4" /> 
                      <span className="text-sm font-medium">Add License</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/price')}
                      className="flex flex-1 sm:flex-initial items-center justify-center h-11 gap-2 px-4 py-2 
                        bg-amber-500 hover:bg-amber-600 rounded-lg text-white 
                        border border-amber-500
                        transition-all duration-200"
                    >
                      <FiCreditCard className="w-4 h-4" /> 
                      <span className="text-sm font-medium">Upgrade</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* License Type Grid Content */}
            <div ref={gridRef} className="block">
              {gridInView && LicenseTypeGridWithVirtualization}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {!state.hasActiveSubscription ? (
          <SubscriptionRequired />
        ) : (
          <div ref={cardsRef} className="w-full h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)]">
            {cardsInView ? (
              <AutoSizer>
                {({ height, width }) => {
                  const isMobile = width < 768;
                  const columnCount = isMobile ? 1 : Math.max(1, Math.floor(width / EFFECTIVE_CARD_WIDTH));
                  const rowCount = Math.ceil(renderLicenseCards.length / columnCount);
                  const mobileCardWidth = isMobile ? width : EFFECTIVE_CARD_WIDTH;
                  
                  return (
                    <FixedSizeGrid
                      className="scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent"
                      columnCount={columnCount}
                      columnWidth={mobileCardWidth}
                      height={height}
                      rowCount={rowCount}
                      rowHeight={isMobile ? MOBILE_EFFECTIVE_CARD_HEIGHT : EFFECTIVE_CARD_HEIGHT}
                      width={width}
                      itemData={{
                        cards: renderLicenseCards,
                        columnCount,
                        onRenew: handleRenewLicense,
                        onDelete: handleDeleteLicense,
                        onRefresh: handleRefresh
                      }}
                    >
                      {({ columnIndex, rowIndex, style, data }) => {
                        const index = rowIndex * data.columnCount + columnIndex;
                        if (index >= data.cards.length) return null;
                        const { license, type, id } = data.cards[index];
                        return (
                          <div key={id} style={{ 
                              ...style, 
                              padding: `${isMobile ? MOBILE_VERTICAL_GAP / 2 : VERTICAL_GAP / 2}px ${isMobile ? 12 : GRID_GAP / 2}px`, 
                              width: isMobile ? '100%' : EFFECTIVE_CARD_WIDTH,
                              height: isMobile ? MOBILE_EFFECTIVE_CARD_HEIGHT : EFFECTIVE_CARD_HEIGHT,
                              touchAction: 'manipulation',
                              WebkitTapHighlightColor: 'transparent',
                              zIndex: 1 
                            }}
                          >
                            <div className={`h-full w-full relative ${isMobile ? 'mb-4' : ''}`}>
                              <MemoizedContractCard
                                contract={license}
                                type={type}
                                onRenew={data.onRenew}
                                onDelete={data.onDelete}
                                onRefresh={data.onRefresh}
                              />
                            </div>
                          </div>
                        );
                      }}
                    </FixedSizeGrid>
                  );
                }}
              </AutoSizer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                 <LoadingSpinner text="Loading licenses..." />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <MemoizedAddLicenseModal
        open={state.modals.add}
        onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'add', value: false })}
        userTier={state.userTier}
        currentLicenses={state.licenses}
        onAdd={handleRefresh}
      />
      <MemoizedRenewLicenseModal
        open={state.modals.renew}
        onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'renew', value: false })}
        license={state.editingLicense as License | null}
        onRenew={handleRefresh}
      />
      <MemoizedDeleteLicenseModal
        open={state.modals.delete}
        onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'delete', value: false })}
        license={state.licenseToDelete as License | null}
        onDelete={handleRefresh}
      />
      <PsiraSearchModal 
         open={state.isPsiraModalOpen}
         onClose={() => dispatch({ type: 'TOGGLE_PSIRA_MODAL', payload: false })}
         onSaveSuccess={handlePsiraSaveSuccess}
       />
    </div>
  );
};

export default Dash;