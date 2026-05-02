import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import React, { useEffect, useState, useCallback } from "react";
import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import { EMessage, ITeam } from "@/types";
import { useLdoId } from "@/lib/LdoProvider";
import {
  setDisabledPlayerIds,
  setPrevPartner,
} from "@/redux/slices/matchesSlice";
import Image from "next/image";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { ETeam } from "@/types/team";
import { EActionProcess } from "@/types/room";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import LocalStorageService from "@/utils/LocalStorageService";
import TextImg from "../elements/TextImg";
import { CldImage } from "next-cloudinary";
import { setMessage } from "@/redux/slices/elementSlice";
import autoAssignClock from "@/utils/assignStrategies/autoAssignClock";
import { useRoundNavigation } from "@/hooks/useRoundNavigation";

interface CompletedBoxProps {
  completeDialogRef: React.RefObject<HTMLDialogElement | null>;
}

interface ScoreResult {
  teamATotal: number;
  teamBTotal: number;
}

function CompletedBox({ completeDialogRef }: CompletedBoxProps) {
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();


  const [teamATotalPoints, setTeamATotalPoints] = useState(0);
  const [teamBTotalPoints, setTeamBTotalPoints] = useState(0);
  const [winningTeamId, setWinningTeamId] = useState<string | null>(null);

  const { match, myTeamE } = useAppSelector((s) => s.matches);
  const { currentRoundNets, nets } = useAppSelector((s) => s.nets);
  const { teamA, teamB } = useAppSelector((s) => s.teams);
  const { current: currentRound, roundList } = useAppSelector((s) => s.rounds);

  const { handleRoundChange } = useRoundNavigation({
    roundList,
    allNets: nets,
    myTeamE,
    currentRound,
    match,
  });

  // =========================
  // Helpers
  // =========================

  const calculateScores = useCallback((): ScoreResult => {
    if (!currentRound) return { teamATotal: 0, teamBTotal: 0 };

    const playedRounds = roundList.filter(
      (r) => r.num <= currentRound.num
    );

    let teamATotal = 0;
    let teamBTotal = 0;

    for (const round of playedRounds) {
      const netsInRound = nets.filter((n) => n.round === round._id);

      for (const net of netsInRound) {
        const aScore = net.teamAScore ?? 0;
        const bScore = net.teamBScore ?? 0;

        if (aScore > bScore) {
          teamATotal += net.points;
        } else {
          teamBTotal += net.points;
        }
      }
    }

    return { teamATotal, teamBTotal };
  }, [currentRound, roundList, nets]);

  const getWinningTeamId = (
    teamATotal: number,
    teamBTotal: number
  ): string | null => {
    if (teamATotal > teamBTotal) return teamA?._id ?? null;
    if (teamBTotal > teamATotal) return teamB?._id ?? null;
    return null;
  };

  const getNextRoundIndex = (): number => {
    if (!currentRound) return -1;
    return roundList.findIndex(
      (r) => r.num === currentRound.num + 1
    );
  };

  const switchToRound = (roundIndex: number) => {
    const targetRound = roundList[roundIndex];
    if (!targetRound) return;

    const updatedRound = { ...targetRound };

    const netsForRound = nets.filter(
      (n) => n.round === updatedRound._id
    );

    dispatch(setCurrentRoundNets(netsForRound));

    if (myTeamE === ETeam.teamA) {
      if (updatedRound.teamAProcess === EActionProcess.INITIATE) {
        updatedRound.teamAProcess = EActionProcess.CHECKIN;
      }
    } else {
      if (updatedRound.teamBProcess === EActionProcess.INITIATE) {
        updatedRound.teamBProcess = EActionProcess.CHECKIN;
      }
    }

    LocalStorageService.setMatch(updatedRound.match, updatedRound._id);

    dispatch(setCurrentRound(updatedRound));

    const updatedRoundList = roundList
      .filter((r) => r._id !== updatedRound._id)
      .concat(updatedRound);

    dispatch(setRoundList(updatedRoundList));

   
  };

  // =========================
  // Handlers
  // =========================

  const handleNextRound = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const nextIndex = getNextRoundIndex();
    if (nextIndex === -1 || !currentRound) return;

    const nextRound = roundList[nextIndex];
    const prevRound = roundList[nextIndex - 1];

    if (match.completed && !nextRound?.completed) {
      dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Match already completed.",
        })
      );
      return;
    }

    if (nextRound.num > currentRound.num && !prevRound?.completed) {
      dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Complete current round first.",
        })
      );
      return;
    }

    handleRoundChange(nextRound._id, (errorMessage) => {
      dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: errorMessage,
        })
      );
    });

    dispatch(setMessage(null));

    // switchToRound(nextIndex);
    // dispatch(setDisabledPlayerIds([]));
    // dispatch(setPrevPartner(null));
  };

  // =========================
  // Effects
  // =========================

  useEffect(() => {
    const { teamATotal, teamBTotal } = calculateScores();

    setTeamATotalPoints(teamATotal);
    setTeamBTotalPoints(teamBTotal);
    setWinningTeamId(getWinningTeamId(teamATotal, teamBTotal));
  }, [calculateScores, currentRoundNets]);

  // =========================
  // UI Helpers
  // =========================

  const renderTeamScore = (team: ITeam | null, points: number) => {
    const isWinner = winningTeamId === team?._id;

    return (
      <div className="flex flex-col items-center gap-2 w-full">
        {team?.logo ? (
          <div className="w-20">
            <CldImage
              alt={team.name}
              width="200"
              height="200"
              className="w-full"
              crop="fit"
              src={team.logo}
            />
          </div>
        ) : (
          <TextImg fullText={team?.name} className="w-20 h-20 rounded-lg" />
        )}

        <h2 className="text-sm font-bold uppercase">{team?.name}</h2>

        <div
          className={`w-20 h-20 rounded-lg flex items-center justify-center ${isWinner ? "bg-green-500 text-white" : "bg-white text-black"
            }`}
        >
          <h2 className="text-4xl">{points}</h2>
        </div>
      </div>
    );
  };

  // =========================
  // Render
  // =========================

  return (
    <div className="w-full bg-black text-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-end gap-1">
        {/* Team A */}
        <div className="w-2/6 md:w-1/6">
          {renderTeamScore(teamA || null, teamATotalPoints + (match?.teamAP ?? 0))}
        </div>

        {/* Middle */}
        <div className="w-2/6 flex flex-col items-center gap-2">
          {roundList.length === currentRound?.num ? (
            <>
              {winningTeamId && (
                <>
                  <h2 className="text-sm font-bold uppercase">
                    {winningTeamId === teamA?._id
                      ? teamA?.name
                      : teamB?.name}
                  </h2>
                  <h2 className="text-sm font-bold uppercase">
                    Wins the match
                  </h2>
                </>
              )}

              <div className="flex gap-2">
                <a
                  href={`${ADMIN_FRONTEND_URL}/${match.event}/matches/${ldoIdUrl}`}
                  className="btn-success"
                >
                  Next Match
                </a>

                <button
                  className="btn-light"
                  onClick={() => completeDialogRef.current?.showModal()}
                >
                  {match.completed ? "Unfinish Match" : "Finish Match"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-center">
                {match.completed
                  ? "Match Completed"
                  : `Round ${currentRound?.num} - Finished`}
              </h2>

              <Image
                src="/imgs/spikeball-players.png"
                alt="players"
                width={100}
                height={100}
                className="object-cover object-top"
              />

              <div className="flex flex-col md:flex-row gap-2">
                <button className="btn-light" onClick={handleNextRound}>
                  Next Round
                </button>

                <button
                  className="btn-light"
                  onClick={() => completeDialogRef.current?.showModal()}
                >
                  {match.completed ? "Unfinish Match" : "Finish Match"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Team B */}
        <div className="w-2/6 md:w-1/6">
          {renderTeamScore(teamB || null, teamBTotalPoints + (match?.teamBP ?? 0))}
        </div>
      </div>
    </div>
  );
}

export default CompletedBox;