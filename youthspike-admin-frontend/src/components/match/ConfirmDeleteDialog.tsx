import React from 'react';


interface IConfirmDeleteDialogProps{
    deleteEl: React.RefObject<HTMLDialogElement | null>;
    matchId: string;
    description: string | null;
    handleDeleteMatch: (e: React.SyntheticEvent, matchId: string) => void;
}


function ConfirmDeleteDialog({deleteEl, matchId, description, handleDeleteMatch}: IConfirmDeleteDialogProps) {
  return (
    <dialog ref={deleteEl} className="modal-dialog p-4">
        <div className="flex flex-col gap-y-2">
          <h2>Delete match</h2>
          <p className="text-yellow-100/90">Are your sure you want to delete the match?</p>
          <p>Description: {description}</p>
          <div className="buttons flex w-full justify-between items-center">
            <div className="btn-info" onClick={(e) => handleDeleteMatch(e, matchId)}>
              Confirm
            </div>
            <div className="btn-danger" onClick={(e) => deleteEl.current?.close()}>
              Cancel
            </div>
          </div>
        </div>
      </dialog>
  )
}

export default ConfirmDeleteDialog;