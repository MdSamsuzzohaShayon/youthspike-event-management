import { IMatch, INetRelatives, IRoundRelatives } from '@/types';
import MatchCard from './MatchCard';
import { EMatchStatus } from '@/types/match';
import { useMemo } from 'react';
import { getMatchStatus } from '@/utils/match';
import { useError } from '@/lib/ErrorProvider';

interface IMatchListProps {
  matchList?: IMatch[];
  eventId: string;
}

function SearchMatchList({ matchList = [], eventId }: IMatchListProps) {
  const { setActErr } = useError();

  const sortedMatches = useMemo(() => {
    const statusPriority: Record<EMatchStatus, number> = {
      [EMatchStatus.LIVE]: 0,
      [EMatchStatus.ASSIGNING]: 1,
      [EMatchStatus.IN_PROGRESS]: 1,
      [EMatchStatus.SCHEDULED]: 2,
      [EMatchStatus.NOT_STARTED]: 2,
      [EMatchStatus.UPCOMING]: 2,
      [EMatchStatus.COMPLETED]: 3,
    };

    // helper: produce a 'day key' like "2025-10-25" (local date) to group by day
    const dayKey = (iso?: string) => {
      if (!iso) return '';
      const d = new Date(iso);
      // use local date parts to group by calendar date
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
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
      const statusA = getMatchStatus(a as IMatch, a?.rounds || [], a.nets);
      const statusB = getMatchStatus(b as IMatch, b.rounds, b.nets);

      // fallback if status not found in priority map
      const prioA = typeof statusA === 'string' && statusPriority[statusA as EMatchStatus] !== undefined ? statusPriority[statusA as EMatchStatus] : Number.MAX_SAFE_INTEGER;
      const prioB = typeof statusB === 'string' && statusPriority[statusB as EMatchStatus] !== undefined ? statusPriority[statusB as EMatchStatus] : Number.MAX_SAFE_INTEGER;

      if (prioA !== prioB) return prioA - prioB; // lower number = higher priority (LIVE first)

      // 3) tertiary: same day & same status — sort by exact time (newest first)
      const timeExactA = new Date(a.date).getTime();
      const timeExactB = new Date(b.date).getTime();
      return timeExactB - timeExactA;
    });

    return ml;
  }, [matchList]);

  return (
    <div className="matchList w-full flex flex-col gap-y-4">
      {sortedMatches.map((match, i) => (
        <MatchCard key={`${match?._id}-${i}`} match={match} eventId={eventId} handleSelectMatch={() => {}} isChecked={false} setActErr={setActErr} sl={i + 1} />
      ))}
    </div>
  );
}

export default SearchMatchList;
