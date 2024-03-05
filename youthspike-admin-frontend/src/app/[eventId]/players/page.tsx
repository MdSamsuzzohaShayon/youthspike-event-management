'use client'

import { GET_EVENT_WITH_PLAYERS, GET_PLAYERS } from '@/graphql/players';
import { IPlayer, IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import PlayerList from '@/components/player/PlayerList';
import { gql, useApolloClient, useLazyQuery, useQuery } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IError, IEventExpRel, IOption, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';

function PlayersPage({ params }: { params: { eventId: string } }) {

  // hooks
  const user = useUser();

  // Local State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);
  const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
  const [currDivision, setCurrDivision] = useState<string>('');
  const [playerList, setPlayerList] = useState<IPlayerExpRel[]>([]);
  const [filteredPlayerList, setFilteredPlayerList] = useState<IPlayerExpRel[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);


  // GraphQL
  const [getEvent, { data, loading, error, refetch }] = useLazyQuery(GET_EVENT_WITH_PLAYERS, { variables: { eventId: params.eventId } });

  const fetchPlayer = async () => {
    const playerRes = await getEvent({ variables: { eventId: params.eventId } });

    if (!playerRes) return;

    const npList: IPlayerExpRel[] = playerRes?.data?.getEvent?.data?.players ? playerRes?.data.getEvent.data.players : []; // Np list  = new players list
    
    let fpList = [...npList]; // fp list = filtered players list

    const ntList: ITeam[] = playerRes?.data?.getEvent?.data?.teams ? playerRes?.data?.getEvent?.data?.teams : []; // Nt List = new team List
    let ftList = [...ntList]; // ft List = filtered team list

    const divs = playerRes?.data?.getEvent?.data?.divisions ? divisionsToOptionList(playerRes?.data?.getEvent?.data?.divisions) : []; // divs = divisions
    setDivisionList(divs);

    // Division and team value
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
    /**
     * Filter Players
     */
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

  // Callback functions
  const playerAddCB=(playerData: IPlayerExpRel)=>{
    setPlayerList((prevState)=> [...prevState, playerData]);
    setFilteredPlayerList((prevState)=> [...prevState, playerData]);
  }

  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        fetchPlayer();
      } else {
        setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [params.eventId]);

  if (loading || isLoading) return <Loader />;
  



  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <div className="mb-4 division-selection w-full">
        <SelectInput key={crypto.randomUUID()} handleSelect={handleDivisionSelection} defaultValue={currDivision} name='division' optionList={divisionList} vertical extraCls='text-center' />
      </div>
      <h1 className='mb-8 text-center'>Players</h1>
      {data?.getEvent?.data && (<CurrentEvent currEvent={data?.getEvent?.data} />)}
      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}
      {addPlayer ? (<>
        <h3 className='mt-4'>Player Add</h3>
        <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(false)} >Player List</button>
        <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} setAddPlayer={setAddPlayer} teamList={filteredTeamList} division={currDivision} playerAddCB={playerAddCB} setActErr={setActErr} />
      </>) : (<>
        <h3 className='mt-4' >Player List</h3>
        {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
          <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(true)} >Add player</button>
        )}
        <PlayerList playerList={filteredPlayerList} eventId={params.eventId} setIsLoading={setIsLoading} setAddPlayer={setAddPlayer} teamIds={teamList.map((t) => t._id)} />
      </>)}
    </div>
  )
}

export default PlayersPage;