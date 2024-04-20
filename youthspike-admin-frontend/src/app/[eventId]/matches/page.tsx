'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import SelectInput from '@/components/elements/forms/SelectInput';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import MatchAdd from '@/components/match/MatchAdd';
import MatchList from '@/components/match/MatchList';
import { GET_EVENT_WITH_MATCHES_TEAMS } from '@/graphql/matches';
import { useUser } from '@/lib/UserProvider';
import { IError, IEventExpRel, IMatch, IMatchExpRel, IOption, IRoundRelatives, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { handleResponse } from '@/utils/handleError';
import { divisionsToOptionList, getEventIdFromPath, isValidObjectId, rearrangeMenu } from '@/utils/helper';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import { useLazyQuery, useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';


function MatchesPage({ params }: { params: { eventId: string } }) {

  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addMatch, setAddMatch] = useState<boolean>(false);
  const [actErr, setActErr] = useState<IError | null>(null);
  const [currDivision, setCurrDivision] = useState<string>('');
  const [matchList, setMatchList] = useState<IMatchExpRel[]>([]);
  const [filteredMatchList, setFilteredMatchList] = useState<IMatchExpRel[]>([]);
  const [teamList, setTeamList] = useState<ITeam[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
  const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  

  // Hooks
  const user = useUser();

  // Fetch teams and players of the teams
  const [getEvent, { data, loading, error, refetch }] = useLazyQuery(GET_EVENT_WITH_MATCHES_TEAMS, { variables: { eventId: params.eventId }, fetchPolicy: "network-only" });


  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    /**
     * Filter Matches and teams
     */
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
    if (inputEl.value === '') {
      setFilteredTeamList([...teamList]);
      setFilteredMatchList([...matchList]);
      removeDivisionFromStore();
    } else {
      setDivisionToStore(inputEl.value.trim());
      const newTeamList = teamList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredTeamList([...newTeamList]);

      const newMatchList = matchList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredMatchList([...newMatchList]);

    }
  }

  const fetchEvent = async () => {
    try {

      const eventResponse = await getEvent({ variables: { eventId: params.eventId } });


      const success = handleResponse({ response: eventResponse?.data?.getEvent, setActErr });
      if (!success) return;


      const newMatchList: IMatchExpRel[] = eventResponse?.data?.getEvent?.data?.matches ? eventResponse?.data.getEvent.data.matches : [];
      let newFilteredMatchList = [...newMatchList];

      const newTeamList: ITeam[] = eventResponse?.data?.getEvent?.data?.teams ? eventResponse?.data.getEvent.data.teams : [];

      let newFilteredTeamList = [...newTeamList];

      if (eventResponse?.data?.getEvent?.data) setCurrEvent(eventResponse.data.getEvent.data);

  
      


      // Division and team value
      removeTeamFromStore();
      const divisionExist = getDivisionFromStore();
      if (divisionExist) {
        setCurrDivision(divisionExist);
        newFilteredMatchList = newMatchList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
        newFilteredTeamList = newTeamList.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      }

      setMatchList(newMatchList);
      setFilteredMatchList(newFilteredMatchList);

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

  const addMatchCB = (matchData: IMatchExpRel) => {
    setMatchList((prevState) => [...prevState, matchData]);
    setFilteredMatchList((prevState) => [...prevState, matchData]);
  }

  const refetchFunc = async () => {
    await fetchEvent();
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



  if (loading || isLoading) return <Loader />;



  return (
    <div className="container mx-auto px-2 min-h-screen">
      <h1 className='mb-8 text-center'>Matches</h1>
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

      <div className="mt-4">
        {addMatch ? <>
          {/* Only director and admin can create match  */}
          {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
            <React.Fragment>
              <button type="button" className='btn-info mb-4' onClick={() => setAddMatch(false)}>Match List</button>

              <MatchAdd eventData={currEvent} teamList={filteredTeamList} eventId={params.eventId} addMatchCB={addMatchCB}
                setActErr={setActErr} setIsLoading={setIsLoading} showAddMatch={setAddMatch} currDivision={currDivision} />
            </React.Fragment>
          )}
        </> : <>
          {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && <button type="button" className='btn-info mb-4' onClick={() => setAddMatch(true)}>Add Match</button>}
          <br />
          {filteredMatchList.length > 0 ? <MatchList eventId={params.eventId} division={currDivision} matchList={filteredMatchList} refetchFunc={refetchFunc} /> : <p>No match created yet!</p>}
        </>}
      </div>
      <br />
    </div>
  )
}

export default MatchesPage