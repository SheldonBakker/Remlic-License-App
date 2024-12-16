/* eslint-disable @typescript-eslint/no-explicit-any */
export interface License {
  id: string;
  user_id: string;
  expiry_date: string;
  created_at: string;
  [key: string]: any;  // For additional properties
}

export interface LicenseGroup {
  vehicles: License[];
  drivers: License[];
  firearms: License[];
  prpds: License[];
  works: License[];
  others: License[];
  passports: License[];
  tvlicenses: License[];
}

export type LicenseType =
  | "vehicles"
  | "drivers"
  | "firearms"
  | "prpds"
  | "works"
  | "others"
  | "passports"
  | "tvlicenses";
