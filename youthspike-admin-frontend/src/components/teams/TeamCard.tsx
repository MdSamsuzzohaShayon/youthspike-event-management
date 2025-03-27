import { useUser } from '@/lib/UserProvider';
import { IEvent, IGroup, IOption, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import Link from 'next/link';
import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_TEAM, UPDATE_TEAM } from '@/graphql/teams';
import { useRouter } from 'next/navigation';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import Image from 'next/image';
import { cardHeight, imgSize } from '@/utils/style';
import useClickOutside from '../../hooks/useClickOutside';
import SelectInput from '../elements/forms/SelectInput';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';
import { UPDATE_GROUP } from '@/graphql/group';
import { AnimatePresence, motion } from 'framer-motion';
import { menuVariants } from '@/utils/animation';

interface ITeamCardProps {
  eventId: string;
  team: ITeam;
  eventList: IEvent[];
  groupList: IGroup[];
  isChecked: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  handleCheckedTeam: (e: React.SyntheticEvent, teamId: string) => void;
  handleSendCredential: (e: React.SyntheticEvent, teamId: string) => void;
  fefetchFunc?: () => Promise<void>;
}

interface ITeamMove {
  event: string;
  division: string;
}

function TeamCard({ team, eventId, eventList, groupList, isChecked, setIsLoading, handleCheckedTeam, handleSendCredential, fefetchFunc }: ITeamCardProps) {
  

  const user = useUser();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();

  const actionEl = useRef<null | HTMLUListElement>(null);

  const [actionOpen, setActionOpen] = useState<boolean>(false);
  const [openMoveTeam, setOpenMoveTeam] = useState<boolean>(false);
  const [eventOptions, setEventOptions] = useState<IOption[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<IOption[]>([]);
  const [cardResponsiveH, setCardResponsiveH] = useState<CSSProperties>({ height: cardHeight });

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
            dl.push({ text: divs[i].trim().toLowerCase(), value: divs[i].trim() });
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
      console.log(dRes);

      if (fefetchFunc) await fefetchFunc();
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
        if (fefetchFunc) await fefetchFunc();
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
          eventId
        }
      });
    } catch (error) {
      console.log(error);

    }
  }


  useEffect(() => {
    if (eventList && eventList.length > 0) {
      const newEventList = eventList.map((e) => ({ text: e.name, value: e._id }));
      setEventOptions(newEventList);
    }
  }, [eventList]);

  useEffect(() => {
    setCardResponsiveH(openMoveTeam ? { minHeight: cardHeight } : { height: cardHeight });
  }, [openMoveTeam]);

  

  return (
    <div className="team-card w-full bg-gray-gradient rounded-lg shadow-lg p-5 transition duration-300 hover:shadow-xl">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 relative">
        {/* Action Menu */}
        {actionOpen && (
          <AnimatePresence>
            <motion.ul
              className="absolute z-10 right-16 top-48 md:right-6 md:top-12 w-48 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-md shadow-lg overflow-hidden"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
            >
              <li
                onClick={(e) => handleEditTeam(e, team._id)}
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Image className="svg-white" src="/icons/edit.svg" alt="Edit" width={16} height={16} /> Edit
              </li>
              <li
                onClick={(e) => handleOpenMoveTeam(e, team._id)}
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Image className="svg-white" src="/icons/move.svg" alt="Move" width={16} height={16} /> Move Team
              </li>
              <li
                onClick={(e) => handleSendCredential(e, team._id)}
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <Image src="/icons/send-email.svg" alt="Send" className={`${team.sendCredentials ? 'svg-green' : 'svg-white'}`} width={16} height={16} />{' '}
                {team.sendCredentials ? 'Resend' : 'Send'} Credential
              </li>
              <li
                onClick={(e) => handleDeleteTeam(e, team._id)}
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer text-red-500 hover:text-red-400"
              >
                <Image className="svg-white" src="/icons/delete.svg" alt="Delete" width={16} height={16} /> Delete
              </li>
            </motion.ul>
          </AnimatePresence>
        )}


        {/* Team Selection and Number */}
        <div className="flex flex-col items-center gap-2">
          <CheckboxInput
            _id={team._id}
            name="team-select"
            defaultValue={isChecked}
            handleInputChange={handleCheckedTeam}
          />
          <span className="bg-yellow-400 text-black font-bold rounded-full px-3 py-1 text-xs">
            {team.num}
          </span>
        </div>

        {/* Team Name and Logo */}
        <div className="flex justify-between items-center gap-4 w-full lg:w-2/3">
          <div></div>
          <div className="flex items-center gap-4">
            {team.logo ? (
              <div className="rounded-full overflow-hidden w-14 h-14 border border-yellow-400">
                <AdvancedImage cldImg={cld.image(team.logo)} alt={team.name} />
              </div>
            ) : (
              <Image
                src="/icons/sports-man.svg"
                width={56}
                height={56}
                alt="sports-man-logo"
                className="rounded-full border border-yellow-400"
              />
            )}
            <div className="flex flex-col text-center lg:text-left">
              <h3 className="text-lg font-semibold">{team.name}</h3>
              <SelectInput
                name="group"
                optionList={groupList.filter((g) => g.division.trim().toUpperCase() === team.division.trim().toUpperCase()).map((g) => ({
                  value: g._id,
                  text: g.name,
                }))}
                handleSelect={handleGroupChange}
                vertical
                defaultValue={team.group ? team.group.toString() : ''}
              />
            </div>
          </div>
          {/* Preview Link */}
          <Link href={`/${eventId}/teams/${team._id}/${ldoIdUrl}`}>
            <button className="text-yellow-400 hover:underline text-sm mt-1">Preview</button>
          </Link>
        </div>

        {/* Captain Info and Active Players */}
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
          {team.captain && (
            <div className="flex flex-col lg:flex-row items-center gap-3">
              {team.captain.profile ? (
                <div className="w-12 h-12 rounded-full border border-yellow-400 overflow-hidden">
                  <AdvancedImage cldImg={cld.image(team.captain.profile)} alt={team.captain.firstName} />
                </div>
              ) : (
                <Image
                  src="/icons/sports-man.svg"
                  width={48}
                  height={48}
                  alt="Captain"
                  className="rounded-full border border-yellow-400"
                />
              )}
              <div className="text-center lg:text-left">
                <p className="text-xs text-gray-400 uppercase">Captain</p>
                <h4 className="text-md font-semibold">
                  {team.captain.firstName} {team.captain.lastName}
                </h4>
              </div>
            </div>
          )}
          <p className="flex items-center text-sm mt-2 lg:mt-0">
            Active Players: <span className="bg-gray-700 px-2 py-1 rounded-lg ml-1">{team?.players?.length || 0}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 lg:mt-0 lg:pr-2">
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
          <Image
            onClick={(e) => handleSendCredential(e, team._id)}
            src="/icons/send-email.svg"
            alt="Send Email"
            width={20}
            height={20}
            className={`cursor-pointer ${team.sendCredentials ? 'svg-green' : 'svg-white'} opacity-80 hover:opacity-100`}
          />
        </div>
      </div>

      {/* Level-2: Moving component start */}
      {openMoveTeam && user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
        <div className="move-team w-full p-4 bg-gray-800 rounded-lg mt-4 flex flex-col items-start relative">
          <button type="button" className="absolute top-2 right-2 text-white" onClick={() => setOpenMoveTeam(false)}>
            <Image width={24} height={24} src="/icons/close.svg" alt="close-button" className="svg-white" />
          </button>
          <form className="w-full" onSubmit={handleMoveTeam}>
            <SelectInput handleSelect={selectEventInputChange} vertical name="event" optionList={eventOptions} />
            <SelectInput handleSelect={selectInputChange} vertical name="division" optionList={divisionOptions} />
            <button className="btn-info mt-4 w-full lg:w-auto" type="submit">
              Move
            </button>
          </form>
        </div>
      )}
      {/* Level-2: Moving component end */}
    </div>
  );
}

export default TeamCard;
