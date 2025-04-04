import { useState, useEffect } from 'react';
import { TIER_LICENSE_LIMITS } from '../constants/licenses';
import { supabase } from '../lib/supabase';
import { LicenseGroup } from '../types/LicenseGroup';

type LicenseType = keyof LicenseGroup;

interface LicenseLimitResult {
  canAdd: boolean;
  currentCount: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to check if a user can add more licenses of a specific type
 * based on their subscription tier.
 * 
 * @param licenseType The type of license to check
 * @param skipCheck Optional flag to bypass the check (e.g. for admin users)
 * @returns Object with limit information
 */
export const useLicenseLimit = (
  licenseType: LicenseType | string,
  skipCheck = false
): LicenseLimitResult => {
  const [result, setResult] = useState<LicenseLimitResult>({
    canAdd: false,
    currentCount: 0,
    limit: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    // Skip the check if specified (e.g. for admins or editing existing licenses)
    if (skipCheck) {
      setResult({
        canAdd: true,
        currentCount: 0,
        limit: Infinity,
        isLoading: false,
        error: null
      });
      return;
    }

    let isMounted = true;
    
    const checkLicenseLimit = async () => {
      try {
        // Get the current user's session
        const supabaseInstance = await supabase;
        const { data: { session } } = await supabaseInstance.auth.getSession();
        
        if (!session) {
          setResult({
            canAdd: false,
            currentCount: 0,
            limit: 0,
            isLoading: false,
            error: 'User not authenticated'
          });
          return;
        }

        // Get the user's profile to determine tier
        const { data: profileData, error: profileError } = await supabaseInstance
          .from('profiles')
          .select('type_of_user')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        // Get the user's tier, defaulting to 'free' if not set
        const userTier = profileData?.type_of_user || 'free';
        
        // Admin users have unlimited licenses
        if (userTier === 'admin') {
          if (isMounted) {
            setResult({
              canAdd: true,
              currentCount: 0,
              limit: Infinity,
              isLoading: false,
              error: null
            });
          }
          return;
        }

        // Get the license limit for this type and tier
        const tierLimits = TIER_LICENSE_LIMITS[userTier] || TIER_LICENSE_LIMITS.free;
        const limitForType = (typeof tierLimits === 'object' && licenseType in tierLimits) 
          ? tierLimits[licenseType as keyof typeof tierLimits] 
          : 0;
        
        // Map the license type to its table name
        const tableMapping: Record<string, string> = {
          drivers: 'drivers',
          vehicles: 'vehicles',
          firearms: 'firearms',
          prpds: 'prpd',
          works: 'works',
          passports: 'passports',
          tvlicenses: 'tv_licenses',
          others: 'other_documents',
          psira: 'psira_records',
          competency: 'competency'
        };

        const tableName = tableMapping[licenseType as string];
        
        if (!tableName) {
          throw new Error(`Unknown license type: ${licenseType}`);
        }

        // Count the user's existing licenses of this type
        const { count, error: countError } = await supabaseInstance
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);

        if (countError) {
          throw countError;
        }

        const currentCount = count || 0;
        const canAdd = currentCount < limitForType;

        if (isMounted) {
          setResult({
            canAdd,
            currentCount,
            limit: limitForType,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Error checking license limit:', error);
        if (isMounted) {
          setResult({
            canAdd: false,
            currentCount: 0,
            limit: 0,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    };

    checkLicenseLimit();

    return () => {
      isMounted = false;
    };
  }, [licenseType, skipCheck]);

  return result;
};

/**
 * Non-hook function to check license limits directly
 * Use this in non-component code that needs to check limits
 * 
 * @param licenseType License type to check
 * @param userId User ID to check limits for
 * @returns Promise with limit check result
 */
export const checkLicenseLimit = async (
  licenseType: LicenseType | string,
  userId: string
): Promise<Omit<LicenseLimitResult, 'isLoading'>> => {
  try {
    // Get the current user's profile to determine tier
    const supabaseInstance = await supabase;
    
    // Get the user's profile to determine tier
    const { data: profileData, error: profileError } = await supabaseInstance
      .from('profiles')
      .select('type_of_user')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Get the user's tier, defaulting to 'free' if not set
    const userTier = profileData?.type_of_user || 'free';
    
    // Admin users have unlimited licenses
    if (userTier === 'admin') {
      return {
        canAdd: true,
        currentCount: 0,
        limit: Infinity,
        error: null
      };
    }

    // Get the license limit for this type and tier
    const tierLimits = TIER_LICENSE_LIMITS[userTier] || TIER_LICENSE_LIMITS.free;
    const limitForType = (typeof tierLimits === 'object' && licenseType in tierLimits) 
      ? tierLimits[licenseType as keyof typeof tierLimits] 
      : 0;
    
    // Map the license type to its table name
    const tableMapping: Record<string, string> = {
      drivers: 'drivers',
      vehicles: 'vehicles',
      firearms: 'firearms',
      prpds: 'prpd',
      works: 'works',
      passports: 'passports',
      tvlicenses: 'tv_licenses',
      others: 'other_documents',
      psira: 'psira_records',
      competency: 'competency'
    };

    const tableName = tableMapping[licenseType as string];
    
    if (!tableName) {
      throw new Error(`Unknown license type: ${licenseType}`);
    }

    // Count the user's existing licenses of this type
    const { count, error: countError } = await supabaseInstance
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      throw countError;
    }

    const currentCount = count || 0;
    const canAdd = currentCount < limitForType;

    return {
      canAdd,
      currentCount,
      limit: limitForType,
      error: null
    };
  } catch (error) {
    console.error('Error checking license limit:', error);
    return {
      canAdd: false,
      currentCount: 0,
      limit: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export default useLicenseLimit; 