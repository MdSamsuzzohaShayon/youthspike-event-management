'use client'

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from "framer-motion";
import { IEvent, IMatch, IMatchExpRel, IMenuItem, IOption, IPlayer, IPlayerExpRel, IPlayerRankingExpRel, IPlayerRankingItem, ITeam } from '@/types';
import { removePlayerRankings, setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import { useMutation } from '@apollo/client';
import { UPDATE_TEAM } from '@/graphql/teams';
import { AdvancedImage } from '@cloudinary/react';
import { EPlayerStatus } from '@/types/player';
import cld from '@/config/cloudinary.config';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import PlayerList from '../player/PlayerList';
import Image from 'next/image';
import UserMenuList from '../layout/UserMenuList';
import { useError } from '@/lib/ErrorContext';
import MatchCard from '../match/MatchCard';
import Pagination from '../elements/Pagination';
import Link from 'next/link';
import TextImg from '../elements/TextImg';

interface ITeamDetailProps {
  event: IEvent;
  team: ITeam;
  eventId: string;
  divisionList: IOption[];
  teamList: ITeam[];
  refetchFunc?: () => Promise<void>;
  playerList: IPlayer[];
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

function TeamDetail({ event, team, eventId, divisionList, teamList, refetchFunc, playerList, playerRanking, matchList, rankings }: ITeamDetailProps) {
  const { setActErr } = useError();


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

  const handleAddPlayersToTeam = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await mutateTeam({ variables: { input: { players: playerIdsToAdd }, teamId: team._id, eventId: event._id } });
      if (refetchFunc) refetchFunc();
      setAddPlayer(false);
    } catch (error) {
      console.log(error);
      // @ts-ignore
      setActErr({ message: error?.message || "", success: false });
    }
  };

  const handleSelectMatch = (e: React.SyntheticEvent, matchId: string) => { }

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


  const paginatedMatchList: IMatchExpRel[] = useMemo(() => {
    // Paginated
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTeams = matchList.slice(start, start + ITEMS_PER_PAGE);

    // inactive players won't have rankings
    return paginatedTeams;
  }, [matchList, currentPage]);



  const activePlayers = (playerList ? playerList.filter((p) => p.status === EPlayerStatus.ACTIVE) : []) as IPlayerExpRel[];
  const inactivePlayers = (playerList ? playerList.filter((p) => p.status !== EPlayerStatus.ACTIVE) : []) as IPlayerExpRel[];





  return (
    <React.Fragment>
      {/* <div className="team-detail bg-gray-700 rounded-lg">
        <h1 className="uppercase text-center">Teams/roster</h1>
        <h1 className="uppercase text-center">{event?.name}</h1>

  
        <div className="team-detail mt-4 w-full flex justify-center flex-col items-center">
          {team.logo ? <AdvancedImage cldImg={cld.image(team.logo)} className="w-20 md:w-32" /> : <Image src="/icons/sports-man.svg" width={100} height={100} alt='free-logo' className="w-20 md:w-32 h-20 md:h-32" />}
          <h1 className="capitalize">{team && team.name}</h1>
          <div className="navigator mb-4">
            <UserMenuList eventId={eventId} />
          </div>
        </div>

        <div className="tab-menu w-full mb-6 bg-gray-700 rounded-lg p-4">
          <motion.ul className="flex justify-around items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.li
              role="presentation"
              onClick={(e) => handleSelectGroup(e, ETab.ROSTER)}
              className={`p-3 w-1/2 text-center rounded-md cursor-pointer ${selectedItem === ETab.ROSTER ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-600 text-white'}`}
              whileHover={{ scale: 1.05 }}
            >
              Rosters
            </motion.li>
            <motion.li
              role="presentation"
              onClick={(e) => handleSelectGroup(e, ETab.MATCHES)}
              className={`p-3 w-1/2 text-center rounded-md cursor-pointer ${selectedItem === ETab.MATCHES ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-600 text-white'}`}
              whileHover={{ scale: 1.05 }}
            >
              Matches
            </motion.li>
          </motion.ul>
        </div>
      </div> */}

      <div className="flex flex-col items-center">
        {/* Header Section */}
        <div className="team-detail w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute inset-0 bg-yellow-400 opacity-10 rounded-2xl blur-lg" />

          {/* Team Logo */}
          {team.logo ? (
            <AdvancedImage
              cldImg={cld.image(team.logo)}
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
          <Link
            href={`/events/a`}
            className="mt-5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 transition py-3 px-6 rounded-lg text-md font-medium shadow-lg relative z-10"
          >
            View Standings
          </Link>

          {/* Tab Menu */}
          <div className="tab-menu w-full mt-6 relative z-10">
            <ul className="flex bg-gray-700 rounded-xl overflow-hidden border border-gray-600 text-md shadow-lg">
              <li
                className={`w-1/2 text-center py-4 cursor-pointer ${selectedItem === ETab.ROSTER ? 'bg-yellow-500 text-gray-900 font-bold tracking-wide' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                role="presentation"
                onClick={(e) => handleSelectGroup(e, ETab.ROSTER)}
              >
                Rosters
              </li>
              <li
                className={`w-1/2 text-center py-4 cursor-pointer ${selectedItem === ETab.MATCHES ? 'bg-yellow-500 text-gray-900 font-bold tracking-wide' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
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

      {selectedItem === ETab.ROSTER && (
        addPlayer ? (
          <>
            <div className="flex w-full justify-between items-center mb-4">
              <h3>Add Player to Team</h3>
              <button className="btn-info mt-4" type="button" onClick={() => setAddPlayer(false)}>
                Player List
              </button>
            </div>
            <form onSubmit={handleAddPlayersToTeam} className="mb-4">
              <PlayerSelectInput availablePlayers={filteredPlayers} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name="add-player-to-team" />
              <button type="submit" className="btn-primary mt-4">
                Add
              </button>
            </form>
          </>
        ) : (

          <div className="bulk-operations-players mt-6 p-4 bg-gray-800 rounded-xl shadow-lg max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
              <h3 className="text-xl text-white font-semibold text-center md:text-left">Player List</h3>
              <button className="bg-yellow-500 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-600 transition duration-300 w-full md:w-auto" onClick={() => setAddPlayer(true)}>
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



        )
      )}

      {selectedItem === ETab.MATCHES && (<>
        <div className='w-full'>
          {paginatedMatchList.length > 0
            ? paginatedMatchList.map((match, i) => (<MatchCard key={match._id} eventId={eventId} handleSelectMatch={handleSelectMatch} isChecked={false} match={match} sl={i + 1} />))
            : <p>No match found of this team!</p>}
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
