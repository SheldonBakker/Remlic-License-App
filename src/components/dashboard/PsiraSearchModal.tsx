import React, { useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiSearch, FiX, FiSave, FiLoader } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { fetchPsiraDetails, savePsiraRecord, RawPsiraRecord } from '../../lib/psiraApi'; // Adjust path if needed
import { supabase } from '../../lib/supabase'; // Needed to get user ID

interface PsiraSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess: () => void; // Callback after successful save
}

export const PsiraSearchModal: React.FC<PsiraSearchModalProps> = ({ open, onClose, onSaveSuccess }) => {
  const [idNumber, setIdNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<RawPsiraRecord | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!idNumber || idNumber.length !== 13) {
      toast.error('Please enter a valid 13-digit ID number.');
      return;
    }
    setIsLoading(true);
    setSearchResult(null);
    setSearchError(null);
    try {
      const result = await fetchPsiraDetails(idNumber);
      if (result) {
        setSearchResult(result);
        toast.success('Applicant details found.');
      } else {
        setSearchError('Applicant not found or API error occurred.'); // Error toasts handled in fetchPsiraDetails
      }
    } catch (error) {
      // Error toasts handled in fetchPsiraDetails
      setSearchError('An unexpected error occurred during search.');
      console.error("PSIRA Search UI Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [idNumber]);

  const handleSave = useCallback(async () => {
    if (!searchResult) {
      toast.error('No search result to save.');
      return;
    }
    setIsSaving(true);
    try {
      const supabaseInstance = await supabase;
      const { data: { session } } = await supabaseInstance.auth.getSession();
      if (!session?.user?.id) {
        toast.error('User session not found. Cannot save.');
        setIsSaving(false);
        return;
      }
      
      const savedRecord = await savePsiraRecord(searchResult, session.user.id, idNumber);
      if (savedRecord) {
        onSaveSuccess(); // Trigger refresh in parent
        handleClose(); // Close modal on success
      } // Error toasts handled in savePsiraRecord
    } catch (error) {
      // Error toasts handled in savePsiraRecord
      console.error("PSIRA Save UI Error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [searchResult, idNumber, onSaveSuccess, onClose]); // Add onClose to dependency array

  // Clear state when closing
  const handleClose = useCallback(() => {
    setIdNumber('');
    setSearchResult(null);
    setSearchError(null);
    setIsLoading(false);
    setIsSaving(false);
    onClose();
  }, [onClose]);

  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-[#1f2937]/95 backdrop-blur-xl border border-indigo-500/20 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-slate-100 flex justify-between items-center"
                >
                  PSIRA Record Search
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700"
                    aria-label="Close modal"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-400">
                    Enter the 13-digit South African ID number to search the official PSIRA database.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 13-digit ID Number"
                        maxLength={13}
                        className="w-full px-4 py-2 pl-4 bg-[#374151]/50 border border-indigo-500/20 rounded-lg text-white placeholder-gray-400 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-base"
                        disabled={isLoading || isSaving}
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isLoading || isSaving || idNumber.length !== 13}
                      className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-auto sm:px-4 shrink-0 gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Search"
                    >
                      {isLoading ? (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      ) : (
                        <FiSearch className="w-5 h-5" />
                      )}
                      <span className="hidden sm:inline">Search</span>
                    </button>
                  </div>

                  {isLoading && (
                    <div className="flex justify-center items-center py-4">
                      <FiLoader className="w-6 h-6 animate-spin text-indigo-400" />
                      <span className="ml-3 text-slate-400">Searching PSIRA database...</span>
                    </div>
                  )}

                  {searchResult && !isLoading && (
                    <div className="mt-4 p-4 border border-slate-700/30 rounded-lg bg-slate-800/50 space-y-2 text-sm text-slate-200">
                      <h4 className="font-semibold text-base text-slate-100 mb-2">Applicant Found:</h4>
                      <p><span className="font-medium text-slate-400 w-24 inline-block">Name:</span> {searchResult.FirstName} {searchResult.LastName}</p>
                      <p><span className="font-medium text-slate-400 w-24 inline-block">PSIRA No:</span> {searchResult.SIRANo}</p>
                      <p><span className="font-medium text-slate-400 w-24 inline-block">Reg Status:</span> {searchResult.RequestStatus}</p>
                      <p><span className="font-medium text-slate-400 w-24 inline-block">Cert Status:</span> {searchResult.CertificateStatus}</p>
                      <p><span className="font-medium text-slate-400 w-24 inline-block">Expiry Date:</span> {searchResult.ExpiryDate}</p>
                      <p><span className="font-medium text-slate-400 w-24 inline-block">Grade:</span> {searchResult.Grade}</p>
                    </div>
                  )}

                  {searchError && !isLoading && (
                    <div className="mt-4 p-3 border border-red-500/20 rounded-lg bg-red-500/10 text-red-300 text-sm">
                      {searchError}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors disabled:opacity-50"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!searchResult || isLoading || isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white 
                               bg-green-600 hover:bg-green-700 
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 
                               focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <><FiLoader className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><FiSave className="w-4 h-4" /> Save Record</>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 