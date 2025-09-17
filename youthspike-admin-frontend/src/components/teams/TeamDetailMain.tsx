'use client';

import React, { useMemo, useState, useCallback } from 'react';
import {
  IGetTeamDetailQuery,
  IMatchExpRel,
  INetRelatives,
  IPlayerExpRel,
  IRoundRelatives,
  ITeam,
} from '@/types';
import { QueryRef, useMutation, useReadQuery } from '@apollo/client';
import { UPDATE_TEAM } from '@/graphql/teams';
import { CldImage } from 'next-cloudinary';
import { EPlayerStatus } from '@/types/player';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import PlayerList from '../player/PlayerList';
import { useError } from '@/lib/ErrorProvider';
import MatchCard from '../match/MatchCard';
import Pagination from '../elements/Pagination';
import Link from 'next/link';
import TextImg from '../elements/TextImg';
import { useLdoId } from '@/lib/LdoProvider';
import { divisionsToOptionList } from '@/utils/helper';

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

  const { data, error } = useReadQuery(queryRef);


  // Check error here
  
  const { team, playerRanking, players, captain, cocaptain, group, event, matches, rankings, rounds, nets, teams } = data?.getTeamDetails?.data ?? {};


  // Local state
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [playerIdsToAdd, setPlayerIdsToAdd] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ETab>(ETab.ROSTER);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

   // ===== GraphQL =====
   const [mutateTeam] = useMutation(UPDATE_TEAM);

   // ===== Memoized Values =====
  const divisionList = useMemo(() => {
    return event?.divisions ? divisionsToOptionList(event.divisions) : [];
  }, [event, event?.divisions]);

  const teamData = useMemo(() => {
    return {
      ...team,
      captain: captain,
      cocaptain: cocaptain,
    };
  }, [team, captain, cocaptain]);

  const playerRankingData = useMemo(()=>{
    return {
      ...playerRanking,
      rankings: rankings
    };
  }, [playerRanking, rankings]);

  // --- Build lookup maps in O(n) ---
  const roundMap: Map<string, IRoundRelatives> = useMemo(() => {
    console.log({ rounds });

    if (!rounds) new Map<string, IRoundRelatives>();
    return new Map<string, IRoundRelatives>(rounds.map((r: IRoundRelatives) => [r._id, r]));
  }, [rounds]);
  const netMap: Map<string, INetRelatives> = useMemo(() => {
    return new Map<string, INetRelatives>(nets.map((n: INetRelatives) => [n._id, n]));
  }, [nets]);
  const oponentTeamMap: Map<string, ITeam> = useMemo(() => {
    return new Map<string, ITeam>(teams.map((t: ITeam) => [t._id, t]));
  }, [teams]);

  // --- Process Matches Efficiently ---
  const matchList = useMemo(() => {

    if (!matches) return [];
    return matches
      .map((m: IMatchExpRel) => {
        const enrichedMatch: IMatchExpRel = {
          ...m,
          // @ts-ignore
          rounds: m.rounds.map((id: string) => roundMap.get(id)).filter(Boolean) as IRoundRelatives[],
          // @ts-ignore
          nets: m.nets.map((id: string) => netMap.get(id)).filter(Boolean) as INetRelatives[],
        };

        // Determine opponent team
        let opponentTeam: ITeam | undefined;

        if (String(m.teamA) !== team._id && oponentTeamMap.has(String(m.teamA))) {
          opponentTeam = oponentTeamMap.get(String(m.teamA))!;
          enrichedMatch.teamA = opponentTeam;
          enrichedMatch.teamB = team;
        } else if (String(m.teamB) !== team._id && oponentTeamMap.has(String(m.teamB))) {
          opponentTeam = oponentTeamMap.get(String(m.teamB))!;
          enrichedMatch.teamB = opponentTeam;
          enrichedMatch.teamA = team;
        }

        // If no valid opponent found, skip this match
        if (!opponentTeam) {
          console.warn(`Match ${m._id} has no valid opponent team`);
          return null;
        }

        return enrichedMatch;
      })
      .filter(Boolean) as IMatchExpRel[];
  }, [matches, roundMap, netMap, team]);

  // --- Separate Players into assigned/unassigned ---
  const { teamPlayers, unassignedPlayers } = useMemo(() => {
    const teamPlayers: IPlayerExpRel[] = [];
    const unassignedPlayers: IPlayerExpRel[] = [];

    for (const p of players) {
      const playerObj = structuredClone(p);

      if (p.teams?.length && p.teams?.length > 0) {
        if (playerObj.teams?.includes(teamData._id)) {
          if (teamData._id) playerObj.teams = [teamData._id];

          if (playerObj.captainofteams?.length) {
            // @ts-ignore
            playerObj.captainofteams = [teamData._id];
          }

          if (playerObj.cocaptainofteams?.length) {
            // @ts-ignore
            playerObj.cocaptainofteams = [teamData._id];
          }

          teamPlayers.push(playerObj as IPlayerExpRel);
        }
      } else {
        playerObj.teams = [];
        unassignedPlayers.push(playerObj as IPlayerExpRel);
      }
    }

    return { teamPlayers, unassignedPlayers };
  }, [players, teamData]);

  const activePlayers = useMemo(() => {
    if (!teamPlayers) return [];
    return teamPlayers.filter((p) => p.status === EPlayerStatus.ACTIVE) as IPlayerExpRel[];
  }, [teamPlayers]);

  const inactivePlayers = useMemo(() => {
    if (!teamPlayers) return [];
    return teamPlayers.filter((p) => p.status !== EPlayerStatus.ACTIVE) as IPlayerExpRel[];
  }, [teamPlayers]);

  const teamDivisionLower = useMemo(() => teamData.division.trim().toLowerCase(), [teamData, teamData.division]);

  const divisionalPlayers = useMemo(() => {
    if (!unassignedPlayers) return [];

    return unassignedPlayers
      .filter((p) => p.division && p.division.trim().toLowerCase() === teamDivisionLower)
      .sort((a, b) => {
        // Compare by last name first
        const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
        if (lastNameCompare !== 0) return lastNameCompare;

        // If last names are the same, compare by first name
        return (a.firstName || '').localeCompare(b.firstName || '');
      });
  }, [unassignedPlayers, teamDivisionLower]);

  const paginatedMatchList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return matchList.slice(start, start + ITEMS_PER_PAGE);
  }, [matchList, currentPage]);


  // Event handlers
  const handleSelectGroup = useCallback((e: React.SyntheticEvent, tab: ETab) => {
    e.preventDefault();
    if (tab === ETab.ROSTER) {
      window.location.reload();
    }
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
        console.error(error);
        setActErr({ message: (error as Error)?.message || '', success: false });
      }
    },
    [playerIdsToAdd, team._id, event._id, mutateTeam, setActErr],
  );

  const handleCheckboxChange = useCallback((pId: string, isChecked: boolean) => {
    setPlayerIdsToAdd((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(pId);
      } else {
        newSet.delete(pId);
      }
      return newSet;
    });
  }, []);

  const refetchFunc = useCallback(() => {
    window.location.reload();
  }, []);

  const handleSelectMatch = useCallback((e: React.SyntheticEvent, matchId: string) => {
    // Match selection logic
  }, []);

  console.log({inactivePlayers});
  

  return (
    <React.Fragment>
      <div className="flex flex-col items-center">
        {/* Header Section */}
        <div className="team-detail relative w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center relative overflow-hidden">
          {/* Team Logo */}
          {team.logo ? (
            <CldImage
              width={100}
              height={100}
              src={team.logo}
              alt="Team logo"
              className="flex justify-center items-center w-24 h-24 bg-yellow-400 text-gray-900 text-3xl font-bold rounded-full shadow-lg border-4 border-yellow-500 relative z-10"
            />
          ) : (
            <TextImg
              className="flex justify-center items-center w-24 h-24 bg-yellow-400 text-gray-900 text-3xl font-bold rounded-full shadow-lg border-4 border-yellow-500 relative z-10"
              fullText={team.name}
              txtCls="text-2xl"
            />
          )}

          {/* Team Name */}
          <h3 className="text-2xl font-semibold mt-5 relative z-10">{team.name}</h3>

          {/* Event Title */}
          <div className="text-center mb-6 relative z-10">
            <h1 className="text-4xl font-extrabold uppercase tracking-wide text-yellow-400">Teams / Roster</h1>
            <h2 className="text-sm text-gray-300 uppercase mt-1">{event?.name}</h2>
          </div>

          {/* Standings Button */}
          <Link href={`/${eventId}/${ldoIdUrl}`} className="mt-5 btn-info">
            View Standings
          </Link>

          {/* Tab Menu */}
          <div className="tab-menu w-full mt-6 relative z-10">
            <ul className="flex bg-gray-700 rounded-xl overflow-hidden border border-gray-600 text-md shadow-lg">
              <li
                className={`w-1/2 text-center py-4 cursor-pointer ${
                  selectedItem === ETab.ROSTER ? 'bg-yellow-logo text-gray-900 font-bold tracking-wide' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                role="presentation"
                onClick={(e) => handleSelectGroup(e, ETab.ROSTER)}
              >
                Rosters
              </li>
              <li
                className={`w-1/2 text-center py-4 cursor-pointer ${
                  selectedItem === ETab.MATCHES ? 'bg-yellow-logo text-gray-900 font-bold tracking-wide' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                role="presentation"
                onClick={(e) => handleSelectGroup(e, ETab.MATCHES)}
              >
                Matches
              </li>
            </ul>
          </div>
        </div>
      </div>

      {selectedItem === ETab.ROSTER &&
        (addPlayer ? (
          <>
            <div className="flex w-full justify-between items-center mb-4">
              <h3>Add Player to Team</h3>
              <button className="btn-info mt-4" type="button" onClick={() => setAddPlayer(false)}>
                Player List
              </button>
            </div>
            <form onSubmit={handleAddPlayersToTeam} className="mb-4">
            {/*  @ts-ignore */}
              <PlayerSelectInput availablePlayers={divisionalPlayers} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name="add-player-to-team" />
              <button type="submit" className="btn-info mt-4">
                Add
              </button>
            </form>
          </>
        ) : (
          <div className="bulk-operations-players mt-6 mx-auto">
            {/* Header Section */}
            
            <div className="flex flex-col md:flex-row w-full justify-between items-center bg-gray-800 rounded-xl p-4 gap-4">
              <h3 className="text-xl text-white font-semibold text-center md:text-left">Player List</h3>
              <button className="bg-yellow-logo text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-600 transition duration-300 w-full md:w-auto" onClick={() => setAddPlayer(true)}>
                Add Player to Team
              </button>
            </div>

            {/* Player List */}
            <div className="sortable-active-player-list mt-4">
              <PlayerList
                playerList={activePlayers}
                eventId={eventId}
                setIsLoading={setIsLoading}
                rankControls
                refetchFunc={refetchFunc}
                teamList={teams}
                divisionList={divisionList}
                teamId={team._id}
                showRank
                // @ts-ignore
                playerRanking={playerRankingData}
                currEvent={event}
              />
            </div>

            {inactivePlayers.length > 0 && (
              <div className="sortable-inactive-player-list mt-4">
                <h3 className="my-4">Inactive Player List</h3>
                <PlayerList
                  playerList={inactivePlayers}
                  eventId={eventId}
                  setIsLoading={setIsLoading}
                  refetchFunc={refetchFunc}
                  teamList={teams}
                  divisionList={divisionList}
                  teamId={team._id}
                  currEvent={event}
                  inactive
                />
              </div>
            )}
          </div>
        ))}

      {selectedItem === ETab.MATCHES && (
        <>
          <div className="w-full">
            {paginatedMatchList.length > 0 ? (
              paginatedMatchList.map((match, i) => (
                <MatchCard key={match._id} setActErr={setActErr} eventId={eventId} handleSelectMatch={handleSelectMatch} isChecked={false} match={match} sl={i + 1} />
              ))
            ) : (
              <p>No match found of this team!</p>
            )}
          </div>
          <div className="w-full">
            <Pagination currentPage={currentPage} itemList={matchList} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
          </div>
        </>
      )}
    </React.Fragment>
  );
}

export default TeamDetailMain;
