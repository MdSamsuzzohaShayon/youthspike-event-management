import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { DELETE_DIRECTOR } from '@/graphql/director';
import DirectorRow from './DirectorRow';
import { ILDO, ILDOItem } from '@/types';
import DirectorDialog from './DirectorDialog';
import { useMutation } from '@apollo/client/react';

interface IDirectorListProps {
  ldoList: ILDO[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refetchFunc?: () => void;
}

function DirectorList({ ldoList, setIsLoading, refetchFunc }: IDirectorListProps) {
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
        refetchFunc && (await refetchFunc());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="directorList w-full flex flex-col gap-4 rounded-lg shadow-lg">
      {ldoList.length > 0 ? (
        <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-700">
          <motion.table className="w-full border-collapse" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
            <tbody className="divide-y divide-gray-700">
              {ldoList?.map((ldo, i) => (
                <DirectorRow key={ldo._id} ldo={ldo} handleDeleteLDO={handleDeleteLDO} />
              ))}
            </tbody>
          </motion.table>
        </div>
      ) : (<div>There are not director avaialable, once you create one, it will be deplayed here!</div>)}

      <DirectorDialog dialogEl={dialogEl} handleCancel={handleCancel} handleConfirmDelete={handleConfirmDelete} />
    </div>
  );
}

export default DirectorList;
