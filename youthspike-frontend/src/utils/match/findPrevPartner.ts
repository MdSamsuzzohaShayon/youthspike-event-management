/* eslint-disable no-restricted-syntax */
import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';

interface IPrevPartnerProps {
  roundList: IRoundRelatives[];
  currRound: IRoundRelatives | null;
  allNets: INetRelatives[];
  myTeamE: ETeam;
  net?: INetRelatives | null | undefined;
}

function findPrevPartner({ roundList, currRound, allNets, myTeamE, net }: IPrevPartnerProps): string | null {
  if (!currRound || !net) return null; // Early exit for invalid inputs

  // Preprocess `allNets` into a Map grouped by `round`
  const netsByRound = new Map<string, INetRelatives[]>();
  for (const n of allNets) {
    if (!netsByRound.has(n.round)) {
      netsByRound.set(n.round, []);
    }
    netsByRound.get(n.round)!.push(n);
  }

  // Find the current round index directly
  const currRoundIndex = roundList.findIndex((round) => round._id === currRound._id);
  if (currRoundIndex <= 0) return null; // No previous round exists

  // Get the previous round's nets using the preprocessed Map
  const prevRoundId = roundList[currRoundIndex - 1]._id;
  const prevRoundNets = netsByRound.get(prevRoundId) || [];

  // Determine team keys
  const isTeamA = myTeamE === ETeam.teamA;
  const playerKey = isTeamA ? 'teamAPlayerA' : 'teamBPlayerA';
  const partnerKey = isTeamA ? 'teamAPlayerB' : 'teamBPlayerB';

  // Find the net from the previous round that matches the current net's players
  const prevPlayedNet = prevRoundNets.find((prn) => prn[playerKey] === net[playerKey] || prn[partnerKey] === net[playerKey]);

  if (!prevPlayedNet) return null;

  // Return the partner ID based on the matching player
  const partnerId = prevPlayedNet[playerKey] === net[playerKey] ? prevPlayedNet[partnerKey] : prevPlayedNet[playerKey];
  return partnerId || null;
}

export default findPrevPartner;
