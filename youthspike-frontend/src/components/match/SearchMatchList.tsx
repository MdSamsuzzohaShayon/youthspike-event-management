import {
  IMatch,
  IMatchExpRel,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IRoundUpdateData,
  ITeam,
} from "@/types";
import React, { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/lib/SocketProvider";
import { useAppDispatch } from "@/redux/hooks";
import SocketEventListener from "@/utils/socket/SocketEventListener";
import { EActionProcess } from "@/types/room";
import { validateMatchDatetime } from "@/utils/datetime";
import { EEventPeriod } from "@/types/event";
import MatchCard from "./MatchCard";
import SelectInput from "../elements/SelectInput";
import Pagination from "../elements/Pagination";
import { getMatchStatus } from "@/utils/match/getMatchStatus";
import { EMatchStatus } from "@/types/match";

interface IMatchListProps {
  matchList?: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

// enum EMatchStatus {
//   COMPLETED = 'COMPLETED',
//   IN_PROGRESS = 'IN_PROGRESS',
//   NOT_STARTED = 'NOT_STARTED',
// }

// const filterOptions = [
//   { id: 4, text: EMatchStatus.IN_PROGRESS },
//   { id: 1, text: EEventPeriod.CURRENT },
//   { id: 2, text: EEventPeriod.PAST },
//   { id: 3, text: EMatchStatus.COMPLETED },
//   { id: 5, text: EMatchStatus.NOT_STARTED },
// ];

function SearchMatchList({ matchList = [] }: IMatchListProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const sortedMatches = useMemo(() => {
    // Live, Assigning, Scheduled, Completed
    const statusPriority: Record<EMatchStatus, number> = {
      [EMatchStatus.LIVE]: 0,
      [EMatchStatus.ASSIGNING]: 1,
      [EMatchStatus.SCHEDULED]: 2,
      [EMatchStatus.COMPLETED]: 3,
      [EMatchStatus.UPCOMING]: 2,
    };

    const ml = [...matchList].sort((a, b) => {
      const mt = getMatchStatus(a as IMatch, a.rounds as any[], a.nets);
      const mb = getMatchStatus(b as IMatch, b.rounds, b.nets);
      return statusPriority[mt] - statusPriority[mb];
    });
    return ml;
  }, [matchList]);

  // ✅ Stable event listener (doesn't reset on every list change)
  useEffect(() => {
    if (!socket) return;
    const eventListener = new SocketEventListener(socket, dispatch);

    const handleRoundUpdate = (actionData: IRoundUpdateData) =>
      eventListener.handleUpdateRoundAllPages({
        matchList,
        setMatchList: () => {}, // ✅ no need to store filtered list in state
        actionData,
      });

    const handleNetUpdate = (actionData: any) =>
      eventListener.handleUpdateNetAllPages({
        matchList,
        setMatchList: () => {},
        actionData,
      });

    socket.on("round-update-all-pages", handleRoundUpdate);
    socket.on("net-update-all-pages", handleNetUpdate);

    return () => {
      socket.off("round-update-all-pages", handleRoundUpdate);
      socket.off("net-update-all-pages", handleNetUpdate);
    };
  }, [socket, dispatch, matchList]);

  return (
    <div className="matchList w-full flex flex-col gap-y-4">
      {sortedMatches.map((match, i) => (
        <MatchCard
          key={`${match?._id}-${i}`}
          match={match}
          // @ts-ignore
          roundList={match.rounds}
          allNets={match.nets}
        />
      ))}
    </div>
  );
}

export default SearchMatchList;
