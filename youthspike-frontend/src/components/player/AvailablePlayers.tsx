import cld from '@/config/cloudinary.config';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setDisabledPlayerIds, setOutOfRange, setShowTeamPlayers, setclosePSCAvailable } from '@/redux/slices/matchesSlice';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { INetRelatives, IPlayer, IPlayerRankingItemExpRel, IRoundRelatives } from '@/types';
import { ETeamPlayer, INetUpdate } from '@/types/net';
import { EPlayerStatus } from '@/types/player';
import { ETeam } from '@/types/team';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import React from 'react';

interface IAvailablePlayersProps {
  myPlayers: IPlayer[];
  currentRound: IRoundRelatives | null;
  disabledPlayerIds: string[];
  availablePlayerIds: string[];
}

function AvailablePlayers({ myPlayers, currentRound, disabledPlayerIds, availablePlayerIds }: IAvailablePlayersProps) {
  const dispatch = useAppDispatch();
  const user = useUser();

  const { prevPartner, outOfRange, selectedPlayerSpot, closePSCAvailable, selectedNet, myTeamE } = useAppSelector((state) => state.matches);
  const { nets: allNets, currentRoundNets } = useAppSelector((state) => state.nets);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((state) => state.playerRanking);

  const isValidNet = (net: INetRelatives) => net && net._id && net.round;
  const createNetPlayerObject = (net: INetRelatives, teamPlayerId: string, playerSpot: ETeamPlayer, myTeamELocal: ETeam) => {
    const netPlayerObj = {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA || null,
      teamAPlayerB: net.teamAPlayerB || null,
      teamBPlayerA: net.teamBPlayerA || null,
      teamBPlayerB: net.teamBPlayerB || null,
    };

    let enablePlayerId = null;
    if (playerSpot === ETeamPlayer.PLAYER_A) {
      if (myTeamELocal === ETeam.teamA) {
        if (netPlayerObj.teamAPlayerA) enablePlayerId = netPlayerObj.teamAPlayerA;
        netPlayerObj.teamAPlayerA = teamPlayerId;
      } else {
        if (netPlayerObj.teamBPlayerA) enablePlayerId = netPlayerObj.teamBPlayerA;
        netPlayerObj.teamBPlayerA = teamPlayerId;
      }
    } else if (playerSpot === ETeamPlayer.PLAYER_B) {
      if (myTeamELocal === ETeam.teamA) {
        if (netPlayerObj.teamAPlayerB) enablePlayerId = netPlayerObj.teamAPlayerB;
        netPlayerObj.teamAPlayerB = teamPlayerId;
      } else {
        if (netPlayerObj.teamBPlayerB) enablePlayerId = netPlayerObj.teamBPlayerB;
        netPlayerObj.teamBPlayerB = teamPlayerId;
      }
    }

    return { netPlayerObj, enablePlayerId };
  };

  const handleSelectPlayer = (e: React.SyntheticEvent, teamPlayerId: string) => {
    e.preventDefault();

    // Check selected net already have a player or not, if there is already a player remove him from disabled player

    // Vslidate selecting invalid players
    const dpIds = [...disabledPlayerIds];
    if (prevPartner) dpIds.push(prevPartner);
    if (outOfRange.length > 0) dpIds.push(...outOfRange); // Net Variance
    const dtp = !!dpIds.includes(teamPlayerId); // dtp = disabled this player
    if (dtp) return;

    dispatch(setShowTeamPlayers(false));
    if (!user || !user.token || !user.info) return;

    if (!selectedNet || !selectedPlayerSpot || !isValidNet(selectedNet)) return;

    const { netPlayerObj, enablePlayerId }: { netPlayerObj: INetUpdate; enablePlayerId: string | null } = createNetPlayerObject(selectedNet, teamPlayerId, selectedPlayerSpot, myTeamE);

    // Update all nets and current round nets
    const updatedCRN = [...currentRoundNets]; // crn = current round nets
    const updatedAllNets = [...allNets];
    const findCRN = updatedCRN.findIndex((n) => n._id === selectedNet._id);
    if (findCRN !== -1) updatedCRN[findCRN] = { ...updatedCRN[findCRN], ...netPlayerObj };
    const findAN = updatedAllNets.findIndex((n) => n._id === selectedNet._id);
    if (findAN !== -1) updatedAllNets[findAN] = { ...updatedAllNets[findAN], ...netPlayerObj };
    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedAllNets));

    // Disabled players after selecting them
    // @ts-ignore
    let dpi = [teamPlayerId, ...disabledPlayerIds]; // dpi = disabled players ids
    if (enablePlayerId) dpi = dpi.filter((d) => d !== enablePlayerId);
    if (!closePSCAvailable) dispatch(setclosePSCAvailable(true));
    dispatch(setDisabledPlayerIds(dpi));
    dispatch(setOutOfRange([]));
  };

  const playerRank = (currPlayer: IPlayer): number => {
    const rankings = [];
    if (teamBPlayerRanking) rankings.push(...teamBPlayerRanking.rankings);
    if (teamAPlayerRanking) rankings.push(...teamAPlayerRanking.rankings);
    return rankings.find((p) => p.player._id === currPlayer?._id)?.rank || 0;
  };

  const playersAscendings = (playerList: IPlayer[]): IPlayer[] => {
    const rankings: IPlayerRankingItemExpRel[] = [];
    if (teamBPlayerRanking) rankings.push(...teamBPlayerRanking.rankings);
    if (teamAPlayerRanking) rankings.push(...teamAPlayerRanking.rankings);
    const sortedRankings = rankings.sort((a, b) => a.rank - b.rank);
    const sortedPlayers: IPlayer[] = [];
    sortedRankings.forEach((pr) => {
      const findPlayer = playerList.find((pi) => pr.player._id === pi._id);
      if (findPlayer) {
        sortedPlayers.push(findPlayer);
      }
    });
    return sortedPlayers;
  };

  const allDisabledIds = [...disabledPlayerIds, prevPartner, ...outOfRange].filter(Boolean);
  const subbedPlayers = currentRound?.subs ?? [];

  return (
    <div className="player-list mt-4 w-full flex flex-col gap-1">
      {playersAscendings(myPlayers)
        .filter((player) => availablePlayerIds.includes(player._id) && player.status !== EPlayerStatus.INACTIVE && !subbedPlayers.includes(player._id))
        .map((player) => {
          const isDisabled = allDisabledIds.includes(player._id);
          return (
            <div
              key={player._id}
              className={`border-b border-gray-300 flex justify-between items-center w-full cursor-pointer ${isDisabled ? 'bg-gray-400' : 'bg-transparent'}`}
              role="presentation"
              onClick={(e) => handleSelectPlayer(e, player._id)}
            >
              <p className="w-6 h-6 text-black rounded-full bg-yellow-logo flex justify-center items-center">{playerRank(player)}</p>
              <div className="advanced-img w-10 h-10 rounded-full border-2 border-black-logo overflow-hidden">
                {player.profile ? (
                  <AdvancedImage cldImg={cld.image(player.profile.toString())} className="w-full overflow-hidden" />
                ) : (
                  <Image width={24} height={24} src="/icons/sports-man.svg" alt="sports-man" className="svg-black w-full" />
                )}
              </div>
              <p className="w-7/12 break-words capitalize">
                {player.firstName} {player.lastName}
              </p>
            </div>
          );
        })}
    </div>
  );
}

export default AvailablePlayers;
