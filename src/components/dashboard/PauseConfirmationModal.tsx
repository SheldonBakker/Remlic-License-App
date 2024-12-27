import * as React from 'react';
import { Dialog } from '@headlessui/react';

interface PauseConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PauseConfirmationModal: React.FC<PauseConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-[#1f2937] p-6 text-left align-middle shadow-xl transition-all border border-indigo-500/20">
          <Dialog.Title
            as="h3"
            className="text-lg font-medium leading-6 text-white mb-4"
          >
            Pause Notifications
          </Dialog.Title>

          <div className="mt-2">
            <p className="text-sm text-gray-300">
              Are you sure you want to pause notifications for this license? You can resume them at any time.
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 transition-all duration-200"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200"
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 