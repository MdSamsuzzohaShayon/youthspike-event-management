import { useUser } from "@/lib/UserProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setDisabledPlayerIds,
  setOutOfRange,
  setShowTeamPlayers,
  setclosePSCAvailable,
} from "@/redux/slices/matchesSlice";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import {
  INetRelatives,
  IPlayer,
  IPlayerRankingItemExpRel,
  IRoundRelatives,
} from "@/types";
import { ETeamPlayer, INetUpdate } from "@/types/net";
import { EPlayerStatus } from "@/types/player";
import { ETeam } from "@/types/team";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import React, { useCallback, useMemo } from "react";

interface IAvailablePlayersProps {
  myPlayers: IPlayer[];
  currentRound: IRoundRelatives | null;
  disabledPlayerIds: string[];
  availablePlayerIds: string[];
}

function AvailablePlayers({
  myPlayers,
  currentRound,
  disabledPlayerIds,
  availablePlayerIds,
}: IAvailablePlayersProps) {
  const dispatch = useAppDispatch();
  const user = useUser();

  const {
    prevPartner,
    outOfRange,
    selectedPlayerSpot,
    closePSCAvailable,
    selectedNet,
    myTeamE,
  } = useAppSelector((state) => state.matches);
  const { nets: allNets, currentRoundNets } = useAppSelector(
    (state) => state.nets
  );
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector(
    (state) => state.playerRanking
  );

  // Memoize validation function
  const isValidNet = useCallback((net: INetRelatives) => net && net._id && net.round, []);

  // Memoize player ranking data
  const playerRankings = useMemo(() => {
    const rankings: IPlayerRankingItemExpRel[] = [];
    if (teamBPlayerRanking?.rankings) rankings.push(...teamBPlayerRanking.rankings);
    if (teamAPlayerRanking?.rankings) rankings.push(...teamAPlayerRanking.rankings);
    return rankings;
  }, [teamAPlayerRanking, teamBPlayerRanking]);

  // Create a map for O(1) player rank lookup
  const playerRankMap = useMemo(() => {
    const map = new Map<string, number>();
    playerRankings.forEach(pr => {
      map.set(pr.player._id, pr.rank);
    });
    return map;
  }, [playerRankings]);

  // Memoize sorted players
  const sortedPlayers = useMemo(() => {
    const rankingsMap = new Map<string, number>();
    playerRankings.forEach(pr => {
      rankingsMap.set(pr.player._id, pr.rank);
    });

    return [...myPlayers].sort((a, b) => {
      const rankA = rankingsMap.get(a._id) || Infinity;
      const rankB = rankingsMap.get(b._id) || Infinity;
      return rankA - rankB;
    });
  }, [myPlayers, playerRankings]);

  // Memoize filtered and available players
  // Memoize filtered and available players with unique _id
const filteredPlayers = useMemo(() => {
  const subbedPlayers = new Set(currentRound?.subs ?? []);
  const uniquePlayersMap = new Map<string, IPlayer>();

  [...sortedPlayers].forEach(player => {
    if (
      availablePlayerIds.includes(player._id) &&
      player.status !== EPlayerStatus.INACTIVE &&
      !subbedPlayers.has(player._id)
    ) {
      uniquePlayersMap.set(player._id, player); // last occurrence wins
    }
  });

  return Array.from(uniquePlayersMap.values());
}, [sortedPlayers, availablePlayerIds, currentRound?.subs]);


  // Memoize all disabled IDs
  const allDisabledIds = useMemo(() => {
    const disabledSet = new Set(disabledPlayerIds);
    if (prevPartner) disabledSet.add(prevPartner);
    outOfRange.forEach(id => disabledSet.add(id));
    return disabledSet;
  }, [disabledPlayerIds, prevPartner, outOfRange]);

  // Memoize createNetPlayerObject function
  const createNetPlayerObject = useCallback((
    net: INetRelatives,
    teamPlayerId: string,
    playerSpot: ETeamPlayer,
    myTeamELocal: ETeam
  ) => {
    const netPlayerObj: INetUpdate = {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA || null,
      teamAPlayerB: net.teamAPlayerB || null,
      teamBPlayerA: net.teamBPlayerA || null,
      teamBPlayerB: net.teamBPlayerB || null,
    };

    let enablePlayerId: string | null = null;
    
    if (playerSpot === ETeamPlayer.PLAYER_A) {
      if (myTeamELocal === ETeam.teamA) {
        enablePlayerId = netPlayerObj.teamAPlayerA || null;
        netPlayerObj.teamAPlayerA = teamPlayerId;
      } else {
        enablePlayerId = netPlayerObj.teamBPlayerA || null;
        netPlayerObj.teamBPlayerA = teamPlayerId;
      }
    } else if (playerSpot === ETeamPlayer.PLAYER_B) {
      if (myTeamELocal === ETeam.teamA) {
        enablePlayerId = netPlayerObj.teamAPlayerB || null;
        netPlayerObj.teamAPlayerB = teamPlayerId;
      } else {
        enablePlayerId = netPlayerObj.teamBPlayerB || null;
        netPlayerObj.teamBPlayerB = teamPlayerId;
      }
    }

    return { netPlayerObj, enablePlayerId };
  }, []);

  // Optimized handleSelectPlayer
  const handleSelectPlayer = useCallback((
    e: React.SyntheticEvent,
    teamPlayerId: string
  ) => {
    e.preventDefault();

    // Early return checks
    if (allDisabledIds.has(teamPlayerId)) return;
    if (!user?.token || !user?.info) return;
    if (!selectedNet || !selectedPlayerSpot || !isValidNet(selectedNet)) return;

    dispatch(setShowTeamPlayers(false));

    // Set player for a specific net spot
    const { netPlayerObj, enablePlayerId } = createNetPlayerObject(
      selectedNet,
      teamPlayerId,
      selectedPlayerSpot,
      myTeamE
    );

    // Update nets more efficiently
    const updatedCRN = currentRoundNets.map(net => 
      net._id === selectedNet._id ? { ...net, ...netPlayerObj } : net
    );
    const updatedAllNets = allNets.map(net => 
      net._id === selectedNet._id ? { ...net, ...netPlayerObj } : net
    );

    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedAllNets));

    // Update disabled players
    const newDisabledIds = new Set(disabledPlayerIds);
    newDisabledIds.add(teamPlayerId);
    if (enablePlayerId) newDisabledIds.delete(enablePlayerId);
    
    if (!closePSCAvailable) dispatch(setclosePSCAvailable(true));
    dispatch(setDisabledPlayerIds(Array.from(newDisabledIds)));
    dispatch(setOutOfRange([]));
  }, [
    allDisabledIds,
    user,
    selectedNet,
    selectedPlayerSpot,
    isValidNet,
    createNetPlayerObject,
    myTeamE,
    currentRoundNets,
    allNets,
    disabledPlayerIds,
    closePSCAvailable,
    dispatch
  ]);

  // Memoize player rank function
  const playerRank = useCallback((playerId: string): number => {
    return playerRankMap.get(playerId) || 0;
  }, [playerRankMap]);

  return (
    <div className="player-list mt-4 w-full flex flex-col gap-1">
      {filteredPlayers.map((player) => {
        const isDisabled = allDisabledIds.has(player._id);
        return (
          <div
            key={player._id}
            className={`border-b border-gray-300 flex justify-between items-center w-full cursor-pointer ${
              isDisabled ? "bg-gray-400" : "bg-transparent"
            }`}
            role="presentation"
            onClick={(e) => handleSelectPlayer(e, player._id)}
          >
            <p className="w-6 h-6 text-black rounded-full bg-yellow-logo flex justify-center items-center">
              {playerRank(player._id)}
            </p>
            <div className="advanced-img w-10 h-10 rounded-full border-2 border-black-logo overflow-hidden">
              {player.profile ? (
                <CldImage
                  alt={player.firstName}
                  width="200"
                  height="200"
                  className="w-full overflow-hidden"
                  src={player.profile}
                />
              ) : (
                <Image
                  width={24}
                  height={24}
                  src="/icons/sports-man.svg"
                  alt="sports-man"
                  className="svg-black w-full"
                />
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

export default React.memo(AvailablePlayers);