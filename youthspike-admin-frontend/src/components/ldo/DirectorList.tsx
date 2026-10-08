import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { DELETE_DIRECTOR } from '@/graphql/director';
import DirectorRow from './DirectorRow';
import { ILDO, ILDOItem } from '@/types';
import DirectorDialog from './DirectorDialog';
import { useMutation } from '@apollo/client/react';
import { customScrollbar } from '@/utils/style';

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
    <div 
      className="directorList w-full flex flex-col"
    >
      {ldoList.length > 0 ? (
        <div className="relative w-full">
          {/* Right edge fade to indicate horizontal scroll */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none rounded-r-xl" />
          
          {/* Scrollable Container with Custom Scrollbar */}
          <div className={`overflow-x-auto w-full pb-4 ${customScrollbar}`}>
            <div className="min-w-[800px] w-full">
              <table className="w-full text-left text-sm text-gray-300 border-separate border-spacing-0">
                <thead>
                  <tr className="bg-yellow-logo text-black font-semibold">
                    <th className="py-4 px-4 sticky left-0 top-0 shadow-md z-20 bg-yellow-logo min-w-[120px] max-w-[120px] rounded-l-lg">Name</th>
                    <th className="py-4 px-4 top-0 z-10 bg-yellow-logo">Logo</th>
                    <th className="py-4 px-4 top-0 z-10 bg-yellow-logo">Director</th>
                    <th className="py-4 px-4 top-0 z-10 bg-yellow-logo">Phone</th>
                    <th className="py-4 px-4 top-0 z-10 bg-yellow-logo">Email</th>
                    <th className="py-4 px-4 text-center top-0 z-10 bg-yellow-logo rounded-r-lg">Actions</th>
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
        <div className="text-center py-12 text-gray-400 animate-fade-in flex flex-col items-center justify-center">
          {/* Modern Empty State SVG Icon */}
          <svg className="w-12 h-12 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3.875A2.875 2.875 0 011 18.125V18m14-4.646a4 4 0 110 5.292M21 18a2.875 2.875 0 01-2.875 2.875H15m0 0V18m0 0v-4.646m0 4.646H3.875A2.875 2.875 0 011 18.125V18M15 4.354a4 4 0 110 5.292M21 18.125A2.875 2.875 0 0018.125 15.25H15m6 2.875V18m0 0V5.875A2.875 2.875 0 0018.125 3H15" />
          </svg>
          <p>No directors available. Once you create one, it will be displayed here!</p>
        </div>
      )}

      <DirectorDialog dialogEl={dialogEl} handleCancel={handleCancel} handleConfirmDelete={handleConfirmDelete} />
    </div>
  );
}

export default DirectorList;