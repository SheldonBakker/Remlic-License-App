import { supabase } from './supabase';
import { toast } from 'react-hot-toast';
import { Contract } from '../types/LicenseGroup'; // Assuming Contract type includes all needed PSIRA fields

const PSIRA_API_URL = 'https://psiraapi.sortelearn.com/api/SecurityOfficer/Get_ApplicantDetails';

// Interface for the raw API response structure
interface PsiraApiResponse {
  Table: RawPsiraRecord[];
  Table1: unknown[]; // Use unknown[] instead of any[] for unused table
}

// Export this interface so the modal can use it
export interface RawPsiraRecord {
  FirstName: string;
  LastName: string;
  Gender: string;
  RequestStatus: string; // -> reg_status
  ProfileId: number; // Not directly saved?
  SIRANo: string; // -> psira_number
  RegistrationDate: string; // -> registration_date
  ProfileImage: string; // -> profile_image
  ExpiryDate: string; // -> certificate_expiry_date
  Grade: string;
  EmpStatus: string; // -> emp_status
  EmpCompany: string; // -> employer
  CertificateStatus: string; // -> certificate_status
  SpecialGrade: string; // -> special_courses
}

/**
 * Fetches PSIRA applicant details from the external API.
 * @param idNumber - The South African ID number to search for.
 * @returns The applicant data object or null if not found/error.
 */
export const fetchPsiraDetails = async (idNumber: string): Promise<RawPsiraRecord | null> => {
  if (!idNumber || idNumber.length !== 13 || !/^[0-9]+$/.test(idNumber)) {
    toast.error('Invalid ID Number format.');
    return null;
  }

  const payload = {
    ApplicationNo: "",
    ContactNo: null,
    IDNumber: idNumber,
    SIRANo: "",
    CompanyName: "",
    ProfileId: "4" // Keep this as "4" based on previous findings
  };

  try {
    const response = await fetch(PSIRA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        // Mimic headers observed in browser dev tools
        'Origin': 'https://digitalservices.psira.co.za',
        'Referer': 'https://digitalservices.psira.co.za/',
        'skip': 'true'
        // Add 'Authorization' or 'requestverificationtoken' if they prove necessary
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      // Handle specific errors if possible, otherwise generic
      const errorText = await response.text();
      console.error('PSIRA API Error:', response.status, errorText);
      toast.error(`API Error: ${response.status} - ${response.statusText}`);
      return null;
    }

    const data: PsiraApiResponse = await response.json();

    if (!data || !data.Table || data.Table.length === 0) {
      toast.error('Applicant not found.');
      return null;
    }

    // Return the first record found
    return data.Table[0];

  } catch (error) {
    console.error('Error fetching PSIRA details:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`Network or Parsing Error: ${message}`);
    return null;
  }
};

/**
 * Saves a fetched PSIRA record to the Supabase database.
 * @param recordData - The raw PSIRA record data from the API.
 * @param userId - The ID of the user saving the record.
 * @param idNumberUsed - The ID number used for the search.
 * @returns The newly created database record or null if error.
 */
export const savePsiraRecord = async (recordData: RawPsiraRecord, userId: string, idNumberUsed: string): Promise<Contract | null> => {
  if (!userId) {
    toast.error('User not identified. Cannot save record.');
    return null;
  }
  if (!recordData) {
    toast.error('No record data to save.');
    return null;
  }

  const supabaseInstance = await supabase;

  // Map API data to database columns (adjust column names if your table differs)
  const recordToInsert = {
    user_id: userId,
    id_number: idNumberUsed, // Save the ID number used for the lookup
    first_name: recordData.FirstName,
    last_name: recordData.LastName,
    psira_number: recordData.SIRANo,
    gender: recordData.Gender,
    registration_date: recordData.RegistrationDate, // Consider converting to date type if column is date/timestamp
    profile_image: recordData.ProfileImage, // Consider constructing full URL if needed
    reg_status: recordData.RequestStatus,
    emp_status: recordData.EmpStatus,
    employer: recordData.EmpCompany,
    certificate_status: recordData.CertificateStatus,
    // Use ExpiryDate for certificate_expiry_date, assuming it's the cert expiry
    certificate_expiry_date: recordData.ExpiryDate, // Consider converting to date type 
    grade: recordData.Grade,
    special_courses: recordData.SpecialGrade,
    // expiry_date: recordData.ExpiryDate // Map to main expiry_date if that's more relevant for notifications
  };

  try {
    const { data, error } = await supabaseInstance
      .from('psira_records') // Use the table name defined in constants
      .insert([recordToInsert])
      .select()
      .single(); // Assuming you want the inserted record back

    if (error) {
      console.error('Error saving PSIRA record:', error);
      toast.error(`Database Error: ${error.message}`);
      return null;
    }

    toast.success('PSIRA record saved successfully!');
    return data as Contract; // Cast to Contract type

  } catch (error) {
    console.error('Supabase operation failed:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`Save Error: ${message}`);
    return null;
  }
}; 