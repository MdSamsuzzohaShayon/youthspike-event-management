'use client';

import Loader from '@/components/elements/Loader';
import TeamAdd from '@/components/teams/TeamAdd';
import { IEvent, IGroup, IPlayer, ITeam } from '@/types';
import React, { useState } from 'react';


interface ITeamUpdateMainProps {
  groups: IGroup[];
  team: ITeam;
  eventId: string;
  players: IPlayer[];
  divisions: string;
}

function TeamUpdateMain({ groups, team, eventId, players, divisions }: ITeamUpdateMainProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleClose = () => {};

  const handleRefetch = async () => {
    // You can call refetch here to manually refetch the data
    // await refetch({ variables: { teamId: params.teamId } });
    window.location.reload();
  };

  if (isLoading) return <Loader />;

  return (
    <div className="add-team-wrapper w-full">
      {team && (
        <TeamAdd
          groupList={groups}
          events={team?.events ? (team.events as IEvent[]) : []}
          players={players}
          handleClose={handleClose}
          setIsLoading={setIsLoading}
          prevTeam={team}
          update
        />
      )}
    </div>
  );
}

export default TeamUpdateMain;
