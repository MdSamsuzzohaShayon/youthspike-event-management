import { useLdoId } from '@/lib/LdoProvider';
import { IGroupExpRel, IOption } from '@/types';
import { imgSize } from '@/utils/style';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cardVariants, menuVariants } from '@/utils/animation';
import { ApolloQueryResult, OperationVariables, useMutation } from '@apollo/client';
import { DELETE_A_GROUP, UPDATE_GROUP } from '@/graphql/group';
import { handleError } from '@/utils/handleError';
import SelectInput from '../elements/forms/SelectInput';
import { useError } from '@/lib/ErrorContext';

interface IGroupCardProps {
  group: IGroupExpRel;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList: IOption[];
  refetch?: (variables?: Partial<OperationVariables> | undefined) => Promise<ApolloQueryResult<any>>;
}

function GroupCard({ group, setIsLoading, divisionList, refetch }: IGroupCardProps) {
  const { ldoIdUrl } = useLdoId();
  
  const [deleteGroup] = useMutation(DELETE_A_GROUP);
  const [mutateGroup] = useMutation(UPDATE_GROUP);
  const params = useParams();
  const {setActErr} = useError();

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const dialogEl = useRef<HTMLDialogElement | null>(null);
  const [divisionToMove, setDivisionToMove] = useState<string | null>(null);

  // Framer Motion Variants

  const handleChangeStatus = (e: React.SyntheticEvent, isActive: boolean, groupId: string) => {
    e.preventDefault();
    console.log(isActive ? 'Activating' : 'Deactivating', groupId);
  };

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setDivisionToMove(inputEl.value);
  }

  const handleDelete = async (e: React.SyntheticEvent, groupId: string) => {
    e.preventDefault();
    // console.log('Deleting', groupId);
    try {
      setIsLoading(true);
      await deleteGroup({ variables: { groupId } });
      if (refetch) await refetch();

    } catch (error: any) {
      console.log(error);
      handleError({error, setActErr});
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMoveGroupBox = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (dialogEl.current) {
      setActionOpen(false);
      dialogEl.current.showModal();
    }
  };

  const handleMoveGroup = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await mutateGroup({variables: {updateInput: {_id: group._id, division: divisionToMove}}});
      if (refetch) await refetch();

    } catch (error: any) {
      console.log(error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDivision=(e: React.SyntheticEvent)=>{
    e.preventDefault();
    if (dialogEl.current) {
      dialogEl.current.close();
    }
  }
  

  
  return (
    <motion.div
      className="border border-gray-200 dark:border-gray-700 w-full bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 relative flex flex-col gap-6"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{group.name}</h3>
        <button
          onClick={() => setActionOpen((prev) => !prev)}
          className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Options"
        >
          <Image
            width={imgSize.logo}
            height={imgSize.logo}
            src="/icons/dots-vertical.svg"
            alt="options"
            className="w-5 h-5 svg-white"
          />
        </button>
      </div>

      {/* Team List Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Teams</h4>
          <ul className="list-inside mt-2 text-sm text-gray-600 dark:text-gray-400">
            {group.teams.map((team) => (
              <li key={team._id}>{team.name}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Section */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Total Teams: <span className="font-semibold">{group.teams.length}</span>
      </p>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {actionOpen && (
          <motion.ul
            className="absolute z-10 right-6 top-12 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <li className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
              <Link href={`/${params.eventId}/groups/${group._id}/update/${ldoIdUrl}`}>
                Edit Group
              </Link>
            </li>
            <li
              onClick={handleOpenMoveGroupBox}
              className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            >
              Move Group
            </li>
            <li
              onClick={(e) => handleChangeStatus(e, !group.active, group._id)}
              className="px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            >
              {group.active ? 'Make Inactive' : 'Make Active'}
            </li>
            <li
              onClick={(e) => handleDelete(e, group._id)}
              className="px-4 py-3 text-red-500 hover:bg-red-100 dark:hover:bg-red-600 cursor-pointer"
            >
              Delete Group
            </li>
          </motion.ul>
        )}
      </AnimatePresence>

      <dialog ref={dialogEl} className='w-5/6 md:w-2/6'>
        <div className="flex justify-end">
          <Image src="/icons/close.svg" height={20} width={20} className='w-6 h-6 svg-white' alt='close-icon' onClick={handleCloseDivision} />
        </div>
        <h3 className="text-lg font-medium mb-2">Change Division</h3>
        <form onSubmit={handleMoveGroup} >
          <SelectInput
            key="division-select"
            handleSelect={handleDivisionSelection}
            defaultValue={group.division.trim()}
            name="division"
            optionList={divisionList}
            vertical={false}
            extraCls="w-full"
            rw="w-full"
          />
          <br />
          <button className='btn-info'>Submit</button>
        </form>
      </dialog>
    </motion.div>
  );
}

export default GroupCard;
