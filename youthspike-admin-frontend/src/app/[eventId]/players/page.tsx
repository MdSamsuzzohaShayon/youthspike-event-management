'use client'

import { GET_EVENT_WITH_PLAYERS } from '@/graphql/players';
import { IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import { useLazyQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IError, IEventExpRel, IMenuItem, IOption, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import SortableList from '@/components/player/SortableList';
import { usePathname } from 'next/navigation';
import UserMenuList from '@/components/layout/UserMenuList';
import { handleResponse } from '@/utils/handleError';

function PlayersPage({ params }: { params: { eventId: string } }) {

  // ===== hooks ===== 
  const user = useUser();

  // ===== Local State ===== 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [showRank, setShowRank] = useState<boolean>(false);
  const [rankControls, setRankControls] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);
  const [currDivision, setCurrDivision] = useState<string>('');
  const [playerList, setPlayerList] = useState<IPlayerExpRel[]>([]);
  const [filteredPlayerList, setFilteredPlayerList] = useState<IPlayerExpRel[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);


  // ===== GraphQL ===== 
  const [getEvent, { data, loading, error, refetch }] = useLazyQuery(GET_EVENT_WITH_PLAYERS, { variables: { eventId: params.eventId } });

  const refetchFunc = async () => {
    await refetch();
  }

  const fetchPlayer = async () => {
    const playerRes = await getEvent({ variables: { eventId: params.eventId } });
   
    const success = handleResponse({response: playerRes?.data?.getEvent, setActErr});
    if (!success) return;

    let npList: IPlayerExpRel[] = playerRes?.data?.getEvent?.data?.players ? playerRes?.data.getEvent.data.players : []; // Np list  = new players list



    const ntList: ITeam[] = playerRes?.data?.getEvent?.data?.teams ? playerRes?.data?.getEvent?.data?.teams : []; // Nt List = new team List
    let ftList = [...ntList]; // ft List = filtered team list

    const divs = playerRes?.data?.getEvent?.data?.divisions ? divisionsToOptionList(playerRes?.data?.getEvent?.data?.divisions) : []; // divs = divisions
    setDivisionList(divs);

    // ===== Show players of captain's team ===== 
    if (user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain) {
      setShowRank(true);
      setRankControls(true);
      let pId = user.info.captainplayer ? user.info.captainplayer : user.info.cocaptainplayer;
      const playerExist = npList.find((p) => p._id === pId);
      if (playerExist) {
        const teamId = playerExist.teams && playerExist.teams.length > 0 ? playerExist.teams[0]._id : null;
        if (teamId) {
          npList = npList.filter((p) => {
            if (p.teams && p.teams.length > 0) {
              const tIds = p.teams.map((t) => t._id);
              if (tIds.includes(teamId)) {
                return p;
              }
            }
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
  }

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
  }

  // ===== Callback functions ===== 
  const playerAddCB = (playerData: IPlayerExpRel) => {
    setPlayerList((prevState) => [...prevState, playerData]);
    setFilteredPlayerList((prevState) => [...prevState, playerData]);
  }

  useEffect(() => {
    if (params.eventId && user.token) {
      if (isValidObjectId(params.eventId)) {
        fetchPlayer();
      } else {
        setActErr({ success : false, message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [params.eventId, user, data]);


  if (loading || isLoading) return <Loader />;




  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='mb-8 text-center'>Players</h1>
      {data?.getEvent?.data && (<CurrentEvent currEvent={data?.getEvent?.data} />)}
      <div className="navigator mb-4">
        <UserMenuList eventId={params.eventId} />
      </div>

      {user?.info?.role !== UserRole.captain && user?.info?.role !== UserRole.co_captain && (
        <div className="mb-4 division-selection w-full">
          <SelectInput key={crypto.randomUUID()} handleSelect={handleDivisionSelection} defaultValue={currDivision} name='division' optionList={divisionList} vertical extraCls='text-center' />
        </div>
      )}
      
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {addPlayer ? (<>
        <h3 className='mt-4'>Player Add</h3>
        <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(false)} >Player List</button>
        <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} setAddPlayer={setAddPlayer} teamList={filteredTeamList} division={currDivision} playerAddCB={playerAddCB} setActErr={setActErr} />
      </>) : (<>
        <h3 className='mt-4' >Player List</h3>
        {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
          <button className="btn-info mt-4 mb-4" type='button' onClick={() => setAddPlayer(true)} >Add player</button>
        )}
        {/* <PlayerList teamIds={teamList.map((t) => t._id)}  divisionList={divisionList} teamList={filteredTeamList} /> */}
        <SortableList eventId={params.eventId} playerList={filteredPlayerList} setIsLoading={setIsLoading} rankControls={rankControls} refetchFunc={refetchFunc} teamList={filteredTeamList} divisionList={divisionList} showRank={showRank} />
      </>)}
    </div>
  )
}

export default PlayersPage;