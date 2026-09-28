import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import React, { useMemo } from "react";
import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import { EMessage } from "@/types";
import { useLdoId } from "@/lib/LdoProvider";
import Image from "next/image";
import { setMessage } from "@/redux/slices/elementSlice";
import { useRoundNavigation } from "@/hooks/useRoundNavigation";
import ParticleButton from "../elements/ParticleButton";
import TeamScore from "./TeamScore";

interface CompletedBoxProps {
  completeDialogRef: React.RefObject<HTMLDialogElement | null>;
}


function CompletedBox({ completeDialogRef }: CompletedBoxProps) {
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();




  const { match, myTeamE } = useAppSelector((s) => s.matches);
  const { nets } = useAppSelector((s) => s.nets);
  const { teamA, teamB } = useAppSelector((s) => s.teams);
  const { current: currentRound, roundList } = useAppSelector((s) => s.rounds);

  const { handleRoundChange } = useRoundNavigation({
    roundList,
    allNets: nets,
    myTeamE,
    currentRound,
    match,
  });





  const getNextRoundIndex = (): number => {
    if (!currentRound) return -1;
    return roundList.findIndex(
      (r) => r.num === currentRound.num + 1
    );
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

  
// Memomization
  const { teamAPoints, teamBPoints } = useMemo(() => {


    if (match.teamAFScore && match.teamAFScore) {
      return { teamAPoints: match.teamAFScore, teamBPoints: (match?.teamBFScore || 0) };
    }


    if (!currentRound) return { teamAPoints: 0, teamBPoints: 0 };

    const playedRounds = roundList.filter(
      (r) => r.num <= currentRound.num
    );

    let tas: number = 0;
    let tbs: number = 0;

    for (const round of playedRounds) {
      const netsInRound = nets.filter((n) => n.round === round._id);

      for (const net of netsInRound) {
        const aScore = net.teamAScore ?? 0;
        const bScore = net.teamBScore ?? 0;

        if (aScore > bScore) {
          tas += net.points;
        } else {
          tbs += net.points;
        }
      }
    }

    tas + (match?.teamAP ?? 0)
    tbs + (match?.teamBP ?? 0)

    return { teamAPoints: tas, teamBPoints: tbs };
  }, [match, currentRound, nets]);



  const winningTeamId = useMemo(() => {
    if (teamAPoints > teamBPoints) return teamA?._id ?? null;
    if (teamBPoints > teamAPoints) return teamB?._id ?? null;
    return null;
  }, [teamAPoints, teamBPoints])


  // =========================
  // Render
  // =========================

  return (
    <div className="w-full bg-black text-white py-2">
      <div className="container mx-auto px-4 flex justify-between items-end gap-1">
        {/* Team A */}
        <div className="w-2/6 md:w-1/6">
          <TeamScore team={teamA || null} points={teamAPoints} winningTeamId={winningTeamId} />
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

              <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                <ParticleButton
                  variant="primary"
                  size="lg"
                  onClick={handleNextRound}
                  className="min-w-[220px] sm:min-w-[240px]"
                  particleCount={26}
                >
                  <span className="flex flex-col items-center leading-tight">
                    <span className="text-base font-extrabold tracking-wide uppercase">
                      Next Round
                    </span>
                    <span className="text-xs font-semibold opacity-80">
                      Proceed to the next round
                    </span>
                  </span>
                </ParticleButton>

                <ParticleButton
                  variant="default"
                  size="sm"
                  onClick={() => completeDialogRef.current?.showModal()}
                  className="md:self-center"
                >
                  {match.completed ? "Unfinish Match" : "Finish Match"}
                </ParticleButton>
              </div>
            </>
          )}
        </div>

        {/* Team B */}
        <div className="w-2/6 md:w-1/6">
          <TeamScore team={teamB || null} points={teamBPoints} winningTeamId={winningTeamId} />
        </div>
      </div>
    </div>
  );
}

export default CompletedBox;