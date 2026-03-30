// ============================================================================
// GroupCard.tsx
// ============================================================================
import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';
import { IGroupExpRel, IOption, IResponse } from '@/types';
import { imgSize } from '@/utils/style';
import { handleError } from '@/utils/handleError';
import { cardVariants, menuVariants } from '@/utils/animation';
import { DELETE_A_GROUP, UPDATE_GROUP } from '@/graphql/group';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMutation } from '@apollo/client/react';
import SelectInput from '../elements/forms/SelectInput';

interface IGroupCardProps {
  group: IGroupExpRel;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList: IOption[];
}

// ============================================================================
// Sub-components
// ============================================================================

interface GroupHeaderProps {
  groupName: string;
  onToggleMenu: () => void;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({ groupName, onToggleMenu }) => (
  <div className="flex justify-between items-center">
    <h3 className="text-xl font-bold text-gray-800 text-white">{groupName}</h3>
    <button
      onClick={onToggleMenu}
      className="w-10 h-10 flex items-center justify-center bg-gray-200 bg-gray-700 rounded-full hover:bg-gray-300 hover:bg-gray-600 transition-colors"
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
);

interface TeamListProps {
  teams: Array<{ _id: string; name: string }>;
}

const TeamList: React.FC<TeamListProps> = ({ teams }) => (
  <div className="border-t border-gray-200 border-gray-700 pt-4">
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-600 text-gray-300">Teams</h4>
      <ul className="list-inside mt-2 text-sm text-gray-600 text-gray-400">
        {teams.map((team) => (
          <li key={team._id}>{team.name}</li>
        ))}
      </ul>
    </div>
  </div>
);

interface GroupStatsProps {
  teamCount: number;
  isActive: boolean;
}

const GroupStats: React.FC<GroupStatsProps> = ({ teamCount, isActive }) => (
  <>
    <p className="text-sm text-gray-500 text-gray-400">
      Total Teams: <span className="font-semibold">{teamCount}</span>
    </p>
    <p className="text-sm text-gray-500 text-gray-400">
      Status: <span className="font-semibold">{isActive ? "Active" : "Inactive"}</span>
    </p>
  </>
);

interface ActionMenuProps {
  isOpen: boolean;
  groupId: string;
  isActive: boolean;
  ldoIdUrl: string;
  eventId: string | string[];
  onEdit: () => void;
  onMove: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  groupId,
  isActive,
  ldoIdUrl,
  eventId,
  onMove,
  onToggleStatus,
  onDelete,
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.ul
        className="absolute z-10 right-6 top-12 w-48 bg-gray-900 text-gray-200 rounded-md shadow-lg overflow-hidden"
        variants={menuVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.2 }}
      >
        <li className="px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer">
          <Link href={`/${eventId}/groups/${groupId}/${ldoIdUrl}`}>
            Edit Group
          </Link>
        </li>
        <li
          onClick={onMove}
          className="px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer"
        >
          Move Group
        </li>
        <li
          onClick={onToggleStatus}
          className="px-4 py-3 hover:bg-gray-200 hover:bg-gray-700 cursor-pointer"
        >
          {isActive ? 'Make Inactive' : 'Make Active'}
        </li>
        <li
          onClick={onDelete}
          className="px-4 py-3 text-red-500 hover:bg-red-100 hover:bg-red-600 cursor-pointer"
        >
          Delete Group
        </li>
      </motion.ul>
    )}
  </AnimatePresence>
);

interface MoveDivisionDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  currentDivision: string;
  divisionList: IOption[];
  onDivisionChange: (e: React.SyntheticEvent) => void;
  onSubmit: (e: React.SyntheticEvent) => void;
  onClose: (e: React.SyntheticEvent) => void;
}

const MoveDivisionDialog: React.FC<MoveDivisionDialogProps> = ({
  dialogRef,
  currentDivision,
  divisionList,
  onDivisionChange,
  onSubmit,
  onClose,
}) => (
  <dialog ref={dialogRef} className="modal-dialog">
    <div className="flex justify-end">
      <Image
        src="/icons/close.svg"
        height={20}
        width={20}
        className="w-6 h-6 svg-white cursor-pointer"
        alt="close-icon"
        onClick={onClose}
      />
    </div>
    <h3 className="text-lg font-medium mb-2">Change Division</h3>
    <form onSubmit={onSubmit}>
      <SelectInput
        key="division-select"
        handleSelect={onDivisionChange}
        defaultValue={currentDivision.trim()}
        name="division"
        optionList={divisionList}
      />
      <br />
      <button className="btn-info">Submit</button>
    </form>
  </dialog>
);

// ============================================================================
// Main Component
// ============================================================================

function GroupCard({ group, setIsLoading, divisionList }: IGroupCardProps) {
  const { ldoIdUrl } = useLdoId();
  const { showMessage } = useMessage();
  const params = useParams();

  const [deleteGroup] = useMutation(DELETE_A_GROUP, {
    update(cache, { data }) {
      if ((data as { deleteGroup?: IResponse })?.deleteGroup) {
        cache.evict({ id: cache.identify({ __typename: 'Group', _id: group._id }) });
        cache.gc();
      }
    },
  });

  const [updateGroup] = useMutation(UPDATE_GROUP, {
    update(cache, { data }) {
      const result = data as { updateGroup?: { active?: boolean; division?: string } };
      if (result?.updateGroup) {
        cache.modify({
          id: cache.identify({ __typename: 'Group', _id: group._id }),
          fields: {
            active(existingValue) {
              return result.updateGroup!.active ?? existingValue;
            },
            division(existingValue) {
              return result.updateGroup!.division ?? existingValue;
            },
          },
        });
      }
    },
  });

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const toggleActionMenu = useCallback(() => {
    setIsActionMenuOpen((prev) => !prev);
  }, []);

  const handleStatusToggle = useCallback(async () => {
    try {
      setIsLoading(true);
      await updateGroup({
        variables: {
          updateInput: {
            _id: group._id,
            active: !group.active,
          },
        },
      });
    } catch (error: any) {
      console.error('Error toggling group status:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [group._id, group.active, updateGroup, setIsLoading]);

  const handleDivisionChange = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    const selectElement = e.target as HTMLSelectElement;
    setSelectedDivision(selectElement.value);
  }, []);

  const handleDeleteGroup = useCallback(async () => {
    try {
      setIsLoading(true);
      await deleteGroup({
        variables: { groupId: group._id },
      });
    } catch (error: any) {
      console.error('Error deleting group:', error);
      handleError({ error, showMessage });
    } finally {
      setIsLoading(false);
    }
  }, [group._id, deleteGroup, setIsLoading, showMessage]);

  const openMoveDialog = useCallback(() => {
    setIsActionMenuOpen(false);
    dialogRef.current?.showModal();
  }, []);

  const closeMoveDialog = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    dialogRef.current?.close();
  }, []);

  const handleMoveGroupSubmit = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    
    if (!selectedDivision) return;

    try {
      setIsLoading(true);
      await updateGroup({
        variables: {
          updateInput: {
            _id: group._id,
            division: selectedDivision,
          },
        },
      });
      dialogRef.current?.close();
    } catch (error: any) {
      console.error('Error moving group:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDivision, group._id, updateGroup, setIsLoading]);

  return (
    <motion.div
      className="border border-gray-200 border-gray-700 w-full bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 relative flex flex-col gap-6"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <GroupHeader groupName={group.name} onToggleMenu={toggleActionMenu} />
      
      <TeamList teams={group.teams} />
      
      <GroupStats teamCount={group.teams.length} isActive={group.active} />

      <ActionMenu
        isOpen={isActionMenuOpen}
        groupId={group._id}
        isActive={group.active}
        ldoIdUrl={ldoIdUrl}
        eventId={params?.eventId || ""}
        onEdit={toggleActionMenu}
        onMove={openMoveDialog}
        onToggleStatus={handleStatusToggle}
        onDelete={handleDeleteGroup}
      />

      <MoveDivisionDialog
        dialogRef={dialogRef}
        currentDivision={group.division}
        divisionList={divisionList}
        onDivisionChange={handleDivisionChange}
        onSubmit={handleMoveGroupSubmit}
        onClose={closeMoveDialog}
      />
    </motion.div>
  );
}

export default GroupCard;