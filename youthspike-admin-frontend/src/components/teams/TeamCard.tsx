import { useUser } from '@/lib/UserProvider';
import { EPlayerStatus, IEvent, IGroup, IOption, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import Link from 'next/link';
import React, { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { DELETE_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import { useRouter } from 'next/navigation';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import { cardHeight } from '@/utils/style';
import useClickOutside from '../../hooks/useClickOutside';
import SelectInput from '../elements/forms/SelectInput';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';
import { UPDATE_GROUP } from '@/graphql/group';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import TextImg from '../elements/TextImg';
import { useMutation } from '@apollo/client/react';

interface ITeamCardProps {
  eventId: string;
  team: ITeam;
  eventList: IEvent[];
  groupList: IGroup[];
  isChecked: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleCheckedTeam: (e: React.SyntheticEvent, teamId: string) => void;
  handleSendCredential: (e: React.SyntheticEvent, teamId: string) => void;
  refetchFunc?: () => void;
}

interface ITeamMove {
  event: string;
  division: string;
}

function TeamCard({ team, eventId, eventList, groupList, isChecked, setIsLoading, handleCheckedTeam, handleSendCredential, refetchFunc }: ITeamCardProps) {
  const user = useUser();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();

  const actionEl = useRef<null | HTMLUListElement>(null);
  const deleteEl = useRef<HTMLDialogElement | null>(null);

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [openMoveTeam, setOpenMoveTeam] = useState<boolean>(false);
  const [eventOptions, setEventOptions] = useState<IOption[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<IOption[]>([]);
  const [cardResponsiveH, setCardResponsiveH] = useState<CSSProperties>({ height: cardHeight });
  const [moveTeam, setMoveTeam] = useState<ITeamMove>({ event: '', division: '' });

  const [moveTeamMutation] = useMutation(UPDATE_TEAM);
  const [deleteTeam] = useMutation(DELETE_TEAM);
  const [updateGroup] = useMutation(UPDATE_GROUP);

  useClickOutside(actionEl, () => setActionOpen(false));

  // Common handlers
  const handleSelectChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setMoveTeam((prev) => ({ ...prev, [inputEl.name]: inputEl.value }));
  };

  const handleEventChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setMoveTeam((prev) => ({ ...prev, [inputEl.name]: inputEl.value }));

    if (!inputEl.value) {
      setDivisionOptions([]);
      return;
    }

    const findEvent = eventList.find((evt) => evt._id === inputEl.value);
    if (findEvent) {
      const divisions = findEvent.divisions
        .split(',')
        .filter((div) => div.trim().toLowerCase() !== '')
        .map((div, index) => ({
          id: index + 1,
          text: div.trim().toLowerCase(),
          value: div.trim(),
        }));
      setDivisionOptions(divisions);
    }
  };

  const toggleActionMenu = () => setActionOpen((prev) => !prev);
  const toggleMoveTeam = () => setOpenMoveTeam((prev) => !prev);

  const handleMenuAction = (e: React.SyntheticEvent, action: 'edit' | 'move' | 'send' | 'delete') => {
    e.preventDefault();
    setActionOpen(false);

    switch (action) {
      case 'edit':
        router.push(`/${eventId}/teams/${team._id}/update/${ldoIdUrl}`);
        break;
      case 'move':
        setOpenMoveTeam(true);
        break;
      case 'send':
        handleSendCredential(e, team._id);
        break;
      case 'delete':
        deleteEl.current?.showModal();
        break;
    }
  };

  const handleGroupChange = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    try {
      await updateGroup({
        variables: {
          updateInput: { _id: inputEl.value, teams: [team._id] },
          eventId,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleMoveTeam = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (moveTeam.event && moveTeam.division) {
        await moveTeamMutation({
          variables: { eventId, input: { division: moveTeam.division, event: moveTeam.event }, teamId: team._id },
        });
        if (refetchFunc) await refetchFunc();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (e: React.SyntheticEvent, teamId: string) => {
    e.preventDefault();
    try {
      await deleteTeam({ variables: { teamId } });
      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    }
  };

  // const playerCount = team?.players?.length || 0;
  const { activePlayers, inactivePlayers } = useMemo(() => {
    const active = [],
      inactive = [];
    for (let i = 0; i < team.players.length; i++) {
      const player = team.players[i];
      if (player.status === EPlayerStatus.ACTIVE) {
        active.push(player);
      } else {
        inactive.push(player);
      }
    }
    return { activePlayers: active, inactivePlayers: inactive };
  }, [team]);

  // Effects
  useEffect(() => {
    if (eventList?.length) {
      const options = eventList.map((e, index) => ({ id: index + 1, text: e.name, value: e._id }));
      setEventOptions(options);
    }
  }, [eventList]);

  useEffect(() => {
    setCardResponsiveH(openMoveTeam ? { minHeight: cardHeight } : { height: cardHeight });
  }, [openMoveTeam]);

  // Derived values
  const filteredGroups = groupList
    .filter((g) => g.division.trim().toUpperCase() === team.division.trim().toUpperCase())
    .map((g, index) => ({
      id: index + 1,
      value: g._id,
      text: g.name,
    }));

  const sendCredentialLabel = team.sendCredentials ? 'Resend' : 'Send';

  // Reusable components
  const TeamLogo = () =>
    team.logo ? (
      <CldImage crop="fit" width={64} height={64} src={team.logo} alt={team.name} className="w-8 h-8 object-cover rounded-lg" />
    ) : (
      <TextImg className="w-8 h-8 rounded-lg bg-yellow-logo" fullText={team.name} />
    );

  const CaptainAvatar = () =>
    team.captain?.profile ? (
      <CldImage crop="fit" width={40} height={40} src={team.captain.profile} alt={team.captain.firstName} className="w-8 h-8 rounded-full object-cover" />
    ) : (
      team.captain && <TextImg className="w-8 h-8 rounded-full bg-gray-600" fullText={team.captain.firstName + team.captain.lastName} />
    );

  const ActionMenu = () => (
    <AnimatePresence>
      {actionOpen && (
        <motion.ul
          ref={actionEl}
          className="absolute z-20 right-0 top-10 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden border border-gray-300 dark:border-gray-700"
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          <li>
            <Link href={`/${eventId}/teams/${team._id}/update/${ldoIdUrl}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
              <Image src="/icons/edit.svg" alt="Edit" width={16} height={16} className="svg-white" />
              <span className="text-sm">Edit</span>
            </Link>
          </li>

          <li
            onClick={(e) => {
              setActionOpen(false);
              setOpenMoveTeam(true);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <Image src="/icons/move.svg" alt="Move Team" width={16} height={16} className="svg-white" />
            <span className="text-sm">Move Team</span>
          </li>

          <li
            onClick={(e) => {
              setActionOpen(false);
              handleSendCredential(e, team._id);
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <Image src="/icons/send-email.svg" alt={`${sendCredentialLabel} Credential`} width={16} height={16} className={team.sendCredentials ? 'svg-green' : 'svg-white'} />
            <span className="text-sm">{sendCredentialLabel} Credential</span>
          </li>

          <li
            onClick={(e) => {
              setActionOpen(false);
              deleteEl.current?.showModal();
            }}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-red-500 hover:text-red-400"
          >
            <Image src="/icons/delete.svg" alt="Delete" width={16} height={16} className="svg-white" />
            <span className="text-sm">Delete</span>
          </li>
        </motion.ul>
      )}
    </AnimatePresence>
  );

  const HeaderSection = () => (
    <div className="flex items-center justify-between mb-2 min-h-[2.5rem]">
      {/* Left: Checkbox and Team Number */}
      <div className="flex items-center gap-3 flex-1">
        <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={handleCheckedTeam} />
        <span className="bg-yellow-logo text-black text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center">{team.num}</span>
      </div>

      {/* Center: Players Count */}
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col md:flew-row items-center justify-center text-sm text-gray-300 bg-gray-700 px-3 py-1.5 rounded-lg">
          <span className="mr-2">Players:</span>
          <span className="font-medium">
            {activePlayers.length} / {activePlayers.length + inactivePlayers.length}
          </span>
        </div>
      </div>

      {/* Right: Actions and Preview */}
      <div className="flex items-center justify-end gap-3 flex-1">
        <button onClick={(e) => handleSendCredential(e, team._id)} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors" aria-label={`${sendCredentialLabel} Credential`}>
          <Image
            src="/icons/send-email.svg"
            alt="Send Email"
            width={18}
            height={18}
            className={`${team.sendCredentials ? 'svg-green' : 'svg-white'} opacity-80 hover:opacity-100 transition-opacity`}
          />
        </button>

        <Link href={`/teams/${team._id}/roster/${ldoIdUrl}`}>
          <button className="btn-info">Preview</button>
        </Link>

        <div className="relative">
          <button onClick={toggleActionMenu} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" aria-label="Team options">
            <Image width={16} height={16} src="/icons/dots-vertical.svg" alt="Options" className="svg-white" />
          </button>
          <ActionMenu />
        </div>
      </div>
    </div>
  );

  const TeamInfoSection = () => (
    <div className="flex items-center gap-4 mb-2">
      <TeamLogo />
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-semibold text-white truncate">{team.name}</h3>
        <div className="mt-1">
          <SelectInput name="group" optionList={filteredGroups} handleSelect={handleGroupChange} defaultValue={team.group?.toString() || ''} />
        </div>
      </div>
    </div>
  );

  const CaptainSection = () =>
    team.captain && (
      <div className="flex items-center gap-3">
        <CaptainAvatar />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-white truncate">
            {team.captain.firstName} {team.captain.lastName}
          </h4>
          <div className="w-full flex items-center gap-x-2 flex-wrap">
            <p className="text-xs text-gray-400 truncate">@{team.captain.username}</p>
            <div className="border border-l border-yellow-logo h-6"></div>
            {team?.captain?.email && <p className="text-xs text-gray-400 truncate">{team.captain.email}</p>}
          </div>
        </div>
      </div>
    );

  const MoveTeamSection = () =>
    openMoveTeam &&
    user?.info &&
    (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
      <div className="border-t border-gray-700 bg-gray-750 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white">Move Team to Another Event</h4>
            <button type="button" className="text-gray-400 hover:text-white transition-colors" onClick={toggleMoveTeam}>
              <Image width={20} height={20} src="/icons/close.svg" alt="close-button" className="svg-white" />
            </button>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleMoveTeam}>
            <SelectInput handleSelect={handleEventChange} name="event" optionList={eventOptions} />
            <SelectInput handleSelect={handleSelectChange} name="division" optionList={divisionOptions} />
            <button className="btn-info w-full md:w-auto px-6 py-2" type="submit">
              Move Team
            </button>
          </form>
        </div>
      </div>
    );

  return (
    <div className="team-card w-full bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
      {/* Mobile Layout */}
      <div className="lg:hidden p-2">
        <HeaderSection />
        <TeamInfoSection />
        <CaptainSection />
      </div>

      {/* Desktop Layout */}
      <div className="w-full hidden md:flex flex-col p-2 items-center justify-between">
        <div className="top-section w-full flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-x-2">
            <div className="flex flex-col  items-center gap-y-2">
              <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={handleCheckedTeam} />
              <span className="bg-yellow-logo text-black font-bold rounded-full text-sm h-8 w-8 text-center flex justify-center items-center">{team.num}</span>
            </div>

            <div className="flex gap-x-2 items-center">
              {team.logo ? (
                <CldImage crop="fit" width={64} height={64} src={team.logo} alt={team.name} className="h-16" />
              ) : (
                <TextImg className="w-16 h-16 rounded-lg bg-yellow-logo" fullText={team.name} />
              )}
              <div className="">
                <h3 className="text-xl font-semibold text-white truncate mb-2">{team.name}</h3>
                <div className="w-full md:w-4/6">
                  <SelectInput name="group" optionList={filteredGroups} handleSelect={handleGroupChange} defaultValue={team.group?.toString() || ''} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          {team?.captain && (
            <div className="flex items-center gap-x-2">
              {team.captain.profile ? (
                <div className="w-12 h-12 rounded-full border border-yellow-400 overflow-hidden flex-shrink-0">
                  <CldImage crop="fit" width={48} height={48} src={team.captain.profile} alt={team.captain.firstName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full border border-yellow-400 flex items-center justify-center bg-gray-600 flex-shrink-0">
                  <Image src="/icons/sports-man.svg" width={28} height={28} alt="Captain" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white truncate">
                  <span>
                    {team.captain.firstName} {team.captain.lastName}
                  </span>
                  <span className="text-xs text-gray-400 uppercase mx-2">(Captain)</span>
                </h4>
                <p className="text-xs text-gray-400 truncate">@{team.captain.username}</p>
                {team?.captain?.email && <p className="text-xs text-gray-400 truncate">{team.captain.email}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="w-full flex items-center justify-end gap-2">
          <Link href={`/teams/${team._id}/roster/${ldoIdUrl}`}>
            <button className="btn-info">Preview</button>
          </Link>
          <div className="flex items-center text-sm text-gray-300">
            <span className="mr-2">Players:</span>
            <span className="bg-gray-700 px-3 py-1 rounded-lg font-medium">
              {activePlayers.length} / {activePlayers.length + inactivePlayers.length}
            </span>
          </div>
          <Image
            onClick={(e) => handleSendCredential(e, team._id)}
            src="/icons/send-email.svg"
            alt="Send Email"
            width={24}
            height={24}
            className={`cursor-pointer ${team.sendCredentials ? 'svg-green' : 'svg-white'} opacity-80 hover:opacity-100 transition-opacity`}
          />

          <div className="relative">
            <button onClick={toggleActionMenu} className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors" aria-label="Options">
              <Image width={20} height={20} src="/icons/dots-vertical.svg" alt="options" className="svg-white" />
            </button>
            <ActionMenu />
          </div>
        </div>
      </div>

      <MoveTeamSection />
      <DeleteConfirmDialog deleteEl={deleteEl} handleDeleteTeam={handleDeleteTeam} team={team} />
    </div>
  );
}

export default TeamCard;
