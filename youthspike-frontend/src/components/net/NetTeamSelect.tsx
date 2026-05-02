import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EPlayerStatus, IPlayer } from "@/types";
import { ETeam } from "@/types/team";
import { calcPairScore } from "@/utils/scoreCalc";
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
import findPrevPartner from "@/utils/match/findPrevPartner";
import findOutOfRange from "@/utils/match/findOutOfRange";
import PlayerScoreCard from "../player/PlayerScoreCard";
import { getNetPlayerId, updateNetPlayer } from "@/utils/netHelpers";

interface Props {
  teamE: ETeam;
  net: INetRelatives | null;
  onTop: boolean;
}

function NetTeamSelect({ teamE, net, onTop }: Props) {
  const { token, info } = useUser();
  const dispatch = useAppDispatch();

  const {
    currentRoundNets,
    nets: allNets,
  } = useAppSelector((s) => s.nets);

  const { current: currentRound, roundList } = useAppSelector(
    (s) => s.rounds
  );

  const {
    disabledPlayerIds,
    match,
    myPlayers,
    opPlayers,
    myTeamE,
  } = useAppSelector((s) => s.matches);

  const { teamAPlayerRanking, teamBPlayerRanking } = useAppSelector(
    (s) => s.playerRanking
  );

  const screenWidth = useAppSelector((s) => s.elements.screenWidth);

  // =============================
  // Derived Data
  // =============================

  const myActivePlayers = useMemo(
    () => myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [myPlayers]
  );

  const opponentActivePlayers = useMemo(
    () => opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [opPlayers]
  );

  // =============================
  // Local State
  // =============================

  const [players, setPlayers] = useState<{
    A: IPlayer | null;
    B: IPlayer | null;
  }>({ A: null, B: null });

  const [ranks, setRanks] = useState<{
    A: number | null;
    B: number | null;
  }>({ A: null, B: null });

  const [pairScore, setPairScore] = useState<number | null>(null);

  // =============================
  // Core Helpers
  // =============================

  const findPlayer = useCallback(
    (spot: ETeamPlayer, isMyTeam: boolean): IPlayer | null => {
      if (!net) return null;

      const playerId = getNetPlayerId(
        net,
        isMyTeam ? myTeamE : myTeamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA,
        spot
      );

      const list = isMyTeam ? myActivePlayers : opponentActivePlayers;
      return list.find((p) => p._id === playerId) || null;
    },
    [net, myTeamE, myActivePlayers, opponentActivePlayers]
  );

  // =============================
  // Actions
  // =============================

  const handleEvacuatePlayer = (spot: ETeamPlayer) => {
    if (!token || !info || !net) return;

    const playerId = getNetPlayerId(net, myTeamE, spot);
    const updatedNet = updateNetPlayer(net, myTeamE, spot, null);

    const updateList = (list: INetRelatives[]) =>
      list.map((n) => (n._id === net._id ? updatedNet : n));

    dispatch(setCurrentRoundNets(updateList(currentRoundNets)));
    dispatch(setNets(updateList(allNets)));

    dispatch(
      setDisabledPlayerIds(
        disabledPlayerIds.filter((id) => id !== playerId)
      )
    );

    dispatch(setShowTeamPlayers(false));
    dispatch(setOutOfRange([]));
  };

  const handleDropdownPlayer = (
    e: React.SyntheticEvent,
    spot: ETeamPlayer
  ) => {
    e.preventDefault();

    if (!token || !info || !currentRound || !net) return;

    // simplified validation
    const isValidProcess =
      currentRound.teamAProcess === EActionProcess.CHECKIN ||
      currentRound.teamBProcess === EActionProcess.CHECKIN;

    if (!isValidProcess) return;

    dispatch(setShowTeamPlayers(true));
    dispatch(setPlayerSpot(spot));
    dispatch(setSelectedNet(net));

    // previous partner
    const prevPartner = findPrevPartner({
      roundList,
      currRound: currentRound,
      allNets,
      myTeamE,
      net,
    });

    dispatch(setPrevPartner(prevPartner || null));

    // disable already used players
    const usedIds = currentRoundNets.flatMap((n) =>
      myTeamE === ETeam.teamA
        ? [n.teamAPlayerA, n.teamAPlayerB]
        : [n.teamBPlayerA, n.teamBPlayerB]
    ).filter(Boolean) as string[];

    dispatch(
      setDisabledPlayerIds([...new Set([...disabledPlayerIds, ...usedIds])])
    );

    const invalidIds = findOutOfRange({
      currMatch: match,
      net,
      myPlayers: myActivePlayers,
      myTeamE,
      opPlayers: opponentActivePlayers,
      playerSpot: spot,
      teamAPlayerRanking,
      teamBPlayerRanking,
    });

    if (invalidIds.length) {
      dispatch(setOutOfRange(invalidIds));
    }
  };

  // =============================
  // Effects
  // =============================

  useEffect(() => {
    const A = findPlayer(ETeamPlayer.PLAYER_A, !onTop);
    const B = findPlayer(ETeamPlayer.PLAYER_B, !onTop);

    const allRankings = [
      ...(teamAPlayerRanking?.rankings || []),
      ...(teamBPlayerRanking?.rankings || []),
    ];

    const rankA =
      allRankings.find((r) => r.player._id === A?._id)?.rank || null;

    const rankB =
      allRankings.find((r) => r.player._id === B?._id)?.rank || null;

    setPlayers({ A, B });
    setRanks({ A: rankA, B: rankB });
    setPairScore(calcPairScore(rankA, rankB));
  }, [findPlayer, onTop, teamAPlayerRanking, teamBPlayerRanking]);

  // =============================
  // UI Conditions
  // =============================

  const showPlayers = useMemo(() => {
    if (!match?.extendedOvertime) return true;

    return !onTop ||
      (currentRound?.teamAProcess === EActionProcess.LINEUP &&
        currentRound?.teamBProcess === EActionProcess.LINEUP);
  }, [match, onTop, currentRound]);

  const bothSubmitted =
    currentRound?.teamAProcess === EActionProcess.LINEUP &&
    currentRound?.teamBProcess === EActionProcess.LINEUP;

  // =============================
  // Render
  // =============================

  return (
    <div
      style={{ minHeight: "50%" }}
      className={`w-full px-2 flex ${onTop
          ? "flex-col bg-[radial-gradient(circle,_#4b4a4a_0%,_#000000_100%)] text-white"
          : "flex-col-reverse bg-white text-black-logo"
        } border ${border.light}`}
    >
      <div className="flex gap-1 w-full">
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
              screenWidth={screenWidth}
              myTeamE={myTeamE}
            />
          );
        })}
      </div>

      <div className="mt-2 font-bold text-center">
        Pair Score:{" "}
        {!match?.extendedOvertime || bothSubmitted
          ? pairScore ?? "N/A"
          : "N/A"}
      </div>
    </div>
  );
}

export default NetTeamSelect;