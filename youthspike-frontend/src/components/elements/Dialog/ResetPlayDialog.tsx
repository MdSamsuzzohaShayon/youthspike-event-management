import React from 'react';

interface IResetPlayDialogProps{
    confirmBoxEl: React.RefObject<HTMLDialogElement | null>;
    handleConfirmReset: (e: React.SyntheticEvent) => void; 
    closeResetConfirm: (e: React.SyntheticEvent) => void; 
}

function ResetPlayDialog({confirmBoxEl, handleConfirmReset, closeResetConfirm}: IResetPlayDialogProps) {
  return (
    <dialog ref={confirmBoxEl} className="modal-dialog">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-yellow-400">
            Reset Scorekeeper Setting
          </h2>
          <p className="text-sm text-gray-300">
            ⚠️ Warning: This will reset everything including player statistics,
            team scores, and selected server player. Are you sure you want to
            proceed?
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              className="bg-yellow-logo hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium transition duration-200"
              onClick={handleConfirmReset}
            >
              Confirm
            </button>
            <button
              className="bg-transparent border border-yellow-logo text-yellow-400 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-md transition duration-200"
              onClick={closeResetConfirm}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
  )
}

export default ResetPlayDialog;