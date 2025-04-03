import * as React from 'react';
import { LicenseGroup } from '../../types/LicenseGroup';
import { LICENSE_TYPES_ARRAY, TIER_LICENSE_LIMITS, LICENSE_TYPES } from '../../constants/licenses';

interface LicenseTypeGridProps {
  licenses: LicenseGroup;
  selectedSection: string | null;
  onSectionSelect: (section: string) => void;
  userTier: string | null;
}

const getLicenseCardClassName = (isSelected: boolean, isLimitReached: boolean) => `
  backdrop-blur-xl rounded-md p-3 cursor-pointer
  transition-all duration-300 relative overflow-hidden group
  border border-indigo-500/20
  bg-gradient-to-br from-[#1f2937]/80 to-[#1f2937]/40
  hover:shadow-lg hover:shadow-indigo-500/10
  hover:scale-[1.02] hover:-translate-y-0.5
  ${isSelected ? 'border-indigo-400 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5' : 'hover:border-indigo-500/40'}
  ${isLimitReached ? 'opacity-75' : ''}
`;

interface LicenseCardComponentProps {
  licenseType: typeof LICENSE_TYPES_ARRAY[0];
  items: LicenseGroup[keyof LicenseGroup];
  limit: number;
  isSelected: boolean;
  onSelect: () => void;
}

const LicenseCard = React.memo<LicenseCardComponentProps>(({ 
  licenseType, 
  items, 
  limit, 
  isSelected, 
  onSelect 
}) => {
  const isLimitReached = limit !== Infinity && items.length >= limit;
  
  const typeConfig = LICENSE_TYPES[licenseType.id];
  const iconColorClass = typeConfig?.tailwindClass?.text || 'text-indigo-400';
  const hoverColorClass = typeConfig?.tailwindClass?.hover || 'group-hover:text-indigo-300';
  
  return (
    <div
      onClick={onSelect}
      className={getLicenseCardClassName(isSelected, isLimitReached)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`
            ${iconColorClass} transition-colors duration-300
            ${hoverColorClass}
          `}>
            {React.createElement(licenseType.icon, { 
              className: 'w-4 h-4 transform group-hover:scale-110 transition-transform duration-300' 
            })}
          </span>
          <span className="text-white text-xs font-medium tracking-wide">
            {licenseType.title}
          </span>
        </div>
        <span className="text-indigo-400 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10">
          {items.length}/{limit === Infinity ? '∞' : limit}
        </span>
      </div>

      <div className="w-full bg-black/20 rounded-full h-2 backdrop-blur-sm">
        <div
          className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full 
                    transition-all duration-300 group-hover:from-indigo-400 group-hover:to-indigo-300"
          style={{
            width: `${(items.length / (limit === Infinity ? items.length || 1 : limit)) * 100}%`
          }}
        />
      </div>

      {isLimitReached && (
        <span className="absolute top-3 right-3 text-red-400 text-xs font-medium
                       bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
          Limit reached
        </span>
      )}
    </div>
  );
});

export const LicenseTypeGrid = React.memo<LicenseTypeGridProps>(({
  licenses,
  selectedSection,
  onSectionSelect,
  userTier,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 mt-2 sm:mt-4">
      {LICENSE_TYPES_ARRAY.map((licenseType) => {
        const type = licenseType.id as keyof LicenseGroup;
        const items = licenses[type] || [];
        
        const tierKey = userTier === 'premium' ? 'premium' : 'free';
        const tierLimits = TIER_LICENSE_LIMITS[tierKey] || {};
        
        let effectiveLimit = Infinity;
        
        if (tierLimits && typeof tierLimits === 'object' && type in tierLimits) {
            const limitForType = tierLimits[type as keyof typeof tierLimits];
            effectiveLimit = typeof limitForType === 'number' ? limitForType : Infinity;
        }

        return (
          <LicenseCard
            key={type}
            licenseType={licenseType}
            items={items}
            limit={effectiveLimit}
            isSelected={selectedSection === type}
            onSelect={() => onSectionSelect(type)}
          />
        );
      })}
    </div>
  );
}); 