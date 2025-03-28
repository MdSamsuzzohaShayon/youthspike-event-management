import { IMatchExpRel, IPlayer, ITeam } from '@/types';
import React, { useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/lib/SocketProvider';
import { useAppDispatch } from '@/redux/hooks';
import SocketEventListener from '@/utils/socket/SocketEventListener';
import { EActionProcess } from '@/types/room';
import { validateMatchDatetime } from '@/utils/datetime';
import { EEventPeriod } from '@/types/event';
import MatchCard from './MatchCard';
import SelectInput from '../elements/SelectInput';
import Pagination from '../elements/Pagination';

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

const ITEMS_PER_PAGE = 30;
function MatchList({ matchList }: IMatchListProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]); // update this filtered match list when a round updated
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const paginatedMatchList: IMatch[] = useMemo(() => {
    if (!filteredMatchList) return [];

    // Paginated
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTeams = filteredMatchList.slice(start, start + ITEMS_PER_PAGE);

    // inactive players won't have rankings
    return paginatedTeams;
  }, [filteredMatchList, currentPage]);

  return (
    <div className="matchList w-full flex flex-col gap-y-4">
      <SelectInput
        label="Match Filter"
        name="matchFilter"
        optionList={filterOptions.map((o, oI) => ({ id: oI + 1, text: o.text.replace(/_/g, ' '), value: o.text }))}
        handleSelect={handleMatchFilter}
      />
      {paginatedMatchList &&
        paginatedMatchList.map((match) => (
          // @ts-ignore
          <MatchCard match={match} key={match._id} roundList={match?.rounds ? match.rounds : []} allNets={match?.nets ? match.nets.map((n) => ({ ...n, round: n.round._id || n.round })) : []} />
        ))}

      <div className="w-full mt-6">
        <Pagination currentPage={currentPage} itemList={filteredMatchList || []} setCurrentPage={setCurrentPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} />
      </div>
    </div>
  );
}

export default MatchList;
