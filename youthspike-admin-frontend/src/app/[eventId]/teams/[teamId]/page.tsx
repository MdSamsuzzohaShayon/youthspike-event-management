'use client'

import Loader from '@/components/elements/Loader';
import Message from '@/components/elements/Message';
import CaptainCard from '@/components/player/CaptainCard';
import PlayerAdd from '@/components/player/PlayerAdd';
import PlayerList from '@/components/player/PlayerList';
import { GET_A_TEAM } from '@/graphql/teams';
import { IError } from '@/types';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { useLazyQuery, useQuery } from '@apollo/client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

interface TeamSingleProps {
  params: { teamId: string, eventId: string },
}

function TeamSingle({ params }: TeamSingleProps) {
  /**
   * Need to test drag and drop with mobile (important)
   * Figma Link (Page 6) - https://www.figma.com/proto/PoBQKYzuq9IgmCLZMVu9MT/Dashboard-for-spikeball-app-(Client-file)?type=design&node-id=201-1660&t=a8dHq7FKsr2km2dX-1&scaling=min-zoom&page-id=0%3A1
   * League director can change captain
   * Captain can change team player ranking
   * 
   */
  const [fetchTeam, { data, loading, error }] = useLazyQuery(GET_A_TEAM, { variables: { teamId: params.teamId } });
  const [actErr, setActErr] = useState<IError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addPlayer, setAddPlayer] = useState<boolean>(false);

  useEffect(() => {
    if (params.teamId) {
      if (isValidObjectId(params.teamId)) {
        fetchTeam({ variables: { teamId: params.teamId } });
      } else {
        setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
      }
    }

  }, [params.teamId]);

  if (loading || isLoading) return <Loader />;

  const teamData = data?.getTeam?.data;
  const eventData = data?.getTeam?.data?.event;
  const divisionList = data?.getTeam?.data?.event?.divisions ? divisionsToOptionList(data?.getTeam?.data?.event?.divisions) : [];
  const teamList = data?.getTeam?.data?.event?.teams ? data?.getTeam?.data?.event?.teams : [];


  return (
    <div className='container mx-auto px-2 min-h-screen'>
      <h1 className='uppercase text-center'>Teams/roster</h1>
      <h1 className='uppercase text-center'>{eventData?.name}</h1>

      {error && <Message error={error} />}
      {actErr && <Message error={actErr} />}

      {/* Team detail  */}
      <div className="team-detail mt-8 w-full flex justify-center flex-col items-center">
        <img src="/free-logo.svg" className='w-20' alt={teamData && teamData.name} />
        <h3 className="capitalize">{teamData && teamData.name}</h3>

      </div>

      {/* Division section  */}

      {addPlayer ? (<>
        <div className="flex w-full justify-between items-center mb-4">
          <h3 >Player Add</h3>
          <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(false)} >Player List</button>
        </div>
        <PlayerAdd setIsLoading={setIsLoading} eventId={params.eventId} update={false} setAddPlayer={setAddPlayer} divisionList={divisionList} teamList={teamList} />
      </>) : (

        <div className="bulk-operations-players mt-8">
          <div className="flex w-full justify-between items-center">
            <h3 className='mt-4'>Player List</h3>
            <button className="btn-info mt-4" type='button' onClick={() => setAddPlayer(true)} >Add Player</button>
          </div>
          <p>Make Inactive / Re-rank / A-Z</p>
          <PlayerList eventId={params.eventId} playerList={teamData ? teamData.players : []} teamId={params.teamId} setIsLoading={setIsLoading} rankControls showRank />
        </div>
      )}

      {/* Show captain  */}
      {/* <CaptainCard teamData={teamData} /> */}

    </div>
  )
}

export default TeamSingle;