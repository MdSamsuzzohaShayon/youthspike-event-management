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
    <div className="directorList w-full flex flex-col animate-fade-in">
      {ldoList.length > 0 ? (
        <div className="overflow-x-auto w-full">
          <div className="min-w-[800px] w-full">
            <div className="relative w-full">
              <table className="w-full text-left text-sm text-gray-300 bg-gray-900">
                <thead>
                  <tr className="bg-yellow-logo text-black font-semibold">
                    <th className="py-3 px-3 sticky left-0 top-0 shadow-md z-20 bg-yellow-logo min-w-[120px] max-w-[120px]">Name</th>
                    <th className="py-3 px-3">Logo</th>
                    <th className="py-3 px-3">Director</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ldoList?.map((ldo, i) => (
                    <DirectorRow key={ldo._id} ldo={ldo} handleDeleteLDO={handleDeleteLDO} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400 animate-fade-in">
          No directors available. Once you create one, it will be displayed here!
        </div>
      )}

      <DirectorDialog dialogEl={dialogEl} handleCancel={handleCancel} handleConfirmDelete={handleConfirmDelete} />
    </div>
  );
}

export default DirectorList;