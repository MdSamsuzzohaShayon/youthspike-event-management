import { EPlayerStatus, IBadge, IEmailcontent, IGroup, ITeam, TUpdateGroup, TUpdateTeam, UserRole } from '@/types';
import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import SelectInput from '../elements/forms/SelectInput';
import CheckboxInput from '../elements/forms/CheckboxInput';
import { useLdoId } from '@/lib/LdoProvider';
import { UPDATE_GROUP } from '@/graphql/group';
import TextImg from '../elements/TextImg';
import { useMutation } from '@apollo/client/react';
import { checkGroupIsWithinTheEvent } from '@/utils/helper';
import routerService from '@/lib/router-service';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';
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
  onBulkAbsenceMatchOpen: (e: React.SyntheticEvent, team: ITeam) => void;
}

/* ============================================================================
 * Design tokens — shared Tailwind class strings.
 * Utility order convention used everywhere:
 *   layout → sizing → spacing → typography → color → borders →
 *   effects → motion → accessibility
 * ========================================================================== */

/** Accessible focus ring shared by every interactive element on the card. */
const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';

/** Card surface: layered dark gradient, hairline border, hover elevation. */
const CARD_SHELL = [
  'team-card relative w-full rounded-2xl border border-gray-700/70',
  'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
  'shadow-lg transition-all duration-300',
  'hover:border-yellow-400/30 hover:shadow-xl hover:shadow-yellow-400/10',
  'motion-safe:hover:-translate-y-0.5',
].join(' ');

/** Soft gradient divider between card sections. */
const HAIRLINE_DIVIDER =
  'h-px w-full bg-gradient-to-r from-transparent via-gray-600/50 to-transparent';

/** Small yellow accent pill (captain tag). */
const ACCENT_PILL =
  'inline-flex items-center rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-yellow-400 ring-1 ring-yellow-400/30';

type TeamPlayers = NonNullable<ITeam['players']>;

function TeamCard({ team, eventId, groupList, isChecked, emailcontents, badge, badges, onCheckedTeam, onSendCredential,
  onUpdateTeam, onMoveTeamOpen, onDeleteTeamOpen, onBulkAbsenceMatchOpen }: ITeamCardProps) {
  // Hooks ---------------------------------------------------------------------
  const { ldoIdUrl } = useLdoId();
  const user = useUser();

  const [mutateGroup] = useMutation(UPDATE_GROUP);

  // References ----------------------------------------------------------------
  const actionEl = useRef<null | HTMLUListElement>(null);
  const [actionOpen, setActionOpen] = useState<boolean>(false);

  // Local state ---------------------------------------------------------------
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const toggleActionMenu = () => setActionOpen((prev) => !prev);
  const closeActionMenu = () => setActionOpen(false);

  const onGroupChange = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    let newGroupId = inputEl.value || null;

    const groupSetOfEvent = new Set(groupList.map(g => g._id));
    const groupId = checkGroupIsWithinTheEvent(groupSetOfEvent, (team?.groups || []) as unknown as string[]);
    if (!newGroupId) {
      // Optimistic UI update
      setSelectedGroup(null);
      newGroupId = groupId;
    } else {
      setSelectedGroup(newGroupId);
    }

    if (!newGroupId) {
      console.error('Not able to remove team from the group, because there are no groups available');
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
      // Rollback on error
      setSelectedGroup(groupId);
    }
  };

  // Menu handlers — every action also closes the dropdown ----------------------
  const handleCheckedTeam = (e: React.SyntheticEvent, teamId: string) => {
    onCheckedTeam(e, teamId);
    closeActionMenu();
  };

  const handleSendCredential = (e: React.SyntheticEvent, teamId: string) => {
    onSendCredential(e, teamId);
    closeActionMenu();
  };

  const handleMoveTeamOpen = (e: React.SyntheticEvent, team: ITeam) => {
    onMoveTeamOpen(e, team);
    closeActionMenu();
  };

  const handleDeleteTeamOpen = (e: React.SyntheticEvent, team: ITeam) => {
    onDeleteTeamOpen(e, team);
    closeActionMenu();
  };

  const handleBulkAbsenceMatchOpen = (e: React.SyntheticEvent, team: ITeam) => {
    onBulkAbsenceMatchOpen(e, team);
    closeActionMenu();
  };

  const onTeamRedirect = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (eventId) {
      SessionStorageService.setItem(CURRENT_EVENT, eventId);
    }
    routerService.push(`/teams/${team._id}/roster/${ldoIdUrl}`);
  };

  const handleBadgeChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    onUpdateTeam(e, { badge: inputEl.value }, team._id);
  };

  // Derived data ----------------------------------------------------------------
  const canManageBadges = user.info?.role === UserRole.admin || user.info?.role === UserRole.director;

  // Memoization -------------------------------------------------------------
  const { activePlayers, inactivePlayers } = useMemo(() => {
    const active: TeamPlayers = [];
    const inactive: TeamPlayers = [];
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
    return groupList
      .filter((g) => g?.division?.trim()?.toLowerCase() === team?.division?.trim()?.toLowerCase())
      .map((g, i) => ({ id: i + 1, text: g.name, value: g._id }));
  }, [groupList, team]);

  useEffect(() => {
    const groupSetOfEvent = new Set(groupList.map(g => g._id));
    const groupId = checkGroupIsWithinTheEvent(groupSetOfEvent, (team?.groups || []) as unknown as string[]);
    setSelectedGroup(groupId);
  }, [team.groups, groupList]);

  const playerCount = activePlayers.length + inactivePlayers.length;
  const sendCredentialLabel = team.sendCredentials ? 'Resend' : 'Send';

  return (
    <div className={CARD_SHELL}>
      {/* Decorative layer — corner glow + gradient top edge (purely visual) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
      </div>

      {/* ============================== MOBILE ============================== */}
      <div className="relative z-10 p-4 md:hidden">
        <div className="space-y-3">
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
            onCloseActionMenu={closeActionMenu}
            onTeamRedirect={onTeamRedirect}
            onBulkAbsenceMatchOpen={handleBulkAbsenceMatchOpen}
          />
          <TeamInfoSection
            team={team}
            groupOptions={groupOptions}
            selectedGroup={selectedGroup}
            onGroupChange={onGroupChange}
          />
          {team.captain && <TeamCardCaptainSection captain={team.captain} />}
          {canManageBadges && badges.length > 0 && (
            <BadgeSelect
              name="badge"
              className="w-full"
              value={badge?._id}
              badges={badges || []}
              onChange={handleBadgeChange}
            />
          )}
        </div>
      </div>

      {/* ============================== DESKTOP ============================= */}
      <div className="relative z-10 hidden w-full flex-col p-4 md:flex md:p-5">
        {/* Top — identity + captain */}
        <div className="top-section flex w-full items-center justify-between gap-4">
          {/* Left: selection, team number, logo, name */}
          <div className="flex min-w-0 items-center gap-x-3">
            <div className="flex flex-col items-center gap-y-2 border-r border-gray-700/70 pr-3">
              <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={onCheckedTeam} />
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-sm font-bold text-gray-900 shadow-[0_0_14px_rgba(250,204,21,0.35)] ring-2 ring-yellow-400/20">
                {team.num}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-x-3">
              {team.logo ? (
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-900/60 ring-1 ring-yellow-400/20 transition-all duration-300 group-hover:ring-yellow-400/40">
                  <CldImage
                    crop="fit"
                    width={64}
                    height={64}
                    src={team.logo}
                    alt={`${team.name} logo`}
                    className="h-16 w-16 object-cover"
                  />
                </div>
              ) : (
                <TextImg
                  className="h-16 w-16 flex-shrink-0 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-500"
                  fullText={team.name}
                />
              )}
              <h3 className="truncate text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-yellow-50">
                {team.name}
              </h3>
            </div>
          </div>

          {/* Right: captain identity */}
          {team?.captain && (
            <div className="flex flex-shrink-0 items-center gap-x-3">
              <div className="rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 p-[2px] shadow-[0_0_10px_rgba(250,204,21,0.25)]">
                {team.captain.profile ? (
                  <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-gray-900">
                    <CldImage
                      crop="fit"
                      width={48}
                      height={48}
                      src={team.captain.profile}
                      alt={`${team.captain.firstName} ${team.captain.lastName}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 ring-2 ring-gray-900">
                    <Image src="/icons/sports-man.svg" width={28} height={28} alt="" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="flex items-center gap-x-2 text-sm font-semibold text-white">
                  <span className="truncate">
                    {team.captain.firstName} {team.captain.lastName}
                  </span>
                  <span className={ACCENT_PILL}>Captain</span>
                </h4>
                <p className="truncate text-xs text-gray-400">@{team.captain.username}</p>
                {team?.captain?.email && <p className="truncate text-xs text-gray-500">{team.captain.email}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Section divider */}
        <div aria-hidden="true" className={`my-4 ${HAIRLINE_DIVIDER}`} />

        {/* Bottom — controls */}
        <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-4">
          {/* Group & badge assignment */}
          <div className="flex flex-col gap-y-2">
            <SelectInput
              className="w-full md:w-48"
              name="group"
              optionList={groupOptions}
              handleSelect={onGroupChange}
              value={selectedGroup}
            />
            {canManageBadges && badges.length > 0 && (
              <BadgeSelect
                name="badge"
                className="w-full md:w-48"
                value={badge?._id}
                badges={badges || []}
                onChange={handleBadgeChange}
              />
            )}
          </div>

          {/* Division + preview */}
          <div className="flex flex-col items-center gap-y-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-700/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-300 ring-1 ring-gray-600/60">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              Division: {team.division}
            </span>
            <Link
              href="#"
              onClick={onTeamRedirect}
              aria-label={`Preview ${team.name} roster`}
              className={'btn-info inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-sm font-semibold transition-transform duration-200 motion-safe:hover:scale-[1.03] ' + FOCUS_RING}
            >
              Preview
            </Link>
          </div>

          {/* Player count */}
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="font-medium">Players:</span>
            <span className="rounded-lg bg-gray-900/70 px-3 py-1 font-bold tabular-nums text-yellow-300 ring-1 ring-gray-600/50">
              {playerCount}
            </span>
          </div>

          {/* Email control */}
          <EmailControl
            team={team}
            emailcontents={emailcontents}
            sendCredentialLabel={sendCredentialLabel}
            onSendCredential={handleSendCredential}
          />

          {/* Action menu */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleActionMenu}
              aria-haspopup="menu"
              aria-expanded={actionOpen}
              aria-label={`${team.name} options`}
              className={
                'flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 ' +
                (actionOpen ? 'bg-gray-600 ring-2 ring-yellow-400/60' : 'bg-gray-700 hover:bg-gray-600') +
                ' ' + FOCUS_RING
              }
            >
              <Image width={20} height={20} src="/icons/dots-vertical.svg" alt="" className="svg-white" />
            </button>
            <ActionMenu
              team={team}
              eventId={eventId}
              ldoIdUrl={ldoIdUrl}
              actionOpen={actionOpen}
              actionEl={actionEl}
              sendCredentialLabel={sendCredentialLabel}
              onClose={closeActionMenu}
              onSendCredential={onSendCredential}
              onMoveTeamOpen={handleMoveTeamOpen}
              onDeleteTeamOpen={handleDeleteTeamOpen}
              onBulkAbsenceMatchOpen={handleBulkAbsenceMatchOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamCard;