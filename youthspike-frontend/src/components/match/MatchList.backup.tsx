import { IMatchExpRel, IPlayer, ITeam } from '@/types';
import React, { useEffect, useState } from 'react';
import { useSocket } from '@/lib/SocketProvider';
import { useAppDispatch } from '@/redux/hooks';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import { EActionProcess } from '@/types/room';
import { validateMatchDatetime } from '@/utils/datetime';
import { EEventPeriod } from '@/types/event';
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
  // eslint-disable-next-line react/require-default-props
  matchList?: IMatch[];
}

// eslint-disable-next-line no-unused-vars, no-shadow
enum EMatchStatus {
  // eslint-disable-next-line no-unused-vars
  COMPLETED = 'COMPLETED',
  // eslint-disable-next-line no-unused-vars
  IN_PROGRESS = 'IN_PROGRESS',
  // eslint-disable-next-line no-unused-vars
  NOT_STARTED = 'NOT_STARTED',
}

const filterOptions = [
  {
    id: 1,
    text: EEventPeriod.CURRENT,
  },
  {
    id: 2,
    text: EEventPeriod.PAST,
  },
  {
    id: 3,
    text: EMatchStatus.COMPLETED,
  },
  {
    id: 4,
    text: EMatchStatus.IN_PROGRESS,
  },
  {
    id: 5,
    text: EMatchStatus.NOT_STARTED,
  },
];

function MatchList({ matchList }: IMatchListProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]); // update this filtered match list when a round updated

  const handleMatchFilter = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    let newMatchList = matchList ? [...matchList] : [];
    // Change filteredMatchList
    switch (inputEl.value) {
      case EEventPeriod.CURRENT:
        // validateMatchDatetime(currEvent.startDate)
        newMatchList = newMatchList.filter((nm) => validateMatchDatetime(nm.date) === EEventPeriod.CURRENT);
        break;

      case EEventPeriod.PAST:
        newMatchList = newMatchList.filter((nm) => validateMatchDatetime(nm.date) === EEventPeriod.PAST);
        break;

      case EMatchStatus.COMPLETED:
        newMatchList = newMatchList.filter((nm) => nm.completed);
        break;
      case EMatchStatus.IN_PROGRESS:
        newMatchList = newMatchList.filter((nm) => !nm.completed && nm.rounds[0].teamAProcess !== EActionProcess.INITIATE);
        break;
      case EMatchStatus.NOT_STARTED:
        newMatchList = newMatchList.filter((nm) => !nm.completed && nm.rounds[0].teamAProcess === EActionProcess.INITIATE);
        break;

      default:
        break;
    }

    setFilteredMatchList(newMatchList);
  };

  useEffect(() => {
    if (matchList) {
      setFilteredMatchList([...matchList]);
    }
  }, [matchList]);

  useEffect(() => {
    // check-in-response-to-all-pages
    if (socket) {
      const eventListener = new SocketEventListener(socket, dispatch);
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
    <div className="matchList w-full flex flex-col gap-y-4">
      <SelectInput lblTxt="Match Filter" name="matchFilter" optionList={filterOptions.map((o) => ({ text: o.text, value: o.text }))} handleSelect={handleMatchFilter} />
      {filteredMatchList &&
        filteredMatchList.map((match) => (
          // @ts-ignore 
          <MatchCard match={match} key={match._id} roundList={match?.rounds ? match.rounds : []} allNets={match?.nets ? match.nets.map((n) => ({ ...n, round: n.round._id })) : []} />
        ))}
    </div>
  );
}

export default MatchList;
