// components/match/MatchesMainContainer.tsx
'use client';

import { useReadQuery } from '@apollo/client';
import { QueryRef } from '@apollo/client';
import MatchesMain from './MatchesMain';
import { IEventWithMatchesResponse, IGroupExpRel, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam } from '@/types';



interface IMatchesMainContainerProps {
  queryRef: QueryRef<IEventWithMatchesResponse>;
  eventId: string;
}

function MatchesMainContainer({ queryRef, eventId }: IMatchesMainContainerProps) {
  const { data } = useReadQuery(queryRef);
  
  
  if (!data?.getEventWithMatches) {
    return <div>Event not found</div>;
  }

  const { event, matches, teams, nets, rounds, groups } = data.getEventWithMatches.data;


  // Create lookup maps for efficient data access - O(n) time complexity
  const teamMap = createLookupMap(teams);
  const roundMap = createLookupMap(rounds);
  const netMap = createLookupMap(nets);

  // Process matches with proper error boundaries - O(m) time complexity where m is matches count
  const processedMatches = processMatches(matches, teamMap, roundMap, netMap);
  
  // Process groups - O(g) time complexity where g is groups count
  const processedGroups = processGroups(groups, teamMap);


  return (
    <MatchesMain 
      matches={processedMatches}
      teams={teams}
      groups={processedGroups}
      currEvent={event}
    />
  );
}

// Generic lookup map creator - reusable utility function
function createLookupMap<T extends { _id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  (items || []).forEach(item => {
    if (item?._id) {
      map.set(item._id, item);
    }
  });
  return map;
}

// Process matches with proper type safety
function processMatches(
  matches: IMatchExpRel[],
  teamMap: Map<string, ITeam>,
  roundMap: Map<string, IRoundRelatives>,
  netMap: Map<string, INetRelatives>
): IMatchExpRel[] {
  return (matches || []).map(match => ({
    ...match,
    rounds: resolveReferences(match.rounds, roundMap),
    nets: resolveReferences(match.nets, netMap),
    teamA: resolveTeam(match.teamA, teamMap) as ITeam,
    teamB: resolveTeam(match.teamB, teamMap)  as ITeam,
  }));
}

// Generic reference resolver - handles both string IDs and object references
function resolveReferences<T>(
  references: (string | T)[] | undefined,
  lookupMap: Map<string, T>
): T[] {
  if (!Array.isArray(references)) return [];

  return references.flatMap(ref => {
    if (typeof ref === 'string') {
      return lookupMap.get(ref) || [];
    } else if (typeof ref === 'object' && ref !== null) {
      return [ref as T];
    }
    return [];
  });
}

// Team resolver with proper type safety
function resolveTeam(
  team: string | ITeam | undefined,
  teamMap: Map<string, ITeam>
): ITeam | undefined {
  if (!team) return undefined;
  
  if (typeof team === 'string') {
    return teamMap.get(team);
  }
  
  return team;
}

// Process groups with proper type safety
function processGroups(
  groups: IGroupExpRel[],
  teamMap: Map<string, ITeam>
): IGroupExpRel[] {
  return (groups || []).map((group) => ({
    ...group,
    teams: resolveReferences(group.teams, teamMap), 
  }));
}

export default MatchesMainContainer;