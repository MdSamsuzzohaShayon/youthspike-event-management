import { IMatch, IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, ITeam } from '@/types';
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



interface IMatchListProps {
  matchList?: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

enum EMatchStatus {
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  NOT_STARTED = 'NOT_STARTED',
}

const filterOptions = [
  { id: 4, text: EMatchStatus.IN_PROGRESS },
  { id: 1, text: EEventPeriod.CURRENT },
  { id: 2, text: EEventPeriod.PAST },
  { id: 3, text: EMatchStatus.COMPLETED },
  { id: 5, text: EMatchStatus.NOT_STARTED },
];

const ITEMS_PER_PAGE = 30;

function MatchList({ matchList = [], nets, rounds }: IMatchListProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filter, setFilter] = useState<string | null>(null);

  // ✅ Pre-index rounds by matchId for O(1) lookup
  const roundsByMatch = useMemo(() => {
    const map = new Map<string, IRoundRelatives[]>();
    for (const r of rounds) {
      if (!map.has(r.match)) map.set(r.match, []);
      map.get(r.match)!.push(r);
    }
    return map;
  }, [rounds]);

  // ✅ Pre-map nets once instead of recalculating every render
  const normalizedNets = useMemo(
    // @ts-ignore
    () => nets.map((n) => ({ ...n, round: n.round?._id || n.round })),
    [nets]
  );

  // ✅ Compute filtered matches on demand
  const filteredMatchList = useMemo(() => {
    if (!filter) return matchList;

    switch (filter) {
      case EEventPeriod.CURRENT:
        return matchList.filter((m) => validateMatchDatetime(m.date) === EEventPeriod.CURRENT);
      case EEventPeriod.PAST:
        return matchList.filter((m) => validateMatchDatetime(m.date) === EEventPeriod.PAST);
      case EMatchStatus.COMPLETED:
        return matchList.filter((m) => m.completed);
      case EMatchStatus.IN_PROGRESS:
        return matchList.filter(
          (m) => !m.completed && m.rounds[0].teamAProcess !== EActionProcess.INITIATE
        );
      case EMatchStatus.NOT_STARTED:
        return matchList.filter(
          (m) => !m.completed && m.rounds[0].teamAProcess === EActionProcess.INITIATE
        );
      default:
        return matchList;
    }
  }, [matchList, filter]);

  // ✅ Paginate without copying arrays
  const paginatedMatchList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMatchList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMatchList, currentPage]);

  // ✅ Stable event listener (doesn't reset on every list change)
  useEffect(() => {
    if (!socket) return;
    const eventListener = new SocketEventListener(socket, dispatch);

    const handleRoundUpdate = (actionData: any) =>
      eventListener.handleUpdateRoundAllPages({
        matchList: filteredMatchList,
        setMatchList: () => {}, // ✅ no need to store filtered list in state
        actionData,
      });

    const handleNetUpdate = (actionData: any) =>
      eventListener.handleUpdateNetAllPages({
        matchList: filteredMatchList,
        setMatchList: () => {},
        actionData,
      });

    socket.on('round-update-all-pages', handleRoundUpdate);
    socket.on('net-update-all-pages', handleNetUpdate);

    return () => {
      socket.off('round-update-all-pages', handleRoundUpdate);
      socket.off('net-update-all-pages', handleNetUpdate);
    };
  }, [socket, dispatch, filteredMatchList]);

  return (
    <div className="matchList w-full flex flex-col gap-y-4">
      <SelectInput
        label="Match Filter"
        name="matchFilter"
        optionList={filterOptions.map((o, i) => ({
          id: i + 1,
          text: o.text.replace(/_/g, ' '),
          value: o.text,
        }))}
        defaultValue={filterOptions[0].id}
        handleSelect={(e) => setFilter((e.target as HTMLSelectElement).value)}
      />

      {paginatedMatchList.map((match) => (
        <MatchCard
          key={match._id}
          match={match}
          // @ts-ignore
          roundList={roundsByMatch.get(match._id) || []}
          allNets={normalizedNets}
        />
      ))}

      <div className="w-full mt-6">
        <Pagination
          currentPage={currentPage}
          itemList={filteredMatchList}
          setCurrentPage={setCurrentPage}
          ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
}

export default MatchList;
