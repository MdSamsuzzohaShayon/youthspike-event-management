import { EPlayerStatus, IBadge, IEmailcontent, IGroup, IOption, ITeam, TUpdateGroup, TUpdateTeam, UserRole } from '@/types';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import SelectInput from '../elements/forms/SelectInput';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';
import { UPDATE_GROUP } from '@/graphql/group';
import { AnimatePresence, motion } from 'motion/react';
import { menuVariants } from '@/utils/animation';
import TextImg from '../elements/TextImg';
import { useMutation } from '@apollo/client/react';
import { checkGroupIsWithinTheEvent, getLatestEmailContent } from '@/utils/helper';
import routerService from '@/lib/router-service';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';
import { UPDATE_TEAM } from '@/graphql/teams';
import { formatEmailSentTime, readDate } from '@/utils/datetime';
import BadgeSelect from '../elements/forms/BadgeSelect';
import TeamCardHeaderSection from './TeamCardHeaderSection';
import TeamInfoSection from './TeamInfoSection';
import TeamCardCaptainSection from './TeamCardCaptainSection';
import EmailControl from './EmailControl';
import ActionMenu from './ActionMenu';
import { useUser } from '@/lib/UserProvider';

interface ITeamCardProps {
  team: ITeam;
  eventId: string;
  groupList: IGroup[];
  isChecked: boolean;
  emailcontents?: IEmailcontent[];
  badge?: IBadge | null;
  badges: IBadge[];
  onSendCredential: (e: React.SyntheticEvent, teamId: string) => void;
  onUpdateTeam: (e: React.SyntheticEvent, update: Partial<TUpdateTeam>, teamId: string) => void;
  onCheckedTeam: (e: React.SyntheticEvent, teamId: string) => void;
  onMoveTeamOpen: (e: React.SyntheticEvent, team: ITeam) => void;
  onDeleteTeamOpen: (e: React.SyntheticEvent, team: ITeam) => void;
}



function TeamCard({ team, eventId, groupList, isChecked, emailcontents, badge, badges, onCheckedTeam, onSendCredential, onUpdateTeam, onMoveTeamOpen, onDeleteTeamOpen }: ITeamCardProps) {
  // Hooks
  const { ldoIdUrl } = useLdoId();
  const user = useUser();

  const [mutateGroup] = useMutation(UPDATE_GROUP);
  const [mutateTeam] = useMutation(UPDATE_TEAM);

  // References
  const actionEl = useRef<null | HTMLUListElement>(null);
  const [actionOpen, setActionOpen] = useState<boolean>(false);

  // Local State
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const toggleActionMenu = () => setActionOpen((prev) => !prev);


  const onGroupChange = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    let newGroupId = inputEl.value || null;

    const groupSetOfEvent = new Set(groupList.map(g => g._id));
    const groupId = checkGroupIsWithinTheEvent(groupSetOfEvent, (team?.groups || []) as unknown as string[]);
    if (!newGroupId) {
      // ✅ Update UI immediately
      setSelectedGroup(null);
      newGroupId = groupId;
    } else {
      setSelectedGroup(newGroupId);
    }

    if (!newGroupId) {
      console.error("Not able to remove team from the group, because there are no group available");

      return;
    }

    try {
      const updateInput: TUpdateGroup = { _id: newGroupId, teams: [team._id] };
      // removeteams
      if (!inputEl.value) {
        updateInput.removeteams = [team._id];
        delete updateInput.teams;
      }
      await mutateGroup({
        variables: {
          updateInput: updateInput,
          eventId,
        },
      });

    } catch (error) {
      console.error(error);

      // ❌ rollback on error

      setSelectedGroup(groupId);
    }
  };

  const handleCheckedTeam = (e: React.SyntheticEvent, teamId: string) => {
    onCheckedTeam(e, teamId);
    setActionOpen(false);
  }
  const handleSendCredential = (e: React.SyntheticEvent, teamId: string) => {
    onSendCredential(e, teamId);
    setActionOpen(false);
  }
  const handleMoveTeamOpen = (e: React.SyntheticEvent, team: ITeam) => {
    onMoveTeamOpen(e, team);
    setActionOpen(false);
  }
  const handleDeleteTeamOpen = (e: React.SyntheticEvent, team: ITeam) => {
    onDeleteTeamOpen(e, team);
    setActionOpen(false);
  }

  const onTeamRedirect = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (eventId) {
      SessionStorageService.setItem(CURRENT_EVENT, eventId);
    }
    routerService.push(`/teams/${team._id}/roster/${ldoIdUrl}`);
  }

  const handleBadgeChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    onUpdateTeam(e, { badge: inputEl.value }, team._id);
  }


  // Memoization
  const { activePlayers, inactivePlayers } = useMemo(() => {
    const active = [],
      inactive = [];
    for (let i = 0; i < (team?.players || []).length; i++) {
      const player = team.players[i];
      if (player.status === EPlayerStatus.ACTIVE) {
        active.push(player);
      } else {
        inactive.push(player);
      }
    }
    return { activePlayers: active, inactivePlayers: inactive };
  }, [team]);

  const groupOptions = useMemo(() => {
    return groupList.filter((g) => g?.division?.trim()?.toLowerCase() === team?.division?.trim()?.toLowerCase()).map((g, i) => ({ id: i + 1, text: g.name, value: g._id }));
  }, [groupList, team])

  const sendCredentialLabel = team.sendCredentials ? 'Resend' : 'Send';

  useEffect(() => {
    const groupSetOfEvent = new Set(groupList.map(g => g._id));
    const groupId = checkGroupIsWithinTheEvent(groupSetOfEvent, (team?.groups || []) as unknown as string[]);
    setSelectedGroup(groupId);
  }, [team.groups]);

  const playerCount = activePlayers.length + inactivePlayers.length;

  return (
    <div className="team-card w-full bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-700">
      {/* Mobile Layout */}
      <div className="md:hidden p-2">
        <TeamCardHeaderSection
          team={team}
          eventId={eventId}
          ldoIdUrl={ldoIdUrl}
          isChecked={isChecked}
          playerCount={playerCount}
          actionOpen={actionOpen}
          actionEl={actionEl}
          emailcontents={emailcontents}
          sendCredentialLabel={sendCredentialLabel}
          onCheckedTeam={handleCheckedTeam}
          onSendCredential={handleSendCredential}
          onMoveTeamOpen={handleMoveTeamOpen}
          onDeleteTeamOpen={handleDeleteTeamOpen}
          onToggleActionMenu={toggleActionMenu}
          onCloseActionMenu={() => setActionOpen(false)}
          onTeamRedirect={onTeamRedirect}
        />
        <TeamInfoSection
          team={team}
          groupOptions={groupOptions}
          selectedGroup={selectedGroup}
          onGroupChange={onGroupChange}
        />
        {team.captain && <TeamCardCaptainSection captain={team.captain} />}

        {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && (
          <BadgeSelect
            name="badge"
            className='w-48'
            value={badge?._id}
            badges={badges || []}
            onChange={handleBadgeChange}
          />
        )}
      </div>

      {/* Desktop Layout */}
      <div className="w-full hidden md:flex flex-col p-2 items-center justify-between">
        <div className="top-section w-full flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-x-2">
            <div className="flex flex-col  items-center gap-y-2">
              <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={onCheckedTeam} />
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
                  <SelectInput name="group" optionList={groupOptions} handleSelect={onGroupChange} value={selectedGroup} />
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
          <BadgeSelect
            name="badge"
            className='w-full md:w-48'
            value={badge?._id}
            badges={badges || []}
            onChange={handleBadgeChange}
          />
          <span className='uppercase'>Division: {team.division}</span>
          <Link href="#" onClick={onTeamRedirect}>
            <button className="btn-info">Preview</button>
          </Link>
          <div className="flex items-center text-sm text-gray-300">
            <span className="mr-2">Players:</span>
            <span className="bg-gray-700 px-3 py-1 rounded-lg font-medium">
              {playerCount}
            </span>
          </div>

          <EmailControl
            team={team}
            emailcontents={emailcontents}
            sendCredentialLabel={sendCredentialLabel}
            onSendCredential={handleSendCredential}
          />

          <div className="relative">
            <button onClick={toggleActionMenu} className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full hover:bg-gray-600 transition-colors" aria-label="Options">
              <Image width={20} height={20} src="/icons/dots-vertical.svg" alt="options" className="svg-white" />
            </button>
            <ActionMenu
              team={team}
              eventId={eventId}
              ldoIdUrl={ldoIdUrl}
              actionOpen={actionOpen}
              actionEl={actionEl}
              sendCredentialLabel={sendCredentialLabel}
              onClose={() => setActionOpen(false)}
              onSendCredential={onSendCredential}
              onMoveTeamOpen={handleMoveTeamOpen}
              onDeleteTeamOpen={handleDeleteTeamOpen}
            />
          </div>
        </div>
      </div>


    </div>
  );
}

export default TeamCard;
