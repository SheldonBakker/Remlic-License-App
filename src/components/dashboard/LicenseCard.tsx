import * as React from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { Contract } from '../../types/LicenseGroup';
import { LICENSE_TYPES } from '../../constants/licenses';
import { FiFile } from 'react-icons/fi';
import { Pause } from './Pause';

type LicenseType = 'vehicles' | 'drivers' | 'prpds' | 'tvlicenses' | 'passports' | 'firearms';

interface ContractCardProps {
  contract: Contract & { notifications_paused?: boolean };
  type: string;
  onRenew: (contract: Contract) => void;
  onDelete: (contract: Contract) => void;
  onRefresh: () => void;
}

const getContractStatus = (expiryDate: string) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    isValid: daysLeft > 0,
    daysLeft,
    isExpiringSoon: daysLeft > 0 && daysLeft <= 36,
  };
};

export const ContractCard: React.FC<ContractCardProps> = ({ contract, type, onRenew, onDelete, onRefresh }) => {
  const [isPaused, setIsPaused] = React.useState(contract.notifications_paused || false);

  const handlePauseToggle = () => {
    setIsPaused(prev => !prev);
    onRefresh();
  };

  const { isValid, daysLeft, isExpiringSoon } = getContractStatus(contract.expiry_date);
  
  const contractTypeInfo = LICENSE_TYPES.find(lt => lt.id === type);

  const renderContractInfo = () => {
    const baseTemplate = (
      <div className="relative flex justify-between items-start p-1">
        <div className="flex-1">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0.5 h-16 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-full" />
          
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-indigo-300/90">
              {contractTypeInfo?.title || 'Contract'}
            </span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white/90 tracking-tight">
              {(() => {
                switch (type) {
                  case 'vehicles':
                    return `${contract.make} ${contract.model}`;
                  case 'drivers':
                  case 'prpds':
                  case 'tvlicenses':
                  case 'passports':
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
                  case 'firearms': return (
                    <>
                      <span>{`${contract.caliber || 'N/A'} • ${contract.registration_number || 'N/A'}`}</span>
                      <br />
                      <span className="text-gray-500">{`${contract.first_name} ${contract.last_name}`}</span>
                    </>
                  );
                  case 'passports': return contract.passport_number;
                  case 'tvlicenses': return contract.license_number;
                  default: return '';
                }
              })()}
            </p>
          </div>
        </div>

        <div className="text-indigo-300/40">
          {React.createElement(contractTypeInfo?.icon || FiFile, { 
            className: 'w-14 h-14 transform -rotate-12 group-hover:rotate-0 transition-all duration-300 ease-out' 
          })}
        </div>
      </div>
    );

    return baseTemplate;
  };

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-xl border border-slate-700/30 shadow-xl transition-all duration-300 ease-out
                    hover:border-indigo-500/30 hover:shadow-indigo-500/10 hover:from-slate-800 hover:to-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6 space-y-6">
        {renderContractInfo()}
        
        <div className="flex flex-col gap-2.5">
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg backdrop-blur-sm transition-colors duration-200 ${
            !isValid 
              ? 'bg-red-500/5 text-red-300 border-red-500/20'
              : isExpiringSoon
              ? 'bg-amber-500/5 text-amber-300 border-amber-500/20'
              : 'bg-emerald-500/5 text-emerald-300 border-emerald-500/20'
          } border`}>
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

          <div className="flex flex-col gap-1 text-sm px-4">
            <div className="text-slate-400 font-medium">
              {daysLeft > 0 
                ? `Expires on ${new Date(contract.expiry_date).toLocaleDateString('en-US', { 
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}`
                : `Expired on ${new Date(contract.expiry_date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}`}
            </div>
            <div className="text-slate-500 text-xs">
              {daysLeft > 0 
                ? `${daysLeft} days remaining`
                : `${Math.abs(daysLeft)} days ago`}
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <Pause 
            isPaused={isPaused}
            onTogglePause={handlePauseToggle}
            licenseId={contract.id}
            licenseType={type as LicenseType}
            className="flex-1"
          />
          
          <button
            onClick={() => onDelete(contract)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-red-500/5 text-red-300 border border-red-500/20
              hover:bg-red-500/10 hover:border-red-500/30 active:scale-[0.98]
              transition-all duration-200"
          >
            <FiTrash2 className="w-4 h-4" />
            <span className="font-medium text-sm">Delete</span>
          </button>
          
          <button
            onClick={() => onRenew(contract)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
              bg-emerald-500/5 text-emerald-300 border border-emerald-500/20
              hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-[0.98]
              transition-all duration-200"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span className="font-medium text-sm">Renew</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractCard; 