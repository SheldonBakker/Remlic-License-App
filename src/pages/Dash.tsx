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

// Types
import { LicenseGroup, Contract, License } from '../types/LicenseGroup';

export interface AddLicenseModalProps {
  open: boolean;
  onClose: () => void;
  licenseTypes: typeof LICENSE_TYPES;
  userTier: string | null;
  currentLicenses: LicenseGroup;
  onAdd: () => Promise<void>;
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
  pagination: {
    currentPage: number;
    itemsPerPage: number;
  };
  isGridCollapsed: boolean;
  isSearchOpen: boolean;
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
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'TOGGLE_GRID_COLLAPSE'; payload: boolean }
  | { type: 'TOGGLE_SEARCH'; payload: boolean };

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
    case 'SET_PAGE':
      return { ...state, pagination: { ...state.pagination, currentPage: action.payload } };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, pagination: { ...state.pagination, itemsPerPage: action.payload } };
    case 'TOGGLE_GRID_COLLAPSE':
      return { ...state, isGridCollapsed: action.payload };
    case 'TOGGLE_SEARCH':
      return { ...state, isSearchOpen: action.payload };
    default:
      return state;
  }
};

const CARD_WIDTH = 400; // Base card width
const CARD_HEIGHT = 300; // Base card height for desktop
const MOBILE_CARD_HEIGHT = 300; // Smaller height for mobile
const GRID_GAP = 16; // Horizontal gap between cards
const VERTICAL_GAP = 80; // Desktop vertical gap
const MOBILE_VERTICAL_GAP = 140; // Mobile vertical gap
const EFFECTIVE_CARD_WIDTH = CARD_WIDTH + GRID_GAP;
const EFFECTIVE_CARD_HEIGHT = CARD_HEIGHT + VERTICAL_GAP;
const MOBILE_EFFECTIVE_CARD_HEIGHT = MOBILE_CARD_HEIGHT + MOBILE_VERTICAL_GAP;

// 1. Add debouncing for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Add type for database results
type DBResult = { data: Contract[] | null };

type ProfileResult = { 
  data: { 
    type_of_user: string | null; 
    subscription_status: string; 
  } | null 
};

const useProgressiveLoading = (options = {}) => {
  const result = useInView({
    threshold: 0,
    triggerOnce: true,
    ...options
  });

  return [result[0], result[1]] as [(node?: Element | null | undefined) => void, boolean];
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
    licenseToDelete: null,
    pagination: {
      currentPage: 1,
      itemsPerPage: 12
    },
    isGridCollapsed: true,
    isSearchOpen: false,
  });

  const navigate = useNavigate();

  // 3. Debounce search input
  const debouncedSearch = useDebounce(state.searchQuery, 300);

  // Add this near the top of the component
  const abortController = useRef<AbortController | null>(null);

  // Single database query on page load
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

        const limit = state.pagination.itemsPerPage;
        const offset = (state.pagination.currentPage - 1) * limit;

        // Fetch user profile and paginated licenses
        const [profileResult, ...results] = await Promise.all([
          supabaseInstance
            .from('profiles')
            .select('type_of_user, subscription_status')
            .eq('id', session.user.id)
            .single(),
          ...['vehicles', 'drivers', 'firearms', 'prpd', 'works', 'other_documents', 'passports', 'tv_licenses']
            .map(table => supabaseInstance
              .from(table)
              .select('*', { count: 'exact' })
              .eq('user_id', session.user.id)
              .range(offset, offset + limit - 1)
            )
        ]);

        // Update user profile data
        dispatch({ type: 'SET_USER_TIER', payload: profileResult.data?.type_of_user || null });
        dispatch({ type: 'SET_SUBSCRIPTION', payload: profileResult.data?.subscription_status === 'active' });

        // Update licenses data
        dispatch({
          type: 'SET_LICENSES',
          payload: {
            vehicles: results[0].data || [],
            drivers: results[1].data || [],
            firearms: results[2].data || [],
            prpds: results[3].data || [],
            works: results[4].data || [],
            others: results[5].data || [],
            passports: results[6].data || [],
            tvlicenses: results[7].data || []
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error('Error loading dashboard');
        console.error('Error:', errorMessage);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeDashboard();
  }, [
    navigate,
    state.pagination.currentPage,
    state.pagination.itemsPerPage
  ]); // Add pagination dependencies

  // Handlers
  const handleAddLicense = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODAL', modal: 'add', value: true });
  }, []);
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
    if (state.isRefreshing) return;
    
    // Cancel any pending requests
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    dispatch({ type: 'SET_REFRESHING', payload: true });
    
    try {
      const supabaseInstance = await supabase;
      const { data: { session } } = await supabaseInstance.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Add profile fetch to the requests
      const [profileResult, ...results]: [ProfileResult, ...DBResult[]] = await Promise.all([
        supabaseInstance
          .from('profiles')
          .select('type_of_user, subscription_status')
          .eq('id', session.user.id)
          .single(),
        supabaseInstance.from('vehicles').select('*').eq('user_id', session.user.id),
        supabaseInstance.from('drivers').select('*').eq('user_id', session.user.id),
        supabaseInstance.from('firearms').select('*').eq('user_id', session.user.id),
        supabaseInstance.from('prpd').select('*').eq('user_id', session.user.id),
        supabaseInstance.from('works').select('*').eq('user_id', session.user.id),
        supabaseInstance.from('other_documents').select('*').eq('user_id', session.user.id),
        supabaseInstance.from('passports').select('*').eq('user_id', session.user.id),
        supabaseInstance.from('tv_licenses').select('*').eq('user_id', session.user.id)
      ]);

      // Now profileResult is defined
      dispatch({ type: 'SET_USER_TIER', payload: profileResult.data?.type_of_user || null });
      dispatch({ type: 'SET_SUBSCRIPTION', payload: profileResult.data?.subscription_status === 'active' });

      // Update licenses data
      dispatch({
        type: 'SET_LICENSES',
        payload: {
          vehicles: results?.[0]?.data ?? [],
          drivers: results?.[1]?.data ?? [],
          firearms: results?.[2]?.data ?? [],
          prpds: results?.[3]?.data ?? [],
          works: results?.[4]?.data ?? [],
          others: results?.[5]?.data ?? [],
          passports: results?.[6]?.data ?? [],
          tvlicenses: results?.[7]?.data ?? []
        }
      });

      toast.success('Dashboard refreshed');
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }
      toast.error('Error refreshing dashboard');
      console.error('Error:', error);
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [state.isRefreshing, navigate]);

  const handleSectionSelect = useCallback((section: string) => {
    dispatch({ type: 'SET_SECTION', payload: section === state.selectedSection ? null : section });
    dispatch({ type: 'SET_PAGE', payload: 1 }); // Reset to first page
  }, [state.selectedSection]);

  const handleSearch = useCallback((value: string) => {
    dispatch({ type: 'SET_SEARCH', payload: value });
    dispatch({ type: 'SET_PAGE', payload: 1 });
  }, []);

  const handleGridCollapse = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID_COLLAPSE', payload: !state.isGridCollapsed });
  }, [state.isGridCollapsed]);

  // 2. Optimize the filtering logic
  const getFilteredLicenses = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    if (!query) return state.licenses;

    const searchCache = new Map();
    
    return Object.entries(state.licenses).reduce((filtered, [type, items]) => {
      filtered[type] = items.filter((license) => {
        const cacheKey = `${license.id}-${query}`;
        if (searchCache.has(cacheKey)) {
          return searchCache.get(cacheKey);
        }

        const searchableFields = [
          license.first_name,
          license.last_name,
          license.id_number,
          license.registration_number,
          license.make,
          license.model,
          license.license_number
        ].filter(Boolean);

        const matches = searchableFields.some(field => 
          field?.toString().toLowerCase().includes(query)
        );
        
        searchCache.set(cacheKey, matches);
        return matches;
      });
      return filtered;
    }, {} as LicenseGroup);
  }, [state.licenses, debouncedSearch]);

  // 4. Use windowing for the license type grid
  const LicenseTypeGridWithVirtualization = useMemo(() => {
    return (
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        state.isGridCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
      }`}>
        {/* License Type Grid Sizing */}
        <div className="sm:h-[140px] h-[325px]">
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

  // Optimize renderLicenseCards with better dependency tracking
  const renderLicenseCards = useMemo(() => {
    const selectedType = state.selectedSection;
    const entries = Object.entries(getFilteredLicenses);
    
    const allCards = entries
      .filter(([type]) => !selectedType || type === selectedType)
      .flatMap(([type, items]) => 
        items.map((license: Contract) => ({
          license,
          type,
          id: `${type}-${license.id}`
        }))
      );

    // Calculate pagination
    const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const endIndex = startIndex + state.pagination.itemsPerPage;
    
    return {
      cards: allCards.slice(startIndex, endIndex),
      totalPages: Math.ceil(allCards.length / state.pagination.itemsPerPage),
      totalItems: allCards.length
    };
  }, [
    getFilteredLicenses,
    state.selectedSection,
    state.pagination.currentPage,
    state.pagination.itemsPerPage
  ]);

  const [gridRef, gridInView] = useProgressiveLoading();
  const [cardsRef, cardsInView] = useProgressiveLoading({
    rootMargin: '100px' // Preload cards before they're visible
  });

  if (state.isLoading) {
    return <LoadingSpinner text="Loading your licenses..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="bg-[#1f2937]/95 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-indigo-500/20">
          <div className="flex flex-col gap-4">
            {/* Search and Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
              {/* Action Buttons */}
              <div className="flex flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                {/* License Types Button - Hidden on mobile */}
                <button
                  onClick={handleGridCollapse}
                  className={`hidden sm:flex items-center justify-center h-11 w-[160px] gap-2 px-4 py-2 rounded-lg 
                    transition-all duration-200 ${
                    state.isGridCollapsed 
                      ? 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  <span className="text-sm font-medium">Licenses</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${
                      state.isGridCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={state.isRefreshing}
                  className="flex items-center justify-center h-11 w-[160px] gap-2 px-4 py-2 rounded-lg 
                    bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 
                    transition-all duration-200 disabled:opacity-50 
                    disabled:cursor-not-allowed text-sm sm:text-base"
                  title="Refresh"
                >
                  <FiRefreshCw className={`w-5 h-5 ${state.isRefreshing ? 'animate-spin duration-1000 ease-in-out' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                
                {/* Add/Upgrade Button */}
                {state.hasActiveSubscription ? (
                  <button
                    onClick={handleAddLicense}
                    className="flex items-center justify-center h-11 w-[160px] gap-2 px-4 py-2 
                      bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white 
                      transition-all duration-200 text-sm sm:text-base"
                  >
                    <FiPlus /> 
                    <span className="hidden sm:inline">Add License</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/price')}
                    className="flex items-center justify-center h-11 w-[160px] gap-2 px-4 py-2 
                      bg-amber-500 hover:bg-amber-600 rounded-lg text-white 
                      transition-all duration-200 text-sm sm:text-base"
                  >
                    <FiCreditCard /> 
                    <span className="hidden sm:inline">Upgrade Account</span>
                    <span className="sm:hidden">Upgrade</span>
                  </button>
                )}
              </div>

              {/* Search Section */}
              <div className="relative flex-grow order-2 sm:order-1 w-full">
                {/* Search Input (now visible on all devices) */}
                <div className="w-full">
                  <input
                    type="text"
                    value={state.searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search licenses..."
                    className="w-full px-4 py-2 pl-10 bg-[#374151]/50 border border-indigo-500/20 
                      rounded-lg text-white placeholder-gray-400 focus:border-indigo-500/50 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base"
                  />
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Grid Content - Hidden on mobile */}
            <div ref={gridRef} className="hidden sm:block">
              {gridInView && LicenseTypeGridWithVirtualization}
            </div>
          </div>
        </div>

        {/* Main Content with Progressive Loading */}
        {!state.hasActiveSubscription ? (
          <SubscriptionRequired />
        ) : (
          <div 
            ref={cardsRef} 
            className="w-full h-[calc(100vh-200px)] sm:h-[calc(100vh-240px)]"
          >
            {cardsInView ? (
              <AutoSizer>
                {({ height, width }) => {
                  const isMobile = width < 768;
                  const columnCount = isMobile ? 1 : Math.max(1, Math.floor(width / EFFECTIVE_CARD_WIDTH));
                  const rowCount = Math.ceil(renderLicenseCards.cards.length / columnCount);
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
                        cards: renderLicenseCards.cards,
                        columnCount,
                        onRenew: handleRenewLicense,
                        onDelete: handleDeleteLicense,
                        onRefresh: handleRefresh
                      }}
                    >
                      {({ columnIndex, rowIndex, style, data }) => {
                        const index = rowIndex * data.columnCount + columnIndex;
                        if (index >= data.cards.length) return null;
                        
                        const { license, type } = data.cards[index];
                        
                        return (
                          <div style={{
                            ...style,
                            padding: `${isMobile ? MOBILE_VERTICAL_GAP / 2 : VERTICAL_GAP / 2}px ${isMobile ? 16 : GRID_GAP / 2}px`,
                            width: isMobile ? '100%' : EFFECTIVE_CARD_WIDTH,
                            height: isMobile ? MOBILE_EFFECTIVE_CARD_HEIGHT : EFFECTIVE_CARD_HEIGHT
                          }}>
                            <div className="h-full w-full">
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

        {renderLicenseCards.totalPages > 1 && (
          <div className="mt-6 flex justify-center items-center gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: state.pagination.currentPage - 1 })}
              disabled={state.pagination.currentPage === 1}
              className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 
                hover:bg-indigo-500/20 transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {state.pagination.currentPage} of {renderLicenseCards.totalPages}
            </span>
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: state.pagination.currentPage + 1 })}
              disabled={state.pagination.currentPage >= renderLicenseCards.totalPages}
              className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 
                hover:bg-indigo-500/20 transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
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
    </div>
  );
};

export default Dash;