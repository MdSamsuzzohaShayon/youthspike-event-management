import { motion, MotionConfig } from 'framer-motion';
import Image from 'next/image';
import React from 'react';

interface IDirectorDialogProps {
  dialogEl: React.RefObject<HTMLDialogElement | null>;
  handleCancel: (e: React.SyntheticEvent) => void;
  handleConfirmDelete: (e: React.SyntheticEvent) => void;
}

function DirectorDialog({ dialogEl, handleCancel, handleConfirmDelete }: IDirectorDialogProps) {
  return (
    <dialog ref={dialogEl} className="modal-dialog">
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Image height={20} width={20} src="/icons/close.svg" alt="close-icon" role="presentation" onClick={handleCancel} className="cursor-pointer svg-white" />
        </div>
        <h2 className="text-lg font-medium text-white">Are you sure you want to delete this director?</h2>
        <div className="flex gap-2">
          <motion.button className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700" onClick={handleConfirmDelete} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Yes
          </motion.button>
          <motion.button className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700" onClick={handleCancel} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Cancel
          </motion.button>
        </div>
      </div>
    </dialog>
  );
}

export default DirectorDialog;
