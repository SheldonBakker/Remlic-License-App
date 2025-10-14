import { supabase } from './supabase';
import { toast } from 'react-hot-toast';
import { Contract } from '../types/LicenseGroup'; // Assuming Contract type includes all needed PSIRA fields

const PSIRA_PROXY_URL = '/api/psira-proxy';

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

  // No longer need the full payload here, just the ID number for the proxy
  // const payload = { ... };

  try {
    // Call the local proxy script instead of the direct API
    const response = await fetch(PSIRA_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Sending JSON to the proxy
        'Accept': 'application/json', // Expecting JSON back from the proxy
      },
      // Send only the idNumber in the body
      body: JSON.stringify({ idNumber: idNumber })
    });

    if (!response.ok) {
      // Handle specific errors if possible, otherwise generic
      // The proxy script should ideally return appropriate status codes and error messages
      const errorText = await response.text();
      console.error('PSIRA Proxy Error:', response.status, errorText);
      // Try to parse error message if proxy sends JSON error
      try {
        const errorJson = JSON.parse(errorText);
        toast.error(`Proxy Error: ${errorJson.message || response.statusText}`);
      } catch {
        toast.error(`Proxy Error: ${response.status} - ${response.statusText}`);
      }
      return null;
    }

    // Expecting the proxy to return the same PsiraApiResponse structure
    const data: PsiraApiResponse = await response.json();

    if (!data || !data.Table || data.Table.length === 0) {
      // This could mean the proxy succeeded but the PSIRA API returned no data
      toast.error('Applicant not found (via proxy).');
      return null;
    }

    // Return the first record found
    return data.Table[0];

  } catch (error) {
    // This catches network errors connecting to the proxy or JSON parsing errors
    console.error('Error fetching PSIRA details via proxy:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`Proxy Network/Parsing Error: ${message}`);
    return null;
  }
};

/**
 * Fetches PSIRA applicant details from the external API using a PSIRA number.
 * @param psiraNumber - The PSIRA number to search for.
 * @returns The applicant data object or null if not found/error.
 */
export const fetchPsiraDetailsByPsiraNumber = async (psiraNumber: string): Promise<RawPsiraRecord | null> => {
  if (!psiraNumber || psiraNumber.trim() === '') {
    toast.error('Invalid PSIRA Number.');
    return null;
  }

  try {
    // Call the API using the proxy, but with a PSIRA number instead of ID number
    const response = await fetch(PSIRA_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Send the PSIRA number in the payload
      body: JSON.stringify({ 
        psiraNumber: psiraNumber,
        usesPsiraNumber: true // Flag for the proxy to identify this is a PSIRA number search
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PSIRA Proxy Error:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        toast.error(`Proxy Error: ${errorJson.message || response.statusText}`);
      } catch {
        toast.error(`Proxy Error: ${response.status} - ${response.statusText}`);
      }
      return null;
    }

    const data: PsiraApiResponse = await response.json();

    if (!data || !data.Table || data.Table.length === 0) {
      toast.error('PSIRA Record not found.');
      return null;
    }

    // Return the first record found
    return data.Table[0];

  } catch (error) {
    console.error('Error fetching PSIRA details by PSIRA number:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`Proxy Network/Parsing Error: ${message}`);
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

/**
 * Updates an existing PSIRA record with fresh data from the PSIRA API.
 * @param existingRecord - The existing PSIRA record to update.
 * @returns The updated database record or null if error.
 */
export const updatePsiraRecordByPsiraNumber = async (existingRecord: Contract): Promise<Contract | null> => {
  if (!existingRecord || !existingRecord.id) {
    toast.error('Invalid record to update.');
    return null;
  }

  const psiraNumber = existingRecord.psira_number;
  if (!psiraNumber) {
    toast.error('No PSIRA number found in the record.');
    return null;
  }

  // Show processing notification
  const toastId = toast.loading('Fetching latest PSIRA data...');

  try {
    // Fetch latest data from PSIRA API
    const latestData = await fetchPsiraDetailsByPsiraNumber(psiraNumber);
    
    if (!latestData) {
      toast.error('Failed to fetch latest PSIRA data.', { id: toastId });
      return null;
    }

    const supabaseInstance = await supabase;

    // Map the latest API data to database columns
    const recordToUpdate = {
      // Preserve existing record ID and user_id
      // id: existingRecord.id, // Don't include this as it's the primary key
      // user_id: existingRecord.user_id, // Keep the existing user_id
      
      // Update with latest data from PSIRA API
      first_name: latestData.FirstName,
      last_name: latestData.LastName,
      psira_number: latestData.SIRANo,
      gender: latestData.Gender,
      registration_date: latestData.RegistrationDate,
      profile_image: latestData.ProfileImage,
      reg_status: latestData.RequestStatus,
      emp_status: latestData.EmpStatus,
      employer: latestData.EmpCompany,
      certificate_status: latestData.CertificateStatus,
      certificate_expiry_date: latestData.ExpiryDate,
      grade: latestData.Grade,
      special_courses: latestData.SpecialGrade
      
      // Remove the updated_at field as it doesn't exist in the database schema
      // updated_at: new Date().toISOString()
    };

    // Update the record in the database
    const { data, error } = await supabaseInstance
      .from('psira_records')
      .update(recordToUpdate)
      .eq('id', existingRecord.id) // Update by primary key
      .select()
      .single();

    if (error) {
      console.error('Error updating PSIRA record:', error);
      toast.error(`Database Error: ${error.message}`, { id: toastId });
      return null;
    }

    toast.success('PSIRA record updated successfully!', { id: toastId });
    return data as Contract;

  } catch (error) {
    console.error('PSIRA update operation failed:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error(`Update Error: ${message}`, { id: toastId });
    return null;
  }
}; 