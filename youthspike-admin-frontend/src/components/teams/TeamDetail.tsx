'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { IEvent, IMatch, IMatchExpRel, IMenuItem, IOption, IPlayer, IPlayerExpRel, IPlayerRankingExpRel, IPlayerRankingItem, ITeam } from '@/types';
import { removePlayerRankings, setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import { useMutation } from '@apollo/client';
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
import useLdoUrl from '@/hooks/useLdoUrl';
import { useLdoId } from '@/lib/LdoProvider';

interface ITeamDetailProps {
  event: IEvent;
  team: ITeam;
  eventId: string;
  divisionList: IOption[];
  teamList: ITeam[];
  playerList: IPlayer[];
  unassignedPlayers: IPlayer[];
  playerRanking: IPlayerRankingExpRel;
  matchList: IMatchExpRel[];
  rankings: IPlayerRankingItem[];
}

// eslint-disable-next-line no-unused-vars, no-shadow
enum ETab {
  // eslint-disable-next-line no-unused-vars
  ROSTER = 'ROSTER',
  // eslint-disable-next-line no-unused-vars
  MATCHES = 'MATCHES',
}

const ITEMS_PER_PAGE = 20;

function TeamDetail({ event, team, eventId, divisionList, teamList, playerList, unassignedPlayers, playerRanking, matchList, rankings }: ITeamDetailProps) {
  const { setActErr } = useError();
  const { ldoIdUrl } = useLdoId();

  // ===== Local State =====
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [filteredPlayers, setFilteredPlayers] = useState<IPlayer[]>([]);
  const [playerIdsToAdd, setPlayerIdsToAdd] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<ETab>(ETab.ROSTER);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ===== GraphQL =====
  const [mutateTeam] = useMutation(UPDATE_TEAM);

  // ===== Change Events =====
  const handleCheckboxChange = (pId: string, isChecked: boolean) => {
    if (isChecked) {
      // @ts-ignore
      setPlayerIdsToAdd((prevState) => [...new Set([...prevState, pId])]);
    } else {
      setPlayerIdsToAdd((prevState) => prevState.filter((p) => p !== pId));
    }
  };

  const handleSelectGroup = (e: React.SyntheticEvent, tab: ETab) => {
    e.preventDefault();
    if (tab === ETab.ROSTER) {
      window.location.reload();
    }
    setSelectedItem(tab);
  };


  const refetchFunc=()=>{
    window.location.reload();
  }

  const handleAddPlayersToTeam = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await mutateTeam({ variables: { input: { players: playerIdsToAdd }, teamId: team._id, eventId: event._id } });
      window.location.reload();
    } catch (error) {
      console.log(error);
      // @ts-ignore
      setActErr({ message: error?.message || '', success: false });
    }
  };

  const handleSelectMatch = (e: React.SyntheticEvent, matchId: string) => {};

  useEffect(() => {
    //Removing player rankings
    removePlayerRankings();

    // Set division
    setDivisionToStore(team.division);
    setTeamToStore(team._id);
  }, []);

  useEffect(() => {
    // Get available players from all player list
    const napList: IPlayer[] = playerList ? playerList.filter((p: IPlayer) => !p.teams || p.teams.length === 0) : []; // nap List = new available players List
    let nfpList = [...napList]; // fnp List = new filtered player List

    nfpList = napList.filter((p) => p.division && p.division.trim().toLowerCase() === team.division.trim().toLowerCase());
    setFilteredPlayers(nfpList);
  }, []);

  

  const divisionalPlayers = useMemo(() => {
    const nfpList = unassignedPlayers ? unassignedPlayers.filter((p) => p.division && p.division.trim().toLowerCase() === team.division.trim().toLowerCase()) : [];
    return nfpList;
  }, [unassignedPlayers, team]);

  const paginatedMatchList: IMatchExpRel[] = useMemo(() => {
    // Paginated
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTeams = matchList.slice(start, start + ITEMS_PER_PAGE);

    // inactive players won't have rankings
    return paginatedTeams;
  }, [matchList, currentPage]);

  const activePlayers: IPlayerExpRel[] = useMemo(() => {
    if (!playerList) return [];
    return playerList.filter((p) => p.status === EPlayerStatus.ACTIVE) as IPlayerExpRel[];
  }, [playerList]);

  const inactivePlayers: IPlayerExpRel[] = useMemo(() => {
    if (!playerList) return [];
    return playerList.filter((p) => p.status !== EPlayerStatus.ACTIVE) as IPlayerExpRel[];
  }, [playerList]);

  return (
    <React.Fragment>
      <div className="flex flex-col items-center">
        {/* Header Section */}
        <div className="team-detail relative w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center relative overflow-hidden">
          {/* Decorative Glow */}
          {/* <div className="overflow-gradient" /> */}

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
              <PlayerSelectInput availablePlayers={divisionalPlayers} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name="add-player-to-team" />
              <button type="submit" className="btn-info mt-4">
                Add
              </button>
            </form>
          </>
        ) : (
          <div className="bulk-operations-players mt-6 p-4 bg-gray-800 rounded-xl shadow-lg max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
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
                teamList={teamList}
                divisionList={divisionList}
                teamId={team._id}
                showRank
                playerRanking={playerRanking}
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
                  teamList={teamList}
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
              paginatedMatchList.map((match, i) => <MatchCard setActErr={setActErr} key={match._id} eventId={eventId} handleSelectMatch={handleSelectMatch} isChecked={false} match={match} sl={i + 1} />)
            ) : (
              <p>No match found of this team!</p>
            )}
          </div>
          <div className="w-full">
            <Pagination currentPage={currentPage} itemList={matchList} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
          </div>
        </>
      )}

      {/* Show captain  */}
      {/* <CaptainCard team={team} /> */}
    </React.Fragment>
  );
}

export default TeamDetail;
