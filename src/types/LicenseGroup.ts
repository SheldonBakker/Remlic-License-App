/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Contract {
  id: string;
  user_id: string;
  expiry_date: string;
  created_at: string;
  [key: string]: any;  // For additional properties
  notifications_paused?: boolean;
}

export interface LicenseGroup {
  [key: string]: Contract[];
  drivers: Contract[];
  vehicles: Contract[];
  firearms: Contract[];
  works: Contract[];
  prpds: Contract[];
  passports: Contract[];
  tvlicenses: Contract[];
  others: Contract[];

}

export type LicenseType =
  | "vehicles"
  | "drivers"
  | "firearms"
  | "prpd"
  | "works"
  | "others"
  | "passports"
  | "tv_licenses";

export interface License {
  id: string;
  type: 'vehicles' | 'drivers' | 'firearms' | 'prpd' | 'works' | 'other_documents' | 'passports' | 'tv_licenses';
  first_name?: string;
  last_name?: string;
  // ... other existing properties
}
