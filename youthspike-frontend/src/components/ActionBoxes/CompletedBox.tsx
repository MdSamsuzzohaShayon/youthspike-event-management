import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import React, { useEffect, useState } from "react";
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

interface ITeamScoreBoard {
  team: ITeam | null;
  teamPoints: number;
}

interface ICompletedBoxProps {
  completeDialogEl: React.RefObject<HTMLDialogElement | null>;
}

function CompletedBox({ completeDialogEl }: ICompletedBoxProps) {
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();

  // ===== Redux State =====
  const [teamAPoints, setTeamAPoints] = useState<number>(0);
  const [teamBPoints, setTeamBPoints] = useState<number>(0);
  const [winningTeam, setWinningTeam] = useState<string | null>(null);

  // ===== Redux State =====
  const { match, myTeamE } = useAppSelector((state) => state.matches);
  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector(
    (state) => state.nets
  );
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { current: currentRound, roundList } = useAppSelector(
    (state) => state.rounds
  );

  // Duplicate
  const changeTheRound = (targetRoundIndex: number) => {
    // ===== Current round, current round nets and round list properly =====
    const newRoundObj = { ...roundList[targetRoundIndex] };
    const filteredNets = allNets.filter((net) => net.round === newRoundObj._id);
    dispatch(setCurrentRoundNets(filteredNets));

    if (myTeamE === ETeam.teamA) {
      newRoundObj.teamAProcess =
        newRoundObj.teamAProcess &&
        newRoundObj.teamAProcess === EActionProcess.INITIATE
          ? EActionProcess.CHECKIN
          : newRoundObj.teamAProcess;
    } else {
      newRoundObj.teamBProcess =
        newRoundObj.teamBProcess &&
        newRoundObj.teamBProcess === EActionProcess.INITIATE
          ? EActionProcess.CHECKIN
          : newRoundObj.teamBProcess;
    }
    LocalStorageService.setMatch(newRoundObj.match, newRoundObj._id);
    dispatch(setCurrentRound(newRoundObj));
    const newRoundList = roundList.filter((r) => r._id !== newRoundObj._id);
    newRoundList.push(newRoundObj);
    dispatch(setRoundList(newRoundList));
  };

  const handleNextRound = (e: React.SyntheticEvent) => {
    e.preventDefault();

    if (!currentRound?.num) return;
    const targetRoundIndex = roundList.findIndex(
      (r) => r.num === (currentRound?.num || 0) + 1
    );

    if (match.completed && !roundList[targetRoundIndex]?.completed) {
      dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "This match is completed, you can not go to the next round.",
        })
      );
      return;
    }

    if (targetRoundIndex !== -1 && currentRound) {
      if (roundList[targetRoundIndex].num > currentRound?.num) {
        const prevRound = roundList[targetRoundIndex - 1];
        if (!prevRound || !prevRound.completed) {
          dispatch(
            setMessage({
              type: EMessage.ERROR,
              message:
                "Make sure you have completed this round by putting players on all of the nets and points.",
            })
          );
          return;
        }
        dispatch(setMessage(null));
      }

      changeTheRound(targetRoundIndex);
      dispatch(setDisabledPlayerIds([]));
      dispatch(setPrevPartner(null));
    }
  };

  useEffect(() => {
    let tap = 0;
    let tbp = 0;
    // All rounds, current rounds

    const roundPlayedTill = roundList.filter(
      (rp) => rp.num <= (currentRound?.num || 1)
    );
    for (let rI = 0; rI < roundPlayedTill.length; rI += 1) {
      const netsPlayedInThisRound = allNets.filter(
        (an) => an.round === roundPlayedTill[rI]._id
      );

      for (let i = 0; i < netsPlayedInThisRound.length; i += 1) {
        if (
          (netsPlayedInThisRound[i].teamAScore || 0) >
          (netsPlayedInThisRound[i].teamBScore || 0)
        ) {
          tap += netsPlayedInThisRound[i].points;
        } else {
          tbp += netsPlayedInThisRound[i].points;
        }
      }
    }

    if (tap > tbp) {
      setWinningTeam(teamA?._id || "");
    } else if (tap < tbp) {
      setWinningTeam(teamB?._id || "");
    } else {
      setWinningTeam(null);
    }
    setTeamAPoints(tap);
    setTeamBPoints(tbp);
  }, [currRoundNets]);

  const teamScoreBoard = ({ team, teamPoints }: ITeamScoreBoard) => {
    let bgColor = "bg-white";
    let textColor = "text-black";

    if (winningTeam) {
      if (winningTeam === team?._id) {
        bgColor = "bg-green-500";
        textColor = "text-white";
      } else {
        bgColor = "bg-white";
        textColor = "text-black";
      }
    }

    return (
      <div className="w-full flex justify-center items-center flex-col gap-y-2">
        {team?.logo ? (
          <div className="advanced-img w-20">
            <CldImage
              alt={team.name}
              width="200"
              height="200"
              className="w-full"
              src={team.logo}
            />
          </div>
        ) : (
          <TextImg fullText={team?.name} className="w-20 h-20 rounded-lg" />
        )}
        <h2 className="break-words uppercase font-bold text-sm">
          {team?.name}
        </h2>
        <div
          className={`h-20 w-20 ${bgColor} ${textColor} rounded-lg flex justify-center items-center`}
        >
          <h2 className="text-4xl">{teamPoints}</h2>
        </div>
      </div>
    );
  };


  return (
    <div className={`py-2 w-full bg-black text-white`}>
      <div className="container px-4 mx-auto flex py-2 w-full justify-between items-end gap-1">
        {/* Left side */}
        <div className="w-2/6 md:w-1/6">
          {teamScoreBoard({ team: teamA ?? null, teamPoints: teamAPoints })}
        </div>

        {/* Middle side  */}
        <div className="w-2/6 flex justify-center items-center flex-col gap-y-2">
          {roundList.length === currentRound?.num ? (
            <div className="flex justify-between items-center flex-col gap-y-2">
              {winningTeam && (
                <>
                  <h2 className="break-words uppercase font-bold text-sm">
                    {winningTeam === teamA?._id ? teamA.name : teamB?.name}
                  </h2>
                  <h2 className="break-words uppercase font-bold text-sm">
                    Wins the match
                  </h2>
                </>
              )}
              <div className="flex items-center gap-x-2">
                <a
                  href={`${ADMIN_FRONTEND_URL}/${match.event}/matches/${ldoIdUrl}`}
                  className="btn-success"
                >
                  Next Match
                </a>
                <button
                  className="btn-light"
                  type="button"
                  onClick={() => completeDialogEl.current?.showModal()}
                >
                  {match.completed ? "Unfinish Match" : "Finish Match"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-center">
                {match.completed
                  ? "Match Completed"
                  : `Round ${currentRound?.num} - Finished`}
              </h2>
              <Image
                src="/imgs/spikeball-players.png"
                alt="spikeball-players"
                className="w-full h-full object-cover object-top"
                height={100}
                width={100}
              />
              <div className="w-full flex flex-col md:flex-row justify-center items-center gap-2">
                {roundList.length !== currentRound?.num && (
                  <button
                    className="btn-light"
                    type="button"
                    onClick={handleNextRound}
                  >
                    Next Round
                  </button>
                )}
                <button
                  className="btn-light"
                  type="button"
                  onClick={() => completeDialogEl.current?.showModal()}
                >
                  {match.completed ? "Unfinish Match" : "Finish Match"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="w-2/6 md:w-1/6">
          {teamScoreBoard({ team: teamB ?? null, teamPoints: teamBPoints })}
        </div>
      </div>
    </div>
  );
}

export default CompletedBox;

// db.matches.updateMany({division: ""}, {$set: {division: "MINOR"}});
