import type { IconType } from 'react-icons';
import { FiCreditCard, FiTarget, FiFileText, FiFile, FiTv } from 'react-icons/fi';
import { AiOutlineCar } from 'react-icons/ai';
import { BsTruck } from 'react-icons/bs';

export const LICENSE_TYPES: Array<{
  id: string;
  title: string;
  description?: string;
  icon: IconType;
  fields?: string[];
}> = [
  {
    id: 'drivers',
    title: "Driver's License",
    description: "Track and manage your driver's license renewals",
    icon: FiCreditCard,
    fields: ["First Name", "Last Name", "ID Number", "Expiry Date"],
  },
  {
    id: 'vehicles',
    title: 'Vehicle Registration',
    description: "Monitor vehicle license disk renewals",
    icon: AiOutlineCar,
    fields: ["Make", "Model", "Registration Number", "Expiry Date"],
  },
  {
    id: 'prpds',
    title: 'PrPD',
    description: "Manage professional driving permit renewals",
    icon: BsTruck,
    fields: ["First Name", "Last Name", "ID Number", "Expiry Date"],
  },
  {
    id: 'firearms',
    title: 'Firearm License',
    description: "Track firearm license renewals",
    icon: FiTarget,
    fields: ["Make/Model", "Caliber", "Registration Number", "Expiry Date"],
  },
  {
    id: 'works',
    title: 'Work Contract',
    description: "Monitor work contract expiry dates",
    icon: FiFileText,
    fields: ["Contract Name", "Contract Type", "Company Name", "Contact Details", "Expiry Date"],
  },
  {
    id: 'passports',
    title: 'Passport',
    description: "Track and manage your passport renewals",
    icon: FiCreditCard,
    fields: ["First Name", "Last Name", "Passport Number", "Expiry Date"],
  },
  {
    id: 'others',
    title: 'Other Document',
    description: "Track any other important documents or licenses",
    icon: FiFile,
    fields: ["Description", "Document Type", "Expiry Date"],
  },
  {
    id: 'tvlicenses',
    title: 'TV License',
    description: "Monitor your TV license renewals",
    icon: FiTv,
    fields: ["First Name", "Last Name", "License Number", "Expiry Date"],
  },
] as const;

export const TIER_LICENSE_LIMITS: Record<string, number> = {
  basic: 2,
  standard: 8,
  professional: 12,
  advanced: 30,
  premium: Number.MAX_SAFE_INTEGER,
}; 