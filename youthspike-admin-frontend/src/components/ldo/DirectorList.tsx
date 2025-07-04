import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useMutation } from '@apollo/client';
import Image from 'next/image';
import { DELETE_DIRECTOR } from '@/graphql/director';
import DirectorRow from './DirectorRow';
import { ILDOItem } from '@/types';

interface IDirectorListProps {
  ldoList: ILDOItem[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  referchFunc?: () => void;
}

function DirectorList({ ldoList, setIsLoading, referchFunc }: IDirectorListProps) {
  const [ldoIdToDelete, setLdoIdToDelete] = useState<string | null>(null);
  const [deleteDirector] = useMutation(DELETE_DIRECTOR);
  const dialogEl = useRef<HTMLDialogElement | null>(null);

  const handleDeleteLDO = (e: React.SyntheticEvent, ldoId: string) => {
    e.preventDefault();
    setLdoIdToDelete(ldoId);
    dialogEl.current?.showModal();
  };

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLdoIdToDelete(null);
    dialogEl.current?.close();
  };

  const handleConfirmDelete = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (ldoIdToDelete) {
      try {
        setIsLoading(true);
        await deleteDirector({ variables: { dId: ldoIdToDelete } });
        setLdoIdToDelete(null);
        dialogEl.current?.close();
        referchFunc && (await referchFunc());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="directorList w-full flex flex-col gap-4 rounded-lg shadow-lg">
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-700">
        <motion.table
          className="w-full border-collapse"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <thead className="bg-yellow-logo text-black">
            <tr>
              <th className="py-4 px-6 text-left">Name</th>
              <th className="py-4 px-6 text-left">Logo</th>
              <th className="py-4 px-6 text-left">Director</th>
              <th className="py-4 px-6 text-left">Phone</th>
              <th className="py-4 px-6 text-left">Email</th>
              <th className="py-4 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-700'>
            {ldoList?.map((ldo, i) => (
              <DirectorRow
                key={ldo._id}
                ldo={ldo}
                handleDeleteLDO={handleDeleteLDO}
              />
            ))}
          </tbody>
        </motion.table>
      </div>

      <dialog
        ref={dialogEl}
        className="dialog-wrapper w-11/12 max-w-md bg-gray-800 text-gray-300 rounded-lg p-6 shadow-lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Image
              height={20}
              width={20}
              src="/icons/close.svg"
              alt="close-icon"
              role="presentation"
              onClick={handleCancel}
              className="cursor-pointer svg-white"
            />
          </div>
          <h2 className="text-lg font-medium text-white">Are you sure you want to delete this director?</h2>
          <div className="flex gap-2">
            <motion.button
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
              onClick={handleConfirmDelete}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Yes
            </motion.button>
            <motion.button
              className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              onClick={handleCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default DirectorList;
