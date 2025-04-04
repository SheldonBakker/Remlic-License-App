import { toast } from 'react-hot-toast';
import { useLicenseLimit } from '../hooks/useLicenseLimit';

/**
 * Utility function to integrate license limit validation with form submission.
 * This provides a consistent way to validate license limits in all form components.
 * 
 * @param licenseType - The type of license being managed
 * @param isEditing - Whether this is an edit operation (which bypasses limit checks)
 * @param submitCallback - The callback function to run if validation passes
 * @returns A wrapped submit handler function
 */
export const createLimitValidatedSubmit = (
  licenseType: string,
  isEditing: boolean,
  submitCallback: (e: React.FormEvent) => Promise<void>
) => {
  // Get the license limit information
  const { canAdd, limit } = useLicenseLimit(licenseType, isEditing);

  // Return a wrapped submit handler
  return async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Skip validation if editing existing license or if can add more
    if (isEditing || canAdd) {
      return submitCallback(e);
    }
    
    // Show error if limit is reached
    toast.error(`License limit reached. Your current plan allows ${limit} ${licenseType} licenses.`);
    return;
  };
};

/**
 * Get info for license limit display
 * 
 * @param licenseType - The type of license
 * @param isEditing - Whether this is an edit operation
 * @returns Object with limit display information
 */
export const getLicenseLimitInfo = (
  licenseType: string,
  isEditing: boolean
) => {
  // Skip if editing
  if (isEditing) return null;
  
  // Get license limit information
  const { canAdd, currentCount, limit, isLoading } = useLicenseLimit(licenseType, isEditing);
  
  // Skip if still loading
  if (isLoading) return null;
  
  // Format the license type name for display
  const licenseTypeName = formatLicenseTypeName(licenseType);
  
  return {
    canAdd,
    currentCount,
    limit,
    licenseTypeName,
    message: canAdd 
      ? `You can add ${limit - currentCount} more ${licenseTypeName}${limit - currentCount !== 1 ? 's' : ''}.` 
      : `License limit reached (${currentCount}/${limit}). Please upgrade your plan to add more licenses.`
  };
};

/**
 * Format license type name for display
 */
export const formatLicenseTypeName = (type: string): string => {
  switch (type) {
    case 'drivers':
      return "driver's license";
    case 'vehicles':
      return "vehicle license";
    case 'firearms':
      return "firearm license";
    case 'prpds':
      return "PRPD license";
    case 'works':
      return "works license";
    case 'passports':
      return "passport";
    case 'tvlicenses':
      return "TV license";
    case 'others':
      return "other document";
    case 'psira':
      return "PSIRA record";
    case 'competency':
      return "competency certificate";
    default:
      return type;
  }
}; 