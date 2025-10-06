import { ITeam } from '@/types';
import React from 'react';

interface IDeleteConfirmDialogProps {
  deleteEl: React.RefObject<HTMLDialogElement | null>;
  team: ITeam;
  handleDeleteTeam: (e: React.SyntheticEvent, teamId: string) => void;
}

const DeleteConfirmDialog: React.FC<IDeleteConfirmDialogProps> = ({ deleteEl, team, handleDeleteTeam }) => {
  return (
    <dialog ref={deleteEl} className="modal-dialog p-4 ">
      <div className="flex flex-col gap-y-2">
        <h2>Delete Team</h2>
        <p className="text-yellow-100/90">Are your sure you want to delete the team?</p>
        <p>Name: {team?.name}</p>
        <div className="buttons flex w-full justify-between items-center">
          <div className="btn-info" onClick={(e) => handleDeleteTeam(e, team._id)}>
            Confirm
          </div>
          <div className="btn-danger" onClick={(e) => deleteEl.current?.close()}>
            Cancel
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default DeleteConfirmDialog;
