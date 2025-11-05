import {
  IMatch,
  INetRelatives,
  IRoundRelatives,
  IRoundUpdateData,
} from "@/types";
import { useEffect, useMemo } from "react";
import { useSocket } from "@/lib/SocketProvider";
import { useAppDispatch } from "@/redux/hooks";
import SocketEventListener from "@/utils/socket/SocketEventListener";
import MatchCard from "./MatchCard";
import { getMatchStatus } from "@/utils/match/getMatchStatus";
import { EMatchStatus } from "@/types/match";

interface IMatchListProps {
  matchList?: IMatch[];
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

function SearchMatchList({ matchList = [] }: IMatchListProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const sortedMatches = useMemo(() => {
    const statusPriority: Record<EMatchStatus, number> = {
      [EMatchStatus.LIVE]: 0,
      [EMatchStatus.ASSIGNING]: 1,
      [EMatchStatus.SCHEDULED]: 2,
      [EMatchStatus.UPCOMING]: 2,
      [EMatchStatus.COMPLETED]: 3,
    };
  
    // helper: produce a 'day key' like "2025-10-25" (local date) to group by day
    const dayKey = (iso?: string) => {
      if (!iso) return "";
      const d = new Date(iso);
      // use local date parts to group by calendar date
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
  
    // clone array before sorting
    const ml = [...matchList].sort((a, b) => {
      // 1) primary: group by day (newest day first)
      const dayA = dayKey(a.date);
      const dayB = dayKey(b.date);
      if (dayA !== dayB) {
        // convert to timestamps for correct newest-first ordering
        const timeA = new Date(dayA).getTime();
        const timeB = new Date(dayB).getTime();
        return timeB - timeA; // newer day first
      }
  
      // 2) secondary: within same day, sort by status priority
      const statusA = getMatchStatus(a as IMatch, a.rounds as any[], a.nets);
      const statusB = getMatchStatus(b as IMatch, b.rounds, b.nets);
  
      // fallback if status not found in priority map
      const prioA = typeof statusA === "string" && statusPriority[statusA as EMatchStatus] !== undefined
        ? statusPriority[statusA as EMatchStatus]
        : Number.MAX_SAFE_INTEGER;
      const prioB = typeof statusB === "string" && statusPriority[statusB as EMatchStatus] !== undefined
        ? statusPriority[statusB as EMatchStatus]
        : Number.MAX_SAFE_INTEGER;
  
      if (prioA !== prioB) return prioA - prioB; // lower number = higher priority (LIVE first)
  
      // 3) tertiary: same day & same status — sort by exact time (newest first)
      const timeExactA = new Date(a.date).getTime();
      const timeExactB = new Date(b.date).getTime();
      return timeExactB - timeExactA;
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
