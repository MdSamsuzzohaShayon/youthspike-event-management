import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EPlayerStatus, IPlayer } from "@/types";
import { ETeam } from "@/types/team";
import { ETeamPlayer, INetRelatives } from "@/types/net";
import { useUser } from "@/lib/UserProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { border } from "@/utils/styles";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import {
  setDisabledPlayerIds,
  setOutOfRange,
  setPlayerSpot,
  setPrevPartner,
  setSelectedNet,
  setShowTeamPlayers,
} from "@/redux/slices/matchesSlice";
import { EActionProcess } from "@/types/room";
import PlayerScoreCard from "../player/PlayerScoreCard";
import { getNetPlayerId, updateNetPlayer } from "@/utils/netHelpers";
import {
  createRankMap,
  findPrevPartnerId,
  getOutOfRangePlayerIds,
  organizeRankings,
} from "@/utils/assignStrategies/assignmentHelpers";

interface Props {
  teamE: ETeam;
  net: INetRelatives | null;
  onTop: boolean;
}

function NetTeamSelect({ teamE, net, onTop }: Props) {
  const { token, info } = useUser();
  const dispatch = useAppDispatch();

  const { currentRoundNets, nets: allNets } = useAppSelector((s) => s.nets);
  const { current: currentRound, roundList } = useAppSelector((s) => s.rounds);
  const { disabledPlayerIds, match, myPlayers, opPlayers, myTeamE } = useAppSelector((s) => s.matches);
  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector((s) => s.playerRanking);

  // Derived Data
  const myActivePlayers = useMemo(
    () => myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [myPlayers]
  );

  const opponentActivePlayers = useMemo(
    () => opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [opPlayers]
  );

  const [players, setPlayers] = useState<{ A: IPlayer | null; B: IPlayer | null }>({ A: null, B: null });
  const [ranks, setRanks] = useState<{ A: number | null; B: number | null }>({ A: null, B: null });
  const [pairScore, setPairScore] = useState<number | null>(null);

  const findPlayer = useCallback(
    (spot: ETeamPlayer, isMyTeam: boolean): IPlayer | null => {
      if (!net) return null;
      const teamToCheck = isMyTeam ? myTeamE : myTeamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA;
      const playerId = getNetPlayerId(net, teamToCheck, spot);
      const list = isMyTeam ? myActivePlayers : opponentActivePlayers;
      return list.find((p) => p._id === playerId) || null;
    },
    [net, myTeamE, myActivePlayers, opponentActivePlayers]
  );

  const handleEvacuatePlayer = useCallback((spot: ETeamPlayer) => {
    if (!token || !info || !net) return;

    const playerId = getNetPlayerId(net, myTeamE, spot);
    const updatedNet = updateNetPlayer(net, myTeamE, spot, null);

    const updateList = (list: INetRelatives[]) =>
      list.map((n) => (n._id === net._id ? updatedNet : n));

    dispatch(setCurrentRoundNets(updateList(currentRoundNets)));
    dispatch(setNets(updateList(allNets)));
    dispatch(setDisabledPlayerIds(disabledPlayerIds.filter((id) => id !== playerId)));
    dispatch(setShowTeamPlayers(false));
    dispatch(setOutOfRange([]));
  }, [token, info, net, myTeamE, currentRoundNets, allNets, disabledPlayerIds, dispatch]);

  const handleDropdownPlayer = useCallback((e: React.SyntheticEvent, spot: ETeamPlayer) => {
    e.preventDefault();
    if (!token || !info || !currentRound || !net) return;

    const isValidProcess =
      currentRound.teamAProcess === EActionProcess.CHECKIN ||
      currentRound.teamBProcess === EActionProcess.CHECKIN;
    if (!isValidProcess) return;

    dispatch(setShowTeamPlayers(true));
    dispatch(setPlayerSpot(spot));
    dispatch(setSelectedNet(net));

    // 1. Prepare ranking maps
    const { myRankings, opRankings } = organizeRankings({
      myTeamE,
      teamAPlayerRanking,
      teamBPlayerRanking,
    });
    const myRankingsMap = createRankMap(myRankings);
    const opRankingsMap = createRankMap(opRankings);

    // 2. Disable already used players in this round
    const usedIds = currentRoundNets.flatMap((n) =>
      myTeamE === ETeam.teamA
        ? [n.teamAPlayerA, n.teamAPlayerB]
        : [n.teamBPlayerA, n.teamBPlayerB]
    ).filter(Boolean) as string[];

    const currentDisabledIds = [...new Set([...disabledPlayerIds, ...usedIds])];
    dispatch(setDisabledPlayerIds(currentDisabledIds));

    // 3. Find previous partner of the player ALREADY in the other spot
    const isTeamA = myTeamE === ETeam.teamA;
    const otherSpotId = spot === ETeamPlayer.PLAYER_A
      ? (isTeamA ? net.teamAPlayerB : net.teamBPlayerB)
      : (isTeamA ? net.teamAPlayerA : net.teamBPlayerA);

    const previousPartnerId = otherSpotId
      ? findPrevPartnerId(roundList, currentRound, allNets, myTeamE, otherSpotId)
      : null;

    dispatch(setPrevPartner(previousPartnerId || null));

    // 4. Find out of range players based on variance
    const outOfRangeIds = getOutOfRangePlayerIds(
      myActivePlayers,
      net,
      myTeamE,
      spot,
      myRankingsMap,
      opRankingsMap,
      match?.netVariance
    );

    dispatch(setOutOfRange(outOfRangeIds));
  }, [token, info, currentRound, net, myTeamE, teamAPlayerRanking, teamBPlayerRanking, currentRoundNets, allNets, disabledPlayerIds, myActivePlayers, match, dispatch]);

  // Effects
  useEffect(() => {
    const playerA = findPlayer(ETeamPlayer.PLAYER_A, !onTop);
    const playerB = findPlayer(ETeamPlayer.PLAYER_B, !onTop);

    const { myRankings, opRankings } = organizeRankings({ myTeamE, teamAPlayerRanking, teamBPlayerRanking });
    const myRankingsMap = createRankMap([...myRankings, ...opRankings]);

    const rankA = playerA ? myRankingsMap.get(playerA._id) ?? null : null;
    const rankB = playerB ? myRankingsMap.get(playerB._id) ?? null : null;

    setPlayers({ A: playerA, B: playerB });
    setRanks({ A: rankA, B: rankB });
    
    const score = (rankA !== null && rankB !== null) ? rankA + rankB : null;
    setPairScore(score);
  }, [findPlayer, onTop, myTeamE, teamAPlayerRanking, teamBPlayerRanking]);

  const showPlayers = useMemo(() => {
    if (!match?.extendedOvertime) return true;
    return !onTop || (currentRound?.teamAProcess === EActionProcess.LINEUP && currentRound?.teamBProcess === EActionProcess.LINEUP);
  }, [match, onTop, currentRound]);

  const bothSubmitted = currentRound?.teamAProcess === EActionProcess.LINEUP && currentRound?.teamBProcess === EActionProcess.LINEUP;

  return (
    <div
      style={{ minHeight: "50%" }}
      className={`w-full px-2 flex ${onTop ? "flex-col bg-[radial-gradient(circle,_#4b4a4a_0%,_#000000_100%)] text-white" : "flex-col-reverse bg-white text-black-logo"} border ${border.light}`}
    >
      <div className="flex gap-x-1 w-full justify-between">
        {[ETeamPlayer.PLAYER_A, ETeamPlayer.PLAYER_B].map((spot) => {
          const key = spot === ETeamPlayer.PLAYER_A ? "A" : "B";
          return (
            <PlayerScoreCard
              key={spot}
              onTop={onTop}
              teamPlayer={spot}
              player={showPlayers ? players[key] : null}
              playerRankExist={showPlayers ? ranks[key] : null}
              dropdownPlayer={handleDropdownPlayer}
              evacuatePlayer={handleEvacuatePlayer}
            />
          );
        })}
      </div>
      <div className="mt-2 font-bold text-center">
        Pair Score: {!match?.extendedOvertime || bothSubmitted ? pairScore ?? "N/A" : "N/A"}
      </div>
    </div>
  );
}

export default NetTeamSelect;