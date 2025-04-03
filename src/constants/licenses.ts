import type { IconType } from 'react-icons';
import { FiFileText, FiUser, FiUserCheck, FiFile, FiBook } from 'react-icons/fi';
import { AiOutlineCar } from 'react-icons/ai';
import { BsTruck, BsTv } from 'react-icons/bs';
import { GiPistolGun } from 'react-icons/gi';

// Define the type for each license entry
interface LicenseTypeInfo {
  name: string;
  icon: IconType;
  color: string;
  table: string;
  tailwindClass: {
    text: string;
    hover: string;
    bg: string;
    gradient: string;
  };
}

// Type the main constant object
export const LICENSE_TYPES: Record<string, LicenseTypeInfo> = {
  vehicles: { 
    name: 'Vehicles', 
    icon: AiOutlineCar, 
    color: 'blue', 
    table: 'vehicles',
    tailwindClass: {
      text: 'text-blue-400',
      hover: 'group-hover:text-blue-300',
      bg: 'bg-blue-500/10',
      gradient: 'from-blue-400'
    }
  },
  drivers: { 
    name: 'Drivers', 
    icon: FiUser, 
    color: 'green', 
    table: 'drivers',
    tailwindClass: {
      text: 'text-green-400',
      hover: 'group-hover:text-green-300',
      bg: 'bg-green-500/10',
      gradient: 'from-green-400'
    }
  },
  firearms: { 
    name: 'Firearms', 
    icon: GiPistolGun, 
    color: 'red', 
    table: 'firearms',
    tailwindClass: {
      text: 'text-red-400',
      hover: 'group-hover:text-red-300',
      bg: 'bg-red-500/10',
      gradient: 'from-red-400'
    }
  },
  prpds: { 
    name: 'PrPDs', 
    icon: BsTruck, 
    color: 'yellow', 
    table: 'prpd',
    tailwindClass: {
      text: 'text-yellow-400',
      hover: 'group-hover:text-yellow-300',
      bg: 'bg-yellow-500/10',
      gradient: 'from-yellow-400'
    }
  },
  works: { 
    name: 'Works Permits', 
    icon: FiFileText, 
    color: 'purple', 
    table: 'works',
    tailwindClass: {
      text: 'text-purple-400',
      hover: 'group-hover:text-purple-300',
      bg: 'bg-purple-500/10',
      gradient: 'from-purple-400'
    }
  },
  passports: { 
    name: 'Passports', 
    icon: FiBook, 
    color: 'orange', 
    table: 'passports',
    tailwindClass: {
      text: 'text-orange-400',
      hover: 'group-hover:text-orange-300',
      bg: 'bg-orange-500/10',
      gradient: 'from-orange-400'
    }
  },
  tvlicenses: { 
    name: 'TV Licenses', 
    icon: BsTv, 
    color: 'teal', 
    table: 'tv_licenses',
    tailwindClass: {
      text: 'text-teal-400',
      hover: 'group-hover:text-teal-300',
      bg: 'bg-teal-500/10',
      gradient: 'from-teal-400'
    }
  },
  psira: { 
    name: 'PSIRA Records', 
    icon: FiUserCheck, 
    color: 'cyan', 
    table: 'psira_records',
    tailwindClass: {
      text: 'text-cyan-400',
      hover: 'group-hover:text-cyan-300',
      bg: 'bg-cyan-500/10',
      gradient: 'from-cyan-400'
    }
  },
  others: { 
    name: 'Other Documents', 
    icon: FiFile, 
    color: 'gray', 
    table: 'other_documents',
    tailwindClass: {
      text: 'text-gray-400',
      hover: 'group-hover:text-gray-300',
      bg: 'bg-gray-500/10',
      gradient: 'from-gray-400'
    }
  }
};

export const TIER_LIMITS: { [key: string]: { [key: string]: number } } = {
  free: {
    vehicles: 1,
    drivers: 1,
    firearms: 1,
    prpds: 1,
    works: 1,
    passports: 1,
    tvlicenses: 1,
    psira: 1,
    others: 1
  },
  premium: {
    vehicles: Infinity,
    drivers: Infinity,
    firearms: Infinity,
    prpds: Infinity,
    works: Infinity,
    passports: Infinity,
    tvlicenses: Infinity,
    psira: Infinity,
    others: Infinity
  }
};

export const LICENSE_TYPES_ARRAY: Array<{
  id: string;
  title: string;
  description?: string;
  icon: IconType;
  fields?: string[];
  table: string;
}> = [
  {
    id: 'drivers',
    title: "Driver's License",
    description: "Track and manage your driver's license renewals",
    icon: FiUser,
    fields: ["First Name", "Last Name", "ID Number", "Expiry Date"],
    table: 'drivers'
  },
  {
    id: 'vehicles',
    title: 'Vehicle Registration',
    description: "Monitor vehicle license disk renewals",
    icon: AiOutlineCar,
    fields: ["Make", "Model", "Registration Number", "Expiry Date"],
    table: 'vehicles'
  },
  {
    id: 'prpds',
    title: 'PrPD',
    description: "Manage professional driving permit renewals",
    icon: BsTruck,
    fields: ["First Name", "Last Name", "ID Number", "Expiry Date"],
    table: 'prpd'
  },
  {
    id: 'firearms',
    title: 'Firearm License',
    description: "Track firearm license renewals",
    icon: GiPistolGun,
    fields: ["Make/Model", "Caliber", "Registration Number", "Expiry Date"],
    table: 'firearms'
  },
  {
    id: 'works',
    title: 'Work Contract',
    description: "Monitor work contract expiry dates",
    icon: FiFileText,
    fields: ["Contract Name", "Contract Type", "Company Name", "Contact Details", "Expiry Date"],
    table: 'works'
  },
  {
    id: 'passports',
    title: 'Passport',
    description: "Track and manage your passport renewals",
    icon: FiBook,
    fields: ["First Name", "Last Name", "Passport Number", "Expiry Date"],
    table: 'passports'
  },
  {
    id: 'tvlicenses',
    title: 'TV License',
    description: "Monitor your TV license renewals",
    icon: BsTv,
    fields: ["First Name", "Last Name", "License Number", "Expiry Date"],
    table: 'tv_licenses'
  },
  {
    id: 'psira',
    title: 'PSIRA Record',
    description: "Verify and store PSIRA registration details",
    icon: FiUserCheck,
    fields: ["First Name", "Last Name", "PSIRA No", "Reg Status", "Expiry Date"],
    table: 'psira_records'
  },
  {
    id: 'others',
    title: 'Other Document',
    description: "Track any other important documents or licenses",
    icon: FiFile,
    fields: ["Description", "Document Type", "Expiry Date"],
    table: 'other_documents'
  }
] as const;

export const TIER_LICENSE_LIMITS: Record<string, number> = {
  basic: 2,
  standard: 5,
  professional: 8,
  advanced: 10,
  premium: Number.MAX_SAFE_INTEGER,

}; 