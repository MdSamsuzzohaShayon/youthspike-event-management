import EventDetail from '@/components/event/EventDetail';
import { IEventPageProps, IMatchExpRel, INetRelatives, IPlayer, IRoundRelatives, ITeam } from '@/types';
import { notFound } from 'next/navigation';
import getEventWithMatches from '../_fetch/event';

// Create pagination
// Manipulate team and players properly to show all valid data
async function EventSingle({ params: { eventId } }: IEventPageProps) {
  const matchesData = await getEventWithMatches(eventId);

  if (!matchesData) {
    notFound();
  }

  // Matches,
  const { event, matches, teams, players, ldo, nets, rounds, groups, sponsors } = matchesData;

  const teamMap = new Map(teams.map((t: ITeam) => [t._id, t]));
  const roundMap = new Map<string, IRoundRelatives>(rounds.map((r: IRoundRelatives) => [r._id, r]));
  const netMap = new Map<string, INetRelatives>(nets.map((n: INetRelatives) => [n._id, n]));

  const matchList = matches.map((m: IMatchExpRel) => {
    const matchObj = { ...m };

    // @ts-ignore
    matchObj.rounds = m.rounds.map((roundId) => roundMap.get(roundId)).filter(Boolean);
    // @ts-ignore
    matchObj.nets = m.nets.map((netId) => netMap.get(netId)).filter(Boolean);

    if (teamMap.has(m.teamA)) {
      // @ts-ignore
      matchObj.teamA = teamMap.get(m.teamA);
    }
    if (teamMap.has(m.teamB)) {
      // @ts-ignore
      matchObj.teamB = teamMap.get(m.teamB);
    }

    return matchObj;
  });

  const playerList = players.map((p: IPlayer) => {
    const playerObj = { ...p };
    if (p.teams && p.teams.length > 0 && teamMap.has(p.teams[0])) {
      // @ts-ignore
      playerObj.teams = [teamMap.get(p.teams[0])];
    }
    return playerObj;
  });

  const prevEvent = structuredClone(event);
  prevEvent.ldo = ldo;
  prevEvent.groups = groups;
  prevEvent.matches = matchList;
  prevEvent.teams = teams;
  prevEvent.players = playerList;
  prevEvent.sponsors = sponsors;

  // Handle admin-specific logic for LDO_ID in the query parameters

  // Render the event details
  return (
    <div className="container mx-auto px-2 min-h-screen">
      <EventDetail event={prevEvent} />
    </div>
  );
}

export default EventSingle;
