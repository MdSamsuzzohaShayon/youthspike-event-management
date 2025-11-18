import { IPlayer, IPlayerRank } from '@/types';
import React from 'react';

interface IDeletePlayerDialogProps{
    deleteEl: React.RefObject<HTMLDialogElement | null>; 
    player: IPlayerRank; 
    handleDelete: (e: React.SyntheticEvent, playerId: string)=> void;
}

function DeletePlayerDialog({deleteEl, player, handleDelete}: IDeletePlayerDialogProps) {
  return (
    <dialog ref={deleteEl} className="modal-dialog p-4">
        <div className="flex flex-col gap-y-2">
          <h2>Delete player</h2>
          <p className="text-yellow-100/90">Deleting players deletes their stats. Just make player inactive if you want to keep players stats.</p>
          <p>
            Name: {player?.firstName} {player?.lastName}
          </p>
          <div className="buttons flex w-full justify-between items-center">
            <div className="btn-info" onClick={(e) => handleDelete(e, player._id)}>
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

export default DeletePlayerDialog;