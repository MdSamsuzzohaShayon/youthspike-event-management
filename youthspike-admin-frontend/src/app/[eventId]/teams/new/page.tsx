'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import SelectInput from '@/components/elements/forms/SelectInput';
import CurrentEvent from '@/components/event/CurrentEvent';
import UserMenuList from '@/components/layout/UserMenuList';
import TeamAdd from '@/components/teams/TeamAdd';
import { GET_EVENT_WITH_PLAYERS, GET_PLAYERS } from '@/graphql/players';
import { useError } from '@/lib/ErrorContext';
import { IError, IEventExpRel, IGroup, IOption, ITeam } from '@/types';
import { IPlayer } from '@/types/player';
import { handleResponse } from '@/utils/handleError';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import { useLazyQuery } from '@apollo/client';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface ITeamsPageProps {
  params: { eventId: string }
}

function TeamsPage({ params }: ITeamsPageProps) {
  // Hooks
  const router = useRouter();
  const pathname = usePathname();
  const { setActErr } = useError();


  // Local State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<IPlayer[]>([]);
  const [groupList, setGroupList] = useState<IGroup[]>([]);
  const [filteredGroupList, setFilteredGroupList] = useState<IGroup[]>([]); // Filter according to division
  const [currEvent, setCurrEvent] = useState<IEventExpRel | null>(null);
  const [currDivision, setCurrDivision] = useState<string>('');
  const [divisionList, setDivisionList] = useState<IOption[]>([]);

  // GraphQL
  const [getPlayers, { loading, data, error, refetch }] = useLazyQuery(GET_EVENT_WITH_PLAYERS);


  const handleClose = (e: React.SyntheticEvent) => {
    e.preventDefault();
  }

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    /**
     * Filter Matches and teams
     */
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
    if (inputEl.value === '') {
      setFilteredPlayers([...availablePlayers]);
      removeDivisionFromStore();
    } else {
      setDivisionToStore(inputEl.value.trim());
      const npList = availablePlayers.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredPlayers([...npList]);
      const ngList = groupList.filter((g)=> g.division.toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredGroupList(ngList);
    }
  }


  const fetchPlayers = async () => {
    const playerRes = await getPlayers({ variables: { eventId: params.eventId }, fetchPolicy: "network-only" });
    const success = await handleResponse({ response: playerRes?.data?.getEvent, setActErr });
    if (!success) return;

    if (playerRes?.data?.getEvent?.data) setCurrEvent(playerRes.data.getEvent.data);

    const napList: IPlayer[] = playerRes?.data?.getEvent?.data?.players ? playerRes.data.getEvent.data.players.filter((p: IPlayer) => !p.teams || p.teams.length === 0) : []; // nap List = new available players List
    let nfpList = [...napList]; // fnp List = new filtered player List

    const ngList: IGroup[] = playerRes.data.getEvent.data.groups ?? [];
    let nfgList = [...ngList];
    // if (playerRes?.data?.getEvent?.data?.groups) setGroupList(playerRes.data.getEvent.data.groups);

    // Division and player value
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
      nfpList = napList.filter((p) => p.division && p.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      nfgList = ngList.filter((g) => g.division && g.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
    }

    setAvailablePlayers(napList);
    setFilteredPlayers(nfpList);
    setGroupList(ngList);
    setFilteredGroupList(nfgList);

    // Making divisions list
    const divisions = playerRes?.data?.getEvent?.data?.divisions ? playerRes?.data?.getEvent?.data?.divisions : '';
    const divs = divisionsToOptionList(divisions);
    setDivisionList(divs);
  }


  const teamAddCB = async (teamData: ITeam) => {
    // await fetchPlayers();
  }

  useEffect(() => {
    (async () => {
      if (params.eventId) {
        if (isValidObjectId(params.eventId)) {
          fetchPlayers();
        } else {
          setActErr({ success: false, message: "Can not fetch data due to invalid event ObjectId!" })
        }
      }
    })()
  }, [router, pathname, params.eventId]);

  if (loading || isLoading) return <Loader />;

  if(error){
    console.log(error)
  }

  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='mb-8 text-center'>Teams</h1>
      {currEvent && (<CurrentEvent currEvent={currEvent} />)}
      <div className="navigator mb-4">
        <UserMenuList eventId={params.eventId} />
      </div>
      {error && <Message error={error} />}
      <div className="mt-2 division-selection w-full">
        <SelectInput key="teams-new-pg-1" handleSelect={handleDivisionSelection} defaultValue={currDivision} name='division' optionList={divisionList} vertical extraCls='text-center' />
      </div>
      <TeamAdd groupList={filteredGroupList} setIsLoading={setIsLoading} availablePlayers={filteredPlayers} handleClose={handleClose} eventId={params.eventId}
        setAvailablePlayers={setFilteredPlayers} currDivision={currDivision} teamAddCB={teamAddCB} />
    </div>
  )
}

export default TeamsPage;