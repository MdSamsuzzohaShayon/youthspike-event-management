'use client';

import { GET_EVENT_WITH_PLAYERS } from '@/graphql/players';
import { EPlayerStatus, IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import { useLazyQuery } from '@apollo/client';
import React, { useState, useEffect, useCallback } from 'react';
import Loader from '@/components/elements/Loader';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IEvent, IOption, IPlayerRankingExpRel, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import PlayerList from '@/components/player/PlayerList';
import UserMenuList from '@/components/layout/UserMenuList';
import { handleResponse } from '@/utils/handleError';
import { useError } from '@/lib/ErrorContext';

function PlayersPage({ params }: { params: { eventId: string } }) {
  // ===== hooks =====
  const user = useUser();
  const { setActErr } = useError();


  // ===== Local State =====
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [showRank, setShowRank] = useState<boolean>(false);
  const [rankControls, setRankControls] = useState<boolean>(false);
  const [lockRank, setLockRank] = useState<boolean>(false);

  const [currDivision, setCurrDivision] = useState<string>('');
  const [playerList, setPlayerList] = useState<IPlayerExpRel[]>([]);
  const [filteredPlayerList, setFilteredPlayerList] = useState<IPlayerExpRel[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
  const [teamPlayerRanking, setTeamPlayerRanking] = useState<IPlayerRankingExpRel | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currEvent, setCurrEvent] = useState<IEvent | null>(null);

  // ===== GraphQL =====
  const [getEvent, { data, loading, error, refetch }] = useLazyQuery(GET_EVENT_WITH_PLAYERS, { variables: { eventId: params.eventId }, fetchPolicy: "network-only" });

  const fetchPlayer = useCallback(async () => {
    const playerRes = await getEvent({ variables: { eventId: params.eventId } });

    const success = handleResponse({ response: playerRes?.data?.getEvent, setActErr });
    if (!success) return;
    console.log(playerRes?.data);

    if (playerRes?.data?.getEvent) {
      setCurrEvent(playerRes?.data?.getEvent.data);
    }

    let npList: IPlayerExpRel[] = playerRes?.data?.getEvent?.data?.players ? playerRes?.data.getEvent.data.players : []; // Np list  = new players list

    const ntList: ITeam[] = playerRes?.data?.getEvent?.data?.teams ? playerRes?.data?.getEvent?.data?.teams : []; // Nt List = new team List
    let ftList = [...ntList]; // ft List = filtered team list


    const divs = playerRes?.data?.getEvent?.data?.divisions ? divisionsToOptionList(playerRes?.data?.getEvent?.data?.divisions) : []; // divs = divisions
    setDivisionList(divs);

    // ===== Show players of captain's team =====
    if (user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain) {
      setShowRank(true);
      setRankControls(true);
      const pId = user.info.captainplayer ? user.info.captainplayer : user.info.cocaptainplayer;
      const playerExist = npList.find((p) => p._id === pId);
      if (playerExist) {
        const teamId = playerExist.teams && playerExist.teams.length > 0 ? playerExist.teams[0]._id : null;
        if (teamId) {
          const teamExist = ntList.find((t) => t._id === teamId);
          if (teamExist && teamExist) {
            setTeamId(teamId)
            if (teamExist.playerRanking) {
              setTeamPlayerRanking(teamExist.playerRanking);
            }
          }
          npList = npList.filter((p): boolean => {
            if (p.teams && p.teams.length > 0) {
              const tIds = p.teams.map((t) => t._id);
              if (tIds.includes(teamId)) {
                return true; // Keep this element in the filtered array
              }
            }
            return false; // Exclude this element from the filtered array
          });
        }
      } else {
        npList = [];
      }
    }

    let fpList = [...npList]; // fp list = filtered players list

    // ===== Division and team value =====
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
      fpList = npList.filter((p) => p.division && p.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      ftList = ntList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
    }

    setPlayerList(npList);
    setFilteredPlayerList(fpList);
    setTeamList(ntList);
    setFilteredTeamList(ftList);
  }, []);

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // ===== Filter Players =====
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
    if (inputEl.value === '') {
      setFilteredTeamList([...teamList]);
      setFilteredPlayerList([...playerList]);
      removeDivisionFromStore();
    } else {
      setDivisionToStore(inputEl.value.trim());
      const ntList = teamList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredTeamList([...ntList]);

      const npList = playerList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());

      setFilteredPlayerList([...npList]);
    }
  };

  // ===== Callback functions =====
  const playerAddCB = (playerData: IPlayerExpRel) => {
    setPlayerList((prevState) => [...prevState, playerData]);
    setFilteredPlayerList((prevState) => [...prevState, playerData]);
  };


  const refetchFunc = async () => {
    // await refetch();
    // fetchPlayer();
    window.location.reload();
  };


  /**
 * Lifecycle hooks
 * Getting and setting event ID & director ID
 * Fetching players
 */
  useEffect(() => {
    if (params.eventId && user.token) {
      if (isValidObjectId(params.eventId)) {
        fetchPlayer();
      } else {
        setActErr({ success: false, message: 'Can not fetch data due to invalid event ObjectId!' });
      }
    }
  }, [params.eventId, user]);





  if (error) {
    console.log(error);

  }

  const renderInactivePlayers = useCallback(() => {

    if (filteredPlayerList.length > 0) {
      const inactivePlayers = filteredPlayerList.filter(p => p.status === EPlayerStatus.INACTIVE);
      if (inactivePlayers.length === 0) return <p>No inactive players</p>;
      return (

        <div className="w-full">
          <h3 className="mt-4">Inactive Players List</h3>
          <PlayerList inactive currEvent={currEvent} eventId={params.eventId} playerList={inactivePlayers} setIsLoading={setIsLoading} refetchFunc={refetchFunc} teamList={filteredTeamList} divisionList={divisionList} />
        </div>
      )
    }
    return <p>No inactive players</p>;
  }, [filteredPlayerList, currEvent]);
  

  if (loading || isLoading) return <Loader />;

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mb-8 text-center">Roster</h1>
      {/* Event Menu Start */}
      <div className="event-and-menu bg-gray-800 p-8 rounded-lg shadow-lg">
        {data?.getEvent?.data && <CurrentEvent currEvent={data?.getEvent?.data} />}
        <div className="team-name text-center">
          {(user && user.info?.team) && <h3 className="text-yellow-500 text-gray-400">{user.info.team}</h3>}
        </div>
        <div className="navigator mt-8">
          <UserMenuList eventId={params.eventId} />
        </div>
      </div>
      {/* Event Menu End */}

      {user?.info?.role !== UserRole.captain && user?.info?.role !== UserRole.co_captain && (
        <div className="mb-4 division-selection w-full">
          <SelectInput key="players-pg-1" handleSelect={handleDivisionSelection} defaultValue={currDivision} name="division" optionList={divisionList} vertical extraCls="text-center" />
        </div>
      )}

      {addPlayer ? (
        <>
          <h3 className="mt-4">Player Add</h3>
          <button className="btn-info mt-4" type="button" onClick={() => setAddPlayer(false)}>
            Player List
          </button>
          <PlayerAdd
            setIsLoading={setIsLoading}
            eventId={params.eventId}
            setAddPlayer={setAddPlayer}
            teamList={filteredTeamList}
            division={currDivision}
            playerAddCB={playerAddCB}
          />
        </>
      ) : (
        <>
          <h3 className="mt-4">Player List</h3>
          {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
            <button className="btn-info mt-4 mb-4" type="button" onClick={() => setAddPlayer(true)}>
              Add player
            </button>
          )}
          <PlayerList
            eventId={params.eventId}
            playerList={filteredPlayerList.filter(p => p.status === EPlayerStatus.ACTIVE)}
            setIsLoading={setIsLoading}
            rankControls={rankControls && !lockRank}
            refetchFunc={refetchFunc}
            teamList={filteredTeamList}
            divisionList={divisionList}
            showRank={showRank}
            playerRanking={teamPlayerRanking}
            teamId={teamId}
            currEvent={currEvent}
          />

          {/* <div className="sortable-active-player-list mt-4">
            <PlayerList
              playerList={filteredPlayerList.filter(p => p.status === EPlayerStatus.ACTIVE)}
              eventId={params.eventId}
              setIsLoading={setIsLoading}
              rankControls
              refetchFunc={refetchFunc}
              teamList={teamList}
              divisionList={divisionList}
              teamId={teamId}
              showRank
              playerRanking={teamPlayerRanking}
              currEvent={currEvent}
            />
          </div> */}

          {renderInactivePlayers()}
        </>
      )}
    </div>
  );
}

export default PlayersPage;
