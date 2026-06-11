import { imgSize } from '@/utils/style';
import Image from 'next/image';
import React from 'react';
import InputField from '../elements/forms/InputField';
import { IPlayerRank } from '@/types';

interface IAddEmailDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  player: IPlayerRank;
  onClose: (e: React.SyntheticEvent) => void;
  onCaptainEmail: (e: React.SyntheticEvent) => Promise<void>;
  setNewEmail: React.Dispatch<React.SetStateAction<string>>;
}

function AddEmailDialog({ dialogRef, player, onClose, onCaptainEmail, setNewEmail }: IAddEmailDialogProps) {
  return (
    <dialog ref={dialogRef} className="modal-dialog">
      <div className="p-4">
        <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" role="presentation" className="svg-white" onClick={onClose} alt="close-icon" />
        <div className="w-full py-2">
          <h4>Name: {player.firstName} {player.lastName}</h4>
          <p>Email: {player.username}</p>
        </div>
        <form onSubmit={onCaptainEmail}>
          <InputField name="email" type="email" required onChange={(e) => setNewEmail(e.target.value)} />
          <button className="btn-info mt-4" type="submit">
            Make Captain
          </button>
        </form>
      </div>
    </dialog>
  )
}

export default AddEmailDialog;