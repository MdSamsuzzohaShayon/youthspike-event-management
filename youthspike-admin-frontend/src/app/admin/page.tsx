'use client'

import Loader from '@/components/elements/Loader';
import { GET_LDOS_LIGHT } from '@/graphql/director';
import { ILDOExpRel } from '@/types';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import React from 'react';

function AdminPage() {
  /**
   * Show list of directors
   */
  const { data, loading, error } = useQuery(GET_LDOS_LIGHT);
  if (loading) return <Loader />;

  const ldo = data?.getEventDirectors;

  const getEvents = (allLdo: ILDOExpRel[]): React.ReactNode => {
    let eventIds: string[] = [], matchIds: string[] = [], playerIds: string[] = [], teamIds: string[] = [];
    for (const l of allLdo) {
      const currEventIds: string[] = [];
      if (l.events) {
        for (const e of l.events) {
          eventIds.push(e._id);
          matchIds.push(...e.matches.map((m) => m._id));
          playerIds.push(...e.players.map((p) => p._id));
          teamIds.push(...e.teams.map((t) => t._id));
        }
      }
      eventIds.push(...currEventIds);
    }

    // @ts-ignore
    eventIds = [...new Set(eventIds)], matchIds = [...new Set(matchIds)], playerIds = [...new Set(playerIds)], teamIds = [...new Set(teamIds)];
    return <>
      <Link href={`/admin/directors`} className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center" >
        <h4>Events</h4>
        <p>{eventIds.length}</p>
      </Link>
      <Link href={`/admin/directors`} className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center" >
        <h4>Players</h4>
        <p>{playerIds.length}</p>
      </Link>
      <Link href={`/admin/directors`} className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center" >
        <h4>Matches</h4>
        <p>{matchIds.length}</p>
      </Link>
      <Link href={`/admin/directors`} className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center" >
        <h4>Teams</h4>
        <p>{teamIds.length}</p>
      </Link>
    </>;
  }


  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='mt-4 text-center'>Admin Panel</h1>
      <div className="boxes flex justify-center items-center flex-wrap w-full gap-2 mt-4">
        <Link href={`/admin/directors`} className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center" >
          <h4>Directors</h4>
          <p>{ldo?.data?.length}</p>
        </Link>
        {getEvents(ldo.data)}
      </div>
    </div>
  )
}

export default AdminPage;