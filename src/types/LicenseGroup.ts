/* eslint-disable @typescript-eslint/no-explicit-any */
// Remove unused import
// import { IconType } from 'react-icons';

export interface Contract {
  id: string;
  user_id: string;
  expiry_date: string;
  created_at: string;
  [key: string]: any;  // For additional properties
  notifications_paused?: boolean;
  // Remove PSIRA fields from Contract if License interface is more specific
  /*
  psira_number?: string | null;
  gender?: string | null;
  registration_date?: string | null;
  profile_image?: string | null;
  reg_status?: string | null;
  emp_status?: string | null;
  employer?: string | null;
  certificate_status?: string | null;
  certificate_expiry_date?: string | null;
  grade?: string | null;
  special_courses?: string | null;
  */
}

export interface LicenseGroup {
  vehicles: Contract[];
  drivers: Contract[];
  firearms: Contract[];
  prpds: Contract[];
  works: Contract[];
  others: Contract[];
  passports: Contract[];
  tvlicenses: Contract[];
  psira: Contract[];
  competency: Contract[];
}

export type LicenseType =
  | "vehicles"
  | "drivers"
  | "firearms"
  | "prpd"
  | "works"
  | "others"
  | "passports"
  | "tvlicenses"
  | "psira"
  | "competency";

export interface License {
  id: string;
  // Update type union to include competency
  type: 'vehicles' | 'drivers' | 'firearms' | 'prpd' | 'works' | 'other_documents' | 'passports' | 'tvlicenses' | 'psira' | 'competency';
  first_name?: string;
  last_name?: string;
  id_number?: string | null;
  registration_number?: string | null;
  make?: string | null;
  model?: string | null;
  license_number?: string | null;
  expiry_date?: string | null;
  
  // Add PSIRA-specific fields here
  psira_number?: string | null;          // From SIRANo
  gender?: string | null;                // From Gender
  registration_date?: string | null;     // From RegistrationDate
  profile_image?: string | null;         // From ProfileImage
  reg_status?: string | null;            // From RequestStatus
  emp_status?: string | null;            // From EmpStatus
  employer?: string | null;              // From EmpCompany
  certificate_status?: string | null;    // From CertificateStatus
  certificate_expiry_date?: string | null; // From ExpiryDate
  grade?: string | null;                 // From Grade
  special_courses?: string | null;       // From SpecialGrade
  
  // Add Competency-specific field
  firearm_type?: string | null;         // For competency firearm type
}
