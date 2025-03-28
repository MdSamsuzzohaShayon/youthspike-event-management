'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import SelectInput from '@/components/elements/forms/SelectInput';
import CurrentEvent from '@/components/event/CurrentEvent';
import PlayerAdd from '@/components/player/PlayerAdd';
import { GET_EVENT_WITH_PLAYERS } from '@/graphql/players';
import { useError } from '@/lib/ErrorContext';
import { IError, IOption, IPlayerExpRel, ITeam } from '@/types';
import { handleResponse } from '@/utils/handleError';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { getDivisionFromStore } from '@/utils/localStorage';
import { useLazyQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface IPlayerAddPageProps {
  params: {
    eventId: string;
  }
}

function PlayerAddPage({ params }: IPlayerAddPageProps) {

    const {setActErr} = useError();
  

  // ===== Local State ===== 
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currDivision, setCurrDivision] = useState<string>('');
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);

  // ===== GraphQL ===== 
  const [getEvent, { data, loading, error, refetch }] = useLazyQuery(GET_EVENT_WITH_PLAYERS, { variables: { eventId: params.eventId } });



  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // ===== Filter Players ===== 
    // const inputEl = e.target as HTMLInputElement;
    // setCurrDivision(inputEl.value.trim());
    // if (inputEl.value === '') {
    //   setFilteredTeamList([...teamList]);
    //   setFilteredPlayerList([...playerList]);
    //   removeDivisionFromStore();
    // } else {
    //   setDivisionToStore(inputEl.value.trim());
    //   const ntList = teamList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
    //   setFilteredTeamList([...ntList]);

    //   const npList = playerList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());

    //   setFilteredPlayerList([...npList]);
    // }
  }

  // ===== Callback functions ===== 
  const playerAddCB = (playerData: IPlayerExpRel) => {
    // setPlayerList((prevState) => [...prevState, playerData]);
    // setFilteredPlayerList((prevState) => [...prevState, playerData]);

  }


  const fetchEvent = async () => {
    try {

      const eventResponse = await getEvent({ variables: { eventId: params.eventId } });
      const success = handleResponse({ response: eventResponse?.data?.getEvent, setActErr });
      if (!success) return;

      const newTeamList: ITeam[] = eventResponse?.data?.getEvent?.data?.teams ? eventResponse?.data.getEvent.data.teams : [];
      let newFilteredTeamList = [...newTeamList];

      // Division and team value
      const divisionExist = getDivisionFromStore();
      if (divisionExist) {
        setCurrDivision(divisionExist);
        newFilteredTeamList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      }

      setTeamList(newTeamList);
      setFilteredTeamList(newFilteredTeamList);

      // Making divisions list
      const divisions = eventResponse?.data?.getEvent?.data?.divisions ? eventResponse?.data?.getEvent?.data?.divisions : '';
      const divs = divisionsToOptionList(divisions);
      setDivisionList(divs);
    } catch (error) {
      console.log(error);

    }
  }


  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        fetchEvent()
      } else {
        setActErr({ success: false, message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }
  }, [params.eventId]);

  if(error){
    console.log(error);
    
  }


  if (loading || isLoading) return <Loader />;

  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <div className="mb-4 division-selection w-full">
        <SelectInput key="player-new-pg-1" handleSelect={handleDivisionSelection} defaultValue={currDivision} name='division' optionList={divisionList}  />
      </div>
      <h1 className='mb-8 text-center'>Add Player</h1>
      {data?.getEvent?.data && (<CurrentEvent currEvent={data?.getEvent?.data} />)}

      <PlayerAdd eventId={params.eventId} teamList={filteredTeamList} division={currDivision} />
    </div>
  )
}

export default PlayerAddPage;