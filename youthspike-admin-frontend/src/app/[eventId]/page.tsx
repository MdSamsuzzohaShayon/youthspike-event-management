import Teams from '@/components/teams/Teams';
import { ITeamFilter } from '@/types';
import React from 'react'

interface ITeamsPageProps {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<ITeamFilter>;
}

async function TeamsPage({
  params,
  searchParams,
}: ITeamsPageProps) {
  const { eventId } = await params;
  const {
    search = "",
    division = "",
    group = "",
  } = await searchParams;
  return (
    <div>
      <Teams eventId={eventId} search={search} division={division} group={group} />
    </div>
  )
}

export default TeamsPage;