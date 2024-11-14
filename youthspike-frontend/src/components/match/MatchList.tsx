import { IMatchExpRel, IPlayer, ITeam, IOption } from '@/types';
import React, { useEffect, useState } from 'react';
import { divisionsToOptionList } from '@/utils/helper';
import { useSocket } from '@/lib/SocketProvider';
import { useAppDispatch } from '@/redux/hooks';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import MatchCard from './MatchCard';
import SelectInput from '../elements/SelectInput';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface IMatchListProps {
  division: string | null;
  // eslint-disable-next-line react/require-default-props
  matchList?: IMatch[];
}

function MatchList({ matchList, division }: IMatchListProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]); // update this filtered match list when a round updated




  useEffect(() => {
    // check-in-response-to-all-pages
    if (socket) {
      const eventListener = new SocketEventListener(socket, dispatch);
      console.log(filteredMatchList);

      // Update match list
      socket.on('round-update-all-pages', (actionData) => eventListener.handleUpdateRoundAllPages({ matchList: filteredMatchList, setMatchList: setFilteredMatchList, actionData }));
      socket.on('net-update-all-pages', (actionData) => eventListener.handleUpdateNetAllPages({ matchList: filteredMatchList, setMatchList: setFilteredMatchList, actionData }));
    }

    return () => {
      socket?.off('round-update-all-pages');
      socket?.off('net-update-all-pages');
    };
  }, [dispatch, socket, filteredMatchList]);

  return (
    <div className="matchList w-full flex flex-col gap-1">
      {matchList && matchList.map((match) => (
        <MatchCard match={match} key={match._id} roundList={match?.rounds ? match.rounds : []} allNets={match?.nets ? match.nets.map((n) => ({ ...n, round: n.round._id })) : []} />
      ))}
    </div>
  );
}

export default MatchList;
