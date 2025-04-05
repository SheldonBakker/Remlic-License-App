import * as React from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiTrash2, FiUser } from 'react-icons/fi';
import { Contract, LicenseType } from '../../types/LicenseGroup';
import { LICENSE_TYPES_ARRAY, LICENSE_TYPES } from '../../constants/licenses';
import { FiFile } from 'react-icons/fi';
import { Pause } from './Pause';
import { toast } from 'react-hot-toast';
import { updatePsiraRecordByPsiraNumber } from '../../lib/psiraApi';

interface ContractCardProps {
  contract: Contract & { notifications_paused?: boolean; whatsapp_notifications_enabled?: boolean };
  type: string;
  onRenew: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onRefresh: () => void;
}

const getContractStatus = (expiryDate: string | null | undefined) => {
  if (!expiryDate) return { isValid: true, daysLeft: Infinity, isExpiringSoon: false };
  const today = new Date();
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return { isValid: true, daysLeft: Infinity, isExpiringSoon: false };

  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isValid: daysLeft > 0,
    daysLeft,
    isExpiringSoon: daysLeft > 0 && daysLeft <= 36,
  };
};

export const ContractCard: React.FC<ContractCardProps> = ({ contract, type, onRenew, onDelete, onRefresh }) => {
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handlePauseToggle = () => {
    onRefresh();
  };

  const handleWhatsAppToggle = () => {
    onRefresh();
  };

  const handlePsiraUpdate = async () => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const updatedRecord = await updatePsiraRecordByPsiraNumber(contract);
      if (updatedRecord) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating PSIRA record:', error);
      toast.error('Failed to update PSIRA record. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const expiryDateForStatus = type === 'psira' ? contract.certificate_expiry_date : contract.expiry_date;
  const { isValid, daysLeft, isExpiringSoon } = getContractStatus(expiryDateForStatus);
  
  const contractTypeInfo = LICENSE_TYPES_ARRAY.find(lt => lt.id === type);
  const contractTypeConfig = LICENSE_TYPES[type];

  const renderContractDetails = () => {
    if (type === 'psira') {
      const psiraConfig = contractTypeConfig || LICENSE_TYPES['psira'];
      const psiraTextClass = psiraConfig?.tailwindClass?.text || 'text-cyan-400';
      const psiraGradientClass = psiraConfig?.tailwindClass?.gradient || 'from-cyan-400';
      
      return (
        <div className="relative flex flex-col sm:flex-row justify-between items-start p-1">
          <div className="flex-1 w-full">
            <div className={`absolute -left-2 top-0 sm:top-1/2 h-full sm:h-16 sm:-translate-y-1/2 w-0.5 bg-gradient-to-b ${psiraGradientClass} to-purple-500 rounded-full`} />
            
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-indigo-300/90">
                {contractTypeInfo?.title || 'PSIRA Record'} 
              </span>
            </div>
            
            <div className="space-y-1.5 w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-white/90 tracking-tight break-words">
                {`${contract.first_name || ''} ${contract.last_name || ''}`.trim() || 'No Name'}
              </h3>
              
              <div className="text-gray-400 text-sm font-medium space-x-2">
                <span>{contract.psira_number ? `PSIRA: ${contract.psira_number}` : 'No PSIRA No.'}</span>
                {contract.grade && <span>{`• Grade: ${contract.grade}`}</span>}
              </div>
              <div className="text-gray-400 text-xs space-x-2">
                {contract.reg_status && <span>{`Reg: ${contract.reg_status}`}</span>}
                {contract.emp_status && <span>{`• Emp: ${contract.emp_status}`}</span>}
                {contract.employer && contract.employer !== 'NA' && <span>{`• ${contract.employer}`}</span>}
              </div>
            </div>
          </div>
          <div className={`${psiraTextClass.replace('400', '300')}/40 hidden sm:block`}>
            <span className={psiraTextClass}>
              {React.createElement(contractTypeInfo?.icon || FiUser, { 
                className: 'w-10 h-10 sm:w-14 sm:h-14 transform -rotate-12 group-hover:rotate-0 transition-all duration-300 ease-out'
              })}
            </span>
          </div>
        </div>
      );
    }
    
    if (type === 'works') {
      const worksConfig = contractTypeConfig || LICENSE_TYPES['works'];
      const worksTextClass = worksConfig?.tailwindClass?.text || 'text-purple-400';
      const worksGradientClass = worksConfig?.tailwindClass?.gradient || 'from-purple-400';
      
      return (
        <div className="relative flex flex-col sm:flex-row justify-between items-start p-1">
          <div className="flex-1 w-full">
            <div className={`absolute -left-2 top-0 sm:top-1/2 h-full sm:h-16 sm:-translate-y-1/2 w-0.5 bg-gradient-to-b ${worksGradientClass} to-purple-500 rounded-full`} />
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-indigo-300/90">
                {contractTypeInfo?.title || 'Work Contract'}
              </span>
            </div>
            
            <div className="space-y-1">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-white/90 tracking-tight break-words">
                  {contract.contract_name || 'Untitled Contract'}
                </h3>
                <div className="text-xs text-indigo-400/80">
                  {contract.contract_type || 'No Type Specified'}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                {contract.company_name && (
                  <span>{contract.company_name}</span>
                )}
                {contract.contact_person && (
                  <span>• {contract.contact_person}</span>
                )}
                {(contract.contact_number || contract.email_address) && (
                  <span>• {[
                    contract.contact_number,
                    contract.email_address
                  ].filter(Boolean).join(' / ')}</span>
                )}
              </div>
            </div>
          </div>
          <div className={`${worksTextClass.replace('400', '300')}/40 hidden sm:block`}>
            <span className={worksTextClass}>
              {React.createElement(contractTypeInfo?.icon || FiFile, { 
                className: 'w-10 h-10 sm:w-14 sm:h-14 transform -rotate-12 group-hover:rotate-0 transition-all duration-300 ease-out'
              })}
            </span>
          </div>
        </div>
      );
    }
    
    const defaultConfig = contractTypeConfig || LICENSE_TYPES['others'];
    const defaultTextClass = defaultConfig?.tailwindClass?.text || 'text-indigo-400';
    const defaultGradientClass = defaultConfig?.tailwindClass?.gradient || 'from-indigo-400';
    
    return (
      <div className="relative flex flex-col sm:flex-row justify-between items-start p-1">
        <div className="flex-1 w-full">
          <div className={`absolute -left-2 top-0 sm:top-1/2 h-full sm:h-16 sm:-translate-y-1/2 w-0.5 bg-gradient-to-b ${defaultGradientClass} to-purple-500 rounded-full`} />
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-indigo-300/90">
              {contractTypeInfo?.title || 'Contract'}
            </span>
          </div>
          
          <div className="space-y-2 w-full">
            <h3 className="text-xl sm:text-2xl font-bold text-white/90 tracking-tight break-words">
              {(() => {
                switch (type) {
                  case 'vehicles':
                    return `${contract.make} ${contract.model}`;
                  case 'drivers':
                  case 'prpds':
                  case 'tvlicenses':
                  case 'passports':
                  case 'competency':
                    return `${contract.first_name} ${contract.last_name}`;
                  case 'firearms':
                    return contract.make_model || 'Firearm Contract';
                  default:
                    return contract.description || 'Contract';
                }
              })()}
            </h3>
            
            <p className="text-gray-400 text-sm font-medium">
              {(() => {
                switch (type) {
                  case 'vehicles': return contract.registration_number;
                  case 'drivers': return contract.id_number;
                  case 'firearms': return `${contract.caliber || 'N/A'} • ${contract.registration_number || 'N/A'} • ${contract.first_name} ${contract.last_name}`;
                  case 'passports': return contract.passport_number;
                  case 'tvlicenses': return contract.license_number;
                  case 'prpds': return contract.id_number;
                  case 'competency': return `${contract.id_number} • ${contract.firearm_type || 'N/A'}`;
                  default: return '';
                }
              })()}
            </p>
          </div>
        </div>

        <div className={`${defaultTextClass.replace('400', '300')}/40 hidden sm:block`}>
          <span className={defaultTextClass}>
            {React.createElement(contractTypeInfo?.icon || FiFile, { 
              className: 'w-10 h-10 sm:w-14 sm:h-14 transform -rotate-12 group-hover:rotate-0 transition-all duration-300 ease-out'
            })}
          </span>
        </div>
      </div>
    );
  };

  const displayExpiryDate = type === 'psira' ? contract.certificate_expiry_date : contract.expiry_date;

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-xl border border-slate-700/30 shadow-xl transition-all duration-300 ease-out
                    hover:border-indigo-500/30 hover:shadow-indigo-500/10 hover:from-slate-800 hover:to-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-4 sm:p-6 space-y-4 sm:space-y-6">
        {renderContractDetails()}
        
        <div className="flex flex-col gap-2">
          <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg backdrop-blur-sm transition-colors duration-200 ${
            !isValid 
              ? 'bg-red-500/5 text-red-300 border-red-500/20'
              : isExpiringSoon
              ? 'bg-amber-500/5 text-amber-300 border-amber-500/20'
              : 'bg-emerald-500/5 text-emerald-300 border-emerald-500/20'
          } border`}>
            <div className="flex items-center gap-2">
              {!isValid ? <FiAlertCircle className="w-4 h-4" /> : 
               isExpiringSoon ? <FiClock className="w-4 h-4" /> :
               <FiCheckCircle className="w-4 h-4" />}
              <span className="font-medium text-sm">
                {!isValid 
                  ? 'Expired' 
                  : isExpiringSoon 
                    ? `Expiring Soon (${daysLeft} days)` 
                    : 'Active'}
              </span>
            </div>
            
            {type === 'psira' && contract.psira_number && (
              <button 
                onClick={handlePsiraUpdate}
                disabled={isUpdating}
                className="text-cyan-400 hover:text-cyan-300 p-1 rounded-md hover:bg-cyan-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh PSIRA data"
              >
                <FiRefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1 text-sm px-2 sm:px-4">
            {displayExpiryDate ? (
              <div className="text-slate-400 font-medium">
                {isValid 
                  ? `Expires on ${new Date(displayExpiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`
                  : `Expired on ${new Date(displayExpiryDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`}
              </div>
            ) : (
              <div className="text-slate-400 font-medium">No Expiry Date</div>
            )}
            {displayExpiryDate && (
              <div className="text-slate-500 text-xs">
                {daysLeft > 0 
                  ? `${daysLeft} days remaining`
                  : daysLeft !== Infinity ? `${Math.abs(daysLeft)} days ago` : ''}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-1.5">
            {type !== 'psira' && (
              <button
                onClick={() => onRenew(contract)}
                className="p-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors"
                title="Renew"
              >
                <FiRefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(contract)}
              className="p-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
          
          <Pause 
            isPaused={contract.notifications_paused || false}
            onTogglePause={handlePauseToggle}
            licenseId={contract.id}
            licenseType={type as LicenseType}
            isWhatsappEnabled={contract.whatsapp_notifications_enabled || false}
            onToggleWhatsapp={handleWhatsAppToggle}
            className=""
          />
        </div>
      </div>
    </div>
  );
};

export default ContractCard; 