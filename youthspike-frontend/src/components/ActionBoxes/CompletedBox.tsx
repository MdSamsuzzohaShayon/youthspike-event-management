import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import React, { useEffect, useState } from 'react';
import { AdvancedImage } from '@cloudinary/react';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import cld from '@/config/cloudinary.config';
import { ITeam } from '@/types';
import Link from 'next/link';
import { setActErr } from '@/redux/slices/elementSlice';
import { changeTheRound } from '@/utils/match/emitSocketEvents';
import { setDisabledPlayerIds, setPrevPartner } from '@/redux/slices/matchesSlice';
import Image from 'next/image';
import TextImg from '../elements/TextImg';

interface ITeamScoreBoard {
  team: ITeam | null;
  teamPoints: number;
}

function CompletedBox() {
  const dispatch = useAppDispatch();

  // ===== Redux State =====
  const [teamAPoints, setTeamAPoints] = useState<number>(0);
  const [teamBPoints, setTeamBPoints] = useState<number>(0);
  const [winningTeam, setWinningTeam] = useState<string | null>(null);

  // ===== Redux State =====
  const { match, myTeamE } = useAppSelector((state) => state.matches);
  const { currentRoundNets: currRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);

  const handleNextRound = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!currentRound?.num) return;
    const targetRoundIndex = roundList.findIndex((r) => r.num === (currentRound?.num || 0) + 1);
    if (targetRoundIndex !== -1 && currentRound) {
      if (roundList[targetRoundIndex].num > currentRound?.num) {
        const prevRound = roundList[targetRoundIndex - 1];
        if (!prevRound || !prevRound.completed) {
          dispatch(setActErr({ success: false, message: 'Make sure you have completed this round by putting players on all of the nets and points.' }));
          return;
        }
        dispatch(setActErr(null));
      }

      changeTheRound({ roundList, dispatch, allNets, newRoundIndex: targetRoundIndex, myTeamE });
      dispatch(setDisabledPlayerIds([]));
      dispatch(setPrevPartner(null));
    }
  };

  useEffect(() => {
    let tap = 0;
    let tbp = 0;
    // All rounds, current rounds

    const roundPlayedTill = roundList.filter((rp) => rp.num <= (currentRound?.num || 1));
    for (let rI = 0; rI < roundPlayedTill.length; rI += 1) {
      const netsPlayedInThisRound = allNets.filter((an) => an.round === roundPlayedTill[rI]._id);

      for (let i = 0; i < netsPlayedInThisRound.length; i += 1) {
        if ((netsPlayedInThisRound[i].teamAScore || 0) > (netsPlayedInThisRound[i].teamBScore || 0)) {
          tap += netsPlayedInThisRound[i].points;
        } else {
          tbp += netsPlayedInThisRound[i].points;
        }
      }
    }

    if (tap > tbp) {
      setWinningTeam(teamA?._id || '');
    } else if (tap < tbp) {
      setWinningTeam(teamB?._id || '');
    } else {
      setWinningTeam(null);
    }
    setTeamAPoints(tap);
    setTeamBPoints(tbp);
  }, [currRoundNets]);

  const teamScoreBoard = ({ team, teamPoints }: ITeamScoreBoard) => {
    let bgColor = 'bg-white';
    let textColor = 'text-black';

    if (winningTeam) {
      if (winningTeam === team?._id) {
        bgColor = 'bg-green-500';
        textColor = 'text-white';
      } else {
        bgColor = 'bg-white';
        textColor = 'text-black';
      }
    }

    return (
      <div className="w-full flex justify-center items-center flex-col">
        {team?.logo ? (
          <div className="advanced-img w-20">
            <AdvancedImage cldImg={cld.image(team.logo)} className="w-full" />
          </div>
        ) : (
          <TextImg fullText={team?.name} className="w-20 h-20" />
        )}
        <h2>{team?.name}</h2>
        <div className={`h-20 w-20 ${bgColor} ${textColor} rounded-lg flex justify-center items-center`}>
          <h2 className="text-4xl">{teamPoints}</h2>
        </div>
      </div>
    );
  };

  return (
    <div className="flex py-2 w-full justify-between items-end gap-1 box-gradient">
      {/* Left side */}
      <div className="w-2/6 md:w-1/6">{teamScoreBoard({ team: teamA ?? null, teamPoints: teamAPoints })}</div>
      <div className="w-2/6 flex justify-center items-center flex-col gap-y-2">
        {roundList.length === currentRound?.num ? (
          <>
            {winningTeam && (
              <>
                <h2 className="uppercase">{winningTeam === teamA?._id ? teamA.name : teamB?.name}</h2>
                <h2 className="uppercase">Wins the match</h2>
              </>
            )}
            <Link href={`${ADMIN_FRONTEND_URL}/${match.event}/matches`} className="btn-success">
              Next Match
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-center">{`Round ${currentRound?.num} - Finished`}</h2>
            <Image src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" height={100} width={100} />
            <button className="btn-light" type="button" onClick={handleNextRound}>
              Next Round
            </button>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="w-2/6 md:w-1/6">{teamScoreBoard({ team: teamB ?? null, teamPoints: teamBPoints })}</div>
    </div>
  );
}

export default CompletedBox;
