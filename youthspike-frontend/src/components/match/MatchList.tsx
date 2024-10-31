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
  divisions: string;
  // eslint-disable-next-line react/require-default-props
  matchList?: IMatch[];
}

function MatchList({ matchList, divisions }: IMatchListProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]); // update this filtered match list when a round updated
  const [divisionList, setDivisionList] = useState<IOption[]>([]);

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    if (inputEl.value === '') {
      if (matchList) setFilteredMatchList([...matchList]);
    } else {
      const filteredItems = matchList?.filter((m) => m.division && m.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      if (filteredItems) setFilteredMatchList([...filteredItems]);
    }
  };

  useEffect(() => {
    if (matchList && matchList.length > 0) {
      setFilteredMatchList([...matchList]);
    }

    if (divisions && divisions !== '') {
      const divOptionList = divisionsToOptionList(divisions);
      setDivisionList(divOptionList);
    }
  }, [matchList, divisions]);

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
      <SelectInput handleSelect={handleDivisionChange} name="division" optionList={divisionList} lblTxt="Division" rw="w-3/6" />

      {filteredMatchList.map((match) => (
        <MatchCard match={match} key={match._id} roundList={match?.rounds ? match.rounds : []} />
      ))}
    </div>
  );
}

export default MatchList;
