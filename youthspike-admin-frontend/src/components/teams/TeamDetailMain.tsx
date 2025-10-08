'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { IGetTeamDetailQuery, IMatchExpRel, INetRelatives, IPlayerExpRel, IPlayerRanking, IPlayerRankingExpRel, IRoundRelatives, ITeam } from '@/types';
import { QueryRef, useMutation, useReadQuery } from '@apollo/client';
import { UPDATE_TEAM } from '@/graphql/teams';
import sessionStorageService from '@/utils/SessionStorageService';
import { CldImage } from 'next-cloudinary';
import { EPlayerStatus, IPlayer } from '@/types/player';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import PlayerList from '../player/PlayerList';
import { useError } from '@/lib/ErrorProvider';
import MatchCard from '../match/MatchCard';
import Pagination from '../elements/Pagination';
import Link from 'next/link';
import TextImg from '../elements/TextImg';
import { useLdoId } from '@/lib/LdoProvider';
import { divisionsToOptionList } from '@/utils/helper';
import { DIVISION, TEAM } from '@/utils/constant';
import { FRONTEND_URL } from '@/utils/keys';

interface ITeamDetailMainProps {
  eventId: string;
  queryRef: QueryRef<{ getTeamDetails: IGetTeamDetailQuery }>;
}

enum ETab {
  ROSTER = 'ROSTER',
  MATCHES = 'MATCHES',
}

const ITEMS_PER_PAGE = 20;

function TeamDetailMain({ eventId, queryRef }: ITeamDetailMainProps) {
  const { setActErr } = useError();
  const { ldoIdUrl } = useLdoId();
  const { data } = useReadQuery(queryRef);

  // State
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [playerIdsToAdd, setPlayerIdsToAdd] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ETab>(ETab.ROSTER);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // GraphQL
  const [mutateTeam] = useMutation(UPDATE_TEAM);

  // Data extraction
  const { team, playerRanking, players, captain, cocaptain, event, matches, rankings, rounds, nets, teams } = data?.getTeamDetails?.data ?? {};

  // Memoized data processing
  const divisionList = useMemo(() => (event?.divisions ? divisionsToOptionList(event.divisions) : []), [event?.divisions]);

  const teamData = useMemo(
    () => ({
      ...team,
      captain,
      cocaptain,
    }),
    [team, captain, cocaptain],
  );

  const playerRankingData = useMemo(
    () => ({
      ...playerRanking,
      rankings,
    }),
    [playerRanking, rankings],
  );

  // Lookup maps
  const roundMap = useMemo(() => new Map(rounds?.map((r: IRoundRelatives) => [r._id, r]) || []), [rounds]);

  const netMap = useMemo(() => new Map(nets?.map((n: INetRelatives) => [n._id, n]) || []), [nets]);

  const opponentTeamMap = useMemo(() => new Map(teams?.map((t: ITeam) => [t._id, t]) || []), [teams]);

  // Process matches
  const matchList = useMemo(() => {
    if (!matches) return [];

    return matches
      .map((m: IMatchExpRel) => {
        const enrichedMatch: IMatchExpRel = {
          ...m,
          rounds: (m.rounds as (string | IRoundRelatives)[]).map((r) => (typeof r === 'string' ? roundMap.get(r) : r)).filter(Boolean) as IRoundRelatives[],
          nets: (m.nets as (string | INetRelatives)[]).map((n) => (typeof n === 'string' ? netMap.get(n) : n)).filter(Boolean) as INetRelatives[],
        };

        const opponentTeam = String(m.teamA) !== team._id ? opponentTeamMap.get(String(m.teamA)) : opponentTeamMap.get(String(m.teamB));

        if (!opponentTeam) {
          console.warn(`Match ${m._id} has no valid opponent team`);
          return null;
        }

        // Set teams based on opponent
        if (String(m.teamA) !== team._id) {
          enrichedMatch.teamA = opponentTeam;
          enrichedMatch.teamB = team;
        } else {
          enrichedMatch.teamB = opponentTeam;
          enrichedMatch.teamA = team;
        }

        return enrichedMatch;
      })
      .filter(Boolean) as IMatchExpRel[];
  }, [matches, roundMap, netMap, opponentTeamMap, team]);

  // Process players
  const { teamPlayers, unassignedPlayers } = useMemo(() => {
    const teamPlayers: IPlayerExpRel[] = [];
    const unassignedPlayers: IPlayerExpRel[] = [];

    players?.forEach((p) => {
      const playerObj = structuredClone(p);

      if (p.teams?.includes(teamData._id)) {
        // Simplify team assignments
        playerObj.teams = teamData._id ? [teamData._id] : [];
        // @ts-ignore
        playerObj.captainofteams = playerObj.captainofteams?.length ? [teamData._id] : [];
        // @ts-ignore
        playerObj.cocaptainofteams = playerObj.cocaptainofteams?.length ? [teamData._id] : [];

        teamPlayers.push(playerObj as IPlayerExpRel);
      } else {
        playerObj.teams = [];
        unassignedPlayers.push(playerObj as IPlayerExpRel);
      }
    });

    return { teamPlayers, unassignedPlayers };
  }, [players, teamData, teamData._id]);

  // Filter and sort players
  const activePlayers = useMemo(() => teamPlayers?.filter((p) => p.status === EPlayerStatus.ACTIVE) || [], [teamPlayers]);

  const inactivePlayers = useMemo(() => teamPlayers?.filter((p) => p.status !== EPlayerStatus.ACTIVE) || [], [teamPlayers]);

  const teamDivisionLower = useMemo(() => {
    const division = teamData.division?.trim().toLowerCase() || '';
    sessionStorageService.setItem(DIVISION, division);
    return division;
  }, [teamData.division]);

  const divisionalPlayers = useMemo(
    () =>
      unassignedPlayers
        ?.filter((p) => p.division?.trim().toLowerCase() === teamDivisionLower)
        .sort((a, b) => {
          const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
          return lastNameCompare !== 0 ? lastNameCompare : (a.firstName || '').localeCompare(b.firstName || '');
        }) || [],
    [unassignedPlayers, teamDivisionLower],
  );

  const paginatedMatchList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return matchList.slice(start, start + ITEMS_PER_PAGE);
  }, [matchList, currentPage]);

  // Event handlers
  const handleSelectGroup = useCallback((e: React.SyntheticEvent, tab: ETab) => {
    e.preventDefault();
    if (tab === ETab.ROSTER) window.location.reload();
    setSelectedItem(tab);
  }, []);

  const handleAddPlayersToTeam = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      try {
        await mutateTeam({
          variables: {
            input: { players: Array.from(playerIdsToAdd) },
            teamId: team._id,
            eventId: event._id,
          },
        });
        window.location.reload();
      } catch (error) {
        setActErr({ message: (error as Error)?.message || '', success: false });
      }
    },
    [playerIdsToAdd, team._id, event._id, mutateTeam, setActErr],
  );

  const handleCheckboxChange = useCallback((pId: string, isChecked: boolean) => {
    setPlayerIdsToAdd((prev) => {
      const newSet = new Set(prev);
      isChecked ? newSet.add(pId) : newSet.delete(pId);
      return newSet;
    });
  }, []);

  const refetchFunc = useCallback(() => window.location.reload(), []);
  const handleSelectMatch = useCallback(() => {}, []);

  useEffect(() => {
    if (team?._id) sessionStorageService.setItem(TEAM, team._id);
  }, [team?._id]);

  // Reusable components
  const TeamLogo = () =>
    team?.logo ? (
      <CldImage crop="fit" width={32} height={32} src={team.logo} alt="Team logo" className="w-8 h-8 object-cover flex-shrink-0" />
    ) : (
      <TextImg className="w-8 h-8 flex-shrink-0" fullText={team?.name || ''} txtCls="text-sm font-bold" />
    );

  const StatItem = ({ label, value }: { label: string; value: number }) => (
    <div className="text-right">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-white font-bold text-sm">{value}</div>
    </div>
  );

  const TabButton = ({ tab, label }: { tab: ETab; label: string }) => (
    <button
      onClick={(e) => handleSelectGroup(e, tab)}
      className={`flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all ${selectedItem === tab ? 'bg-yellow-400 text-gray-900 shadow-sm' : 'text-gray-300 hover:text-white'}`}
    >
      {label}
    </button>
  );

  const ActionLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all text-yellow-logo underline text-center uppercase">
      {children}
    </Link>
  );

  const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      {action}
    </div>
  );

  // Main render sections
  const HeaderSection = () => (
    <div className="header bg-gray-800 rounded-xl">
      <div className="border-b border-yellow-500/30 px-3 py-2 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamLogo />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate leading-tight">{team?.name}</h1>
              <p className="text-xs text-gray-400 truncate leading-tight">{event?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatItem label="Players" value={activePlayers.length} />
            <StatItem label="Matches" value={matchList.length} />
          </div>
        </div>
      </div>

      <div className="border-b border-yellow-500/30 px-3 py-1">
        <div className="flex rounded-lg p-1">
          <ActionLink href={`/${eventId}/${ldoIdUrl}`}>Standings</ActionLink>
          {/* <ActionLink
            href={`/events/${event._id}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.TEAM}&search=${team.name.split(' ').join("+")}`}
          >
            Stats
          </ActionLink> */}
          <ActionLink href={`${FRONTEND_URL}/events/${eventId}/?event_item=TEAM&search=${team.name.split(' ').join('+')}`}>Stats</ActionLink>
        </div>
      </div>

      <div className="px-3 py-1">
        <div className="flex bg-gray-700 rounded-lg p-1">
          <TabButton tab={ETab.ROSTER} label="ROSTER" />
          <TabButton tab={ETab.MATCHES} label="MATCHES" />
        </div>
      </div>
    </div>
  );

  const RosterSection = () => {
    if (addPlayer) {
      return (
        <div className="space-y-3">
          <SectionHeader
            title="Add Players"
            subtitle={`${divisionalPlayers.length} available players`}
            action={
              <button
                onClick={() => setAddPlayer(false)}
                className="text-gray-400 hover:text-white text-sm font-medium px-3 py-1 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
              >
                Back
              </button>
            }
          />

          <form onSubmit={handleAddPlayersToTeam} className="space-y-3">
            <PlayerSelectInput availablePlayers={divisionalPlayers as IPlayer[]} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name="add-player-to-team" />
            <button type="submit" className="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors shadow-lg">
              ADD SELECTED PLAYERS
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <SectionHeader
          title="Team Roster"
          subtitle={`${activePlayers.length} active players`}
          action={
            <button onClick={() => setAddPlayer(true)} className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-300 transition-colors shadow-lg">
              + ADD PLAYER
            </button>
          }
        />

        <div className="space-y-2">
          <PlayerList
            playerList={activePlayers}
            eventId={eventId}
            setIsLoading={setIsLoading}
            rankControls
            refetchFunc={refetchFunc}
            teamList={teams}
            divisionList={divisionList}
            teamId={team?._id}
            showRank
            // @ts-ignore
            playerRanking={playerRankingData}
            currEvent={event}
          />
        </div>

        {inactivePlayers.length > 0 && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-400">Inactive Players</h3>
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">{inactivePlayers.length}</span>
            </div>
            <PlayerList
              playerList={inactivePlayers}
              eventId={eventId}
              setIsLoading={setIsLoading}
              refetchFunc={refetchFunc}
              teamList={teams}
              divisionList={divisionList}
              teamId={team?._id}
              currEvent={event}
              inactive
            />
          </div>
        )}
      </div>
    );
  };

  const MatchesSection = () => (
    <div className="space-y-3">
      <SectionHeader
        title="Team Matches"
        subtitle={`${matchList.length} total matches`}
        action={matchList.length > ITEMS_PER_PAGE && <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">Page {currentPage}</span>}
      />

      {paginatedMatchList.length > 0 ? (
        <div className="space-y-2">
          {paginatedMatchList.map((match, i) => (
            <MatchCard key={match._id} setActErr={setActErr} eventId={eventId} handleSelectMatch={handleSelectMatch} isChecked={false} match={match} sl={i + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm mb-1">No matches found</div>
          <p className="text-gray-500 text-xs">This team hasn't played any matches yet</p>
        </div>
      )}

      {matchList.length > ITEMS_PER_PAGE && (
        <div className="pt-2">
          <Pagination currentPage={currentPage} itemList={matchList} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 pb-4">
      <HeaderSection />

      <div className="pt-3">
        {selectedItem === ETab.ROSTER && <RosterSection />}
        {selectedItem === ETab.MATCHES && <MatchesSection />}
      </div>
    </div>
  );
}

export default TeamDetailMain;
