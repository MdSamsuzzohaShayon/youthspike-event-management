import { useUser } from '@/lib/UserProvider';
import { IEvent, IGroup, IOption, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import Link from 'next/link';
import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import { useRouter } from 'next/navigation';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import { cardHeight, imgSize } from '@/utils/style';
import useClickOutside from '../../hooks/useClickOutside';
import SelectInput from '../elements/forms/SelectInput';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';
import { UPDATE_GROUP } from '@/graphql/group';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import TextImg from '../elements/TextImg';

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

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [openMoveTeam, setOpenMoveTeam] = useState<boolean>(false);
  const [eventOptions, setEventOptions] = useState<IOption[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<IOption[]>([]);
  const [cardResponsiveH, setCardResponsiveH] = useState<CSSProperties>({ height: cardHeight });
  const deleteEl = useRef<HTMLDialogElement | null>(null);

  const [moveTeam, setMoveTeam] = useState<ITeamMove>({ event: '', division: '' });
  const [moveTeamMutation] = useMutation(UPDATE_TEAM);
  const [deleteTeam] = useMutation(DELETE_TEAM);
  const [updateGroup] = useMutation(UPDATE_GROUP);

  useClickOutside(actionEl, () => {
    setActionOpen(false);
  });

  /**
   * Handle Events
   */
  const selectEventInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setMoveTeam((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    if (inputEl.value === '') {
      setDivisionOptions([]);
    } else {
      const findEvent = eventList.find((evt) => evt._id === inputEl.value);
      if (findEvent) {
        console.log(findEvent);
        const divs = findEvent.divisions.split(',');
        const dl: IOption[] = [];
        for (let i = 0; i < divs.length; i += 1) {
          if (divs[i].trim().toLowerCase() !== '') {
            dl.push({ id: i + 1, text: divs[i].trim().toLowerCase(), value: divs[i].trim() });
          }
        }
        setDivisionOptions(dl);
      }
    }
  };

  const selectInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLSelectElement;
    setMoveTeam((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
  };

  // eslint-disable-next-line no-unused-vars
  const handleOpenMoveTeam = (e: React.SyntheticEvent, teamId: string) => {
    e.preventDefault();
    // Fetch team by team Id
    setActionOpen((prevState) => !prevState);
    setOpenMoveTeam((prevState) => !prevState);
  };

  const handleEditTeam = (e: React.SyntheticEvent, teamId: string) => {
    e.preventDefault();
    // Fetch team by team Id
    router.push(`/${eventId}/teams/${teamId}/update/${ldoIdUrl}`);
  };

  const handleDeleteTeam = async (e: React.SyntheticEvent, teamId: string) => {
    e.preventDefault();
    try {
      const dRes = await deleteTeam({ variables: { teamId } });

      if (refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    }
  };

  const handleMoveTeam = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      if (moveTeam.event === '' || moveTeam.division === '') {
        console.log(moveTeam);
      } else {
        const moveTeamRes = await moveTeamMutation({ variables: { eventId, input: { division: moveTeam.division, event: moveTeam.event }, teamId: team._id } });
        console.log(moveTeamRes);
        if (refetchFunc) await refetchFunc();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupChange = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const inputEl = e.target as HTMLInputElement;
      // updateGroup
      // Just input will be teamId
      const groupRes = await updateGroup({
        variables: {
          updateInput: { _id: inputEl.value, teams: [team._id] },
          eventId,
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (eventList && eventList.length > 0) {
      const newEventList = eventList.map((e, eI) => ({ id: eI + 1, text: e.name, value: e._id }));
      setEventOptions(newEventList);
    }
  }, [eventList]);

  useEffect(() => {
    setCardResponsiveH(openMoveTeam ? { minHeight: cardHeight } : { height: cardHeight });
  }, [openMoveTeam]);

  return (
    <div className="team-card w-full bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700 overflow-hidden">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="p-4">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={handleCheckedTeam} />
              <span className="bg-yellow-400 text-black font-bold rounded-full px-3 py-1 text-xs min-w-[2rem] text-center">{team.num}</span>
            </div>

            {/* Action Menu */}
            <div className="relative">
              <button
                onClick={() => setActionOpen((prev) => !prev)}
                className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                aria-label="Options"
              >
                <Image width={16} height={16} src="/icons/dots-vertical.svg" alt="options" className="svg-white" />
              </button>

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
                    <li onClick={(e) => handleEditTeam(e, team._id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                      <Image className="svg-white" src="/icons/edit.svg" alt="Edit" width={16} height={16} />
                      <span className="text-sm">Edit</span>
                    </li>
                    <li onClick={(e) => handleOpenMoveTeam(e, team._id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                      <Image className="svg-white" src="/icons/move.svg" alt="Move" width={16} height={16} />
                      <span className="text-sm">Move Team</span>
                    </li>
                    <li onClick={(e) => handleSendCredential(e, team._id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                      <Image src="/icons/send-email.svg" alt="Send" className={`${team.sendCredentials ? 'svg-green' : 'svg-white'}`} width={16} height={16} />
                      <span className="text-sm">{team.sendCredentials ? 'Resend' : 'Send'} Credential</span>
                    </li>
                    <li
                      onClick={(e) => deleteEl.current?.showModal()}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-red-500 hover:text-red-400"
                    >
                      <Image className="svg-white" src="/icons/delete.svg" alt="Delete" width={16} height={16} />
                      <span className="text-sm">Delete</span>
                    </li>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Team Info Section */}
          <div className="flex items-center gap-4 mb-4">
            {team.logo ? (
              <CldImage width={64} height={64} src={team.logo} alt={team.name} className="w-16 object-fit" />
            ) : (
              <TextImg className="w-16 h-16 rounded-lg bg-yellow-logo" fullText={team.name} />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{team.name}</h3>
              <div className="mt-1">
                <SelectInput
                  name="group"
                  optionList={groupList
                    .filter((g) => g.division.trim().toUpperCase() === team.division.trim().toUpperCase())
                    .map((g, gI) => ({
                      id: gI + 1,
                      value: g._id,
                      text: g.name,
                    }))}
                  handleSelect={handleGroupChange}
                  defaultValue={team.group ? team.group.toString() : ''}
                />
              </div>
            </div>
          </div>

          {/* Captain Section */}
          {team?.captain && (
            <div className="mb-4 p-3 bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 uppercase mb-2">Captain</p>
              <div className="flex items-center gap-3">
                {team?.captain?.profile ? (
                  <CldImage width={40} height={40} src={team.captain.profile} alt={team.captain.firstName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <TextImg className="w-10 h-10 rounded-full bg-gray-600" fullText={team?.captain.firstName + team?.captain.lastName} />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {team.captain.firstName} {team.captain.lastName}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">@{team.captain.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/${eventId}/teams/${team._id}/${ldoIdUrl}`}>
                <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-yellow-400/10 transition-colors">Preview</button>
              </Link>
              <div className="flex items-center text-sm text-gray-300">
                <span className="mr-2">Players:</span>
                <span className="bg-gray-700 px-2 py-1 rounded-lg font-medium">{team?.players?.length || 0}</span>
              </div>
            </div>
            <Image
              onClick={(e) => handleSendCredential(e, team._id)}
              src="/icons/send-email.svg"
              alt="Send Email"
              width={20}
              height={20}
              className={`cursor-pointer ${team.sendCredentials ? 'svg-green' : 'svg-white'} opacity-80 hover:opacity-100 transition-opacity`}
            />
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block p-6">
        <div className="flex items-center justify-between">
          {/* Left Section - Checkbox, Number, Team Info */}
          <div className="flex items-center gap-6 flex-1">
            <div className="flex items-center gap-4">
              <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={handleCheckedTeam} />
              <span className="bg-yellow-400 text-black font-bold rounded-full px-3 py-1 text-sm min-w-[2.5rem] text-center">{team.num}</span>
            </div>

            {/* Team Logo and Name */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {team.logo ? <CldImage width={64} height={64} src={team.logo} alt={team.name} className="h-16" /> : <TextImg className="w-16 h-16 rounded-lg bg-yellow-logo" fullText={team.name} />}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-white truncate mb-2">{team.name}</h3>
                <div className="w-48">
                  <SelectInput
                    name="group"
                    optionList={groupList
                      .filter((g) => g.division.trim().toUpperCase() === team.division.trim().toUpperCase())
                      .map((g, gI) => ({
                        id: gI + 1,
                        value: g._id,
                        text: g.name,
                      }))}
                    handleSelect={handleGroupChange}
                    defaultValue={team.group ? team.group.toString() : ''}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section - Captain Info */}
          {team.captain && (
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                {team.captain.profile ? (
                  <div className="w-12 h-12 rounded-full border border-yellow-400 overflow-hidden flex-shrink-0">
                    <CldImage width={48} height={48} src={team.captain.profile} alt={team.captain.firstName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full border border-yellow-400 flex items-center justify-center bg-gray-600 flex-shrink-0">
                    <Image src="/icons/sports-man.svg" width={28} height={28} alt="Captain" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 uppercase">Captain</p>
                  <h4 className="text-sm font-semibold text-white truncate">
                    {team.captain.firstName} {team.captain.lastName}
                  </h4>
                  <p className="text-xs text-gray-400 truncate">@{team.captain.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Right Section - Actions and Stats */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-2">
              <Link href={`/${eventId}/teams/${team._id}/${ldoIdUrl}`}>
                <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-yellow-400/10 transition-colors">Preview Team</button>
              </Link>
              <div className="flex items-center text-sm text-gray-300">
                <span className="mr-2">Active Players:</span>
                <span className="bg-gray-700 px-3 py-1 rounded-lg font-medium">{team?.players?.length || 0}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Image
                onClick={(e) => handleSendCredential(e, team._id)}
                src="/icons/send-email.svg"
                alt="Send Email"
                width={24}
                height={24}
                className={`cursor-pointer ${team.sendCredentials ? 'svg-green' : 'svg-white'} opacity-80 hover:opacity-100 transition-opacity`}
              />

              <div className="relative">
                <button
                  onClick={() => setActionOpen((prev) => !prev)}
                  className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
                  aria-label="Options"
                >
                  <Image width={20} height={20} src="/icons/dots-vertical.svg" alt="options" className="svg-white" />
                </button>

                <AnimatePresence>
                  {actionOpen && (
                    <motion.ul
                      ref={actionEl}
                      className="absolute z-20 right-0 top-12 w-56 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden border border-gray-300 dark:border-gray-700"
                      variants={menuVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                    >
                      <li onClick={(e) => handleEditTeam(e, team._id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                        <Image className="svg-white" src="/icons/edit.svg" alt="Edit" width={18} height={18} />
                        <span>Edit</span>
                      </li>
                      <li onClick={(e) => handleOpenMoveTeam(e, team._id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                        <Image className="svg-white" src="/icons/move.svg" alt="Move" width={18} height={18} />
                        <span>Move Team</span>
                      </li>
                      <li onClick={(e) => handleSendCredential(e, team._id)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                        <Image src="/icons/send-email.svg" alt="Send" className={`${team.sendCredentials ? 'svg-green' : 'svg-white'}`} width={18} height={18} />
                        <span>{team.sendCredentials ? 'Resend' : 'Send'} Credential</span>
                      </li>
                      <li
                        onClick={(e) => deleteEl.current?.showModal()}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-red-500 hover:text-red-400"
                      >
                        <Image className="svg-white" src="/icons/delete.svg" alt="Delete" width={18} height={18} />
                        <span>Delete Team</span>
                      </li>
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Move Team Section */}
      {openMoveTeam && user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
        <div className="border-t border-gray-700 bg-gray-750 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Move Team to Another Event</h4>
              <button type="button" className="text-gray-400 hover:text-white transition-colors" onClick={() => setOpenMoveTeam(false)}>
                <Image width={20} height={20} src="/icons/close.svg" alt="close-button" className="svg-white" />
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleMoveTeam}>
              <div className="md:col-span-1">
                <SelectInput handleSelect={selectEventInputChange} name="event" optionList={eventOptions} />
              </div>
              <div className="md:col-span-1">
                <SelectInput handleSelect={selectInputChange} name="division" optionList={divisionOptions} />
              </div>
              <div className="md:col-span-1">
                <button className="btn-info w-full md:w-auto px-6 py-2" type="submit">
                  Move Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmDialog deleteEl={deleteEl} handleDeleteTeam={handleDeleteTeam} team={team} />
    </div>
  );
}

export default TeamCard;
