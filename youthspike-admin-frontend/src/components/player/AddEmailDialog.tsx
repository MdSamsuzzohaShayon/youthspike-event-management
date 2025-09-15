import { imgSize } from '@/utils/style';
import Image from 'next/image';
import React from 'react';
import InputField from '../elements/forms/InputField';

interface IAddEmailDialogProps{
    dialogEl: React.RefObject<HTMLDialogElement | null>; 
    handleCloseModal: (e: React.SyntheticEvent) => void; 
    handleCaptainEmail: (e: React.SyntheticEvent) => Promise<void>; 
    setNewEmail: React.Dispatch<React.SetStateAction<string>>;
}

function AddEmailDialog({dialogEl, handleCloseModal, handleCaptainEmail, setNewEmail}: IAddEmailDialogProps) {
  return (
    <dialog ref={dialogEl} className="modal-dialog">
        <div className="p-4">
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" role="presentation" className="svg-white" onClick={handleCloseModal} alt="close-icon" />
          <form onSubmit={handleCaptainEmail}>
            <InputField name="email" type="email" required handleInputChange={(e) => setNewEmail(e.target.value)} />
            <button className="btn-info mt-4" type="submit">
              Make Captain
            </button>
          </form>
        </div>
      </dialog>
  )
}

export default AddEmailDialog;