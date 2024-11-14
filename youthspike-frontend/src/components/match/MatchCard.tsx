/* eslint-disable no-unused-vars */
import { IMatchExpRel, INetRelatives, IRoundExpRel } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { calcRoundScore } from '@/utils/scoreCalc';
import Link from 'next/link';
import React, { useCallback, useState } from 'react';
import { readDate } from '@/utils/datetime';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { imgW } from '@/utils/constant';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { EActionProcess } from '@/types/room';
import PointsByRoundPublic from './PointsByRoundPublic';

interface MatchCardProps {
  match: IMatchExpRel;
  roundList: IRoundExpRel[];
  allNets: INetRelatives[];
}

function MatchCard({ match, roundList, allNets }: MatchCardProps) {
  const params = useParams();
  const { ldoIdUrl } = useLdoId();

  const user = useUser();

  const teamCard = (team: ITeam, teamE: ETeam) => {
    const oponentE = teamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA;
    let teamScore = 0;
    let oponentScore = 0;

    roundList.forEach((r) => {
      const { score: ts } = calcRoundScore(
        allNets.filter((n) => n.round === r._id),
        // @ts-ignore
        r,
        teamE,
      );
      const { score: os } = calcRoundScore(
        allNets.filter((n) => n.round === r._id),
        // @ts-ignore
        r,
        oponentE,
      );
      teamScore += ts;
      oponentScore += os;
    });

    const won = teamScore > oponentScore;
    return (
      <>
        <div className="advanced-img w-14">
          {team?.logo ? <AdvancedImage cldImg={cld.image(team?.logo)} className="w-full h-full" /> : <Image src="/free-logo.png" className="w-full h-full" alt="free-logo" />}
        </div>
        <h3 className="capitalize">{team.name}</h3>
        <h1 className={`h-12 w-12 flex justify-center items-center rounded-full border ${won ? 'bg-green-600' : ''}`}>{teamScore}</h1>
      </>
    );
  };

  const messageCreate = useCallback(() => {
    let runningRoundIndex: null | number = null;
    let msg: string = '';

    // make sure which round they are on
    for (let i = 0; i < roundList.length; i += 1) {
      const currRound = roundList[i];
      if (currRound?.teamAProcess === EActionProcess.INITIATE || currRound?.teamBProcess === EActionProcess.INITIATE) {
        msg = 'TILL NOT CHECKED IN TO PLAY';
        runningRoundIndex = i;
        // break round loop
        break;
      } else if (currRound?.teamAProcess === EActionProcess.CHECKIN || currRound?.teamBProcess === EActionProcess.CHECKIN) {
        const currRoundNets = allNets.filter((n)=> n.round === roundList[i]._id);
        for (let j = 0; currRoundNets && j < currRoundNets.length; j += 1) {
          if (!currRoundNets[j].teamAScore || !currRoundNets[j].teamAScore) {
            runningRoundIndex = i;
            // Break net loop
            break;
          }
        }

        if (runningRoundIndex !== null) {
          // break round loop
          msg = `ASSINGING PLAYERS ROUND ${roundList[runningRoundIndex].num}`;
          break;
        }
      } else if (currRound?.teamAProcess === EActionProcess.LINEUP && currRound?.teamBProcess === EActionProcess.LINEUP) {
        const currRoundNets = allNets.filter((n)=> n.round === roundList[i]._id);
        for (let j = 0; currRoundNets && j < currRoundNets.length; j += 1) {
          if (!currRoundNets[j].teamAScore || !currRoundNets[j].teamAScore) {
            runningRoundIndex = i;
            // Break net loop
            break;
          }
        }
        if (runningRoundIndex !== null) {
          // break round loop
          msg = `ROUND ${roundList[runningRoundIndex].num} IN ACTION `;
          break;
        }
      }
    }

    return msg;
  }, [roundList]);

  return (
    <div className="w-full bg-gray-700 flex flex-col justify-between items-center relative rounded-lg" style={{ minHeight: '6rem' }}>
      {/* ===== LEVEL 1 START ===== */}
      <div className="level-1 w-full flex justify-center px-2 md:px-6 mt-2 md:mt-6 border-yellow border-b">{match.completed ? 'FINAL SCORE' : messageCreate()}</div>
      {/* "ASSINGING PLAYERS ROUND 2" */}
      {/* ===== LEVEL 1 END ===== */}
      {/* ===== LEVEL 2 START ===== */}
      <div className="lavel-2 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">{teamCard(match?.teamA, ETeam.teamA)}</div>
      {/* ===== LEVEL 2 END ===== */}
      {/* ===== LEVEL 3 START ===== */}
      <div className="lavel-3 w-full flex justify-center items-center px-2 md:px-6 mt-2 md:mt-6 gap-x-2">
        {user.info?.role === UserRole.admin ||
          (user.info?.role === UserRole.director && (
            <Link href={`${ADMIN_FRONTEND_URL}/${params.eventId}/matches/${match._id}/${ldoIdUrl}`}>
              <Image height={imgW.logo} width={imgW.logo} src="/icons/setting.svg" alt="setting-icon" className="w-6 svg-white" />
            </Link>
          ))}
        <div className="rounds flex flex-col justify-center items-center w-full ">
          <ul className="round-numbers w-full flex justify-center items-center gap-x-1">
            {roundList.map((round) => (
              <li key={round._id} className="w-12 flex justify-center items-center text-yellow-logo">
                RD{round.num}
              </li>
            ))}
          </ul>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center">
            {/* @ts-ignore */}
            <PointsByRoundPublic roundList={roundList} allNets={allNets} teamE={ETeam.teamA} />
          </div>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center mt-2">
            {/* @ts-ignore */}
            <PointsByRoundPublic roundList={roundList} allNets={allNets} teamE={ETeam.teamB} dark />
          </div>
        </div>
        <div className="">
          <Image height={imgW.logo} width={imgW.logo} src="/icons/share.svg" alt="share-icon" className="w-6 svg-white" />
        </div>
      </div>
      {/* ===== LEVEL 3 END ===== */}
      {/* ===== LEVEL 4 START ===== */}
      <div className="lavel-4 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">{teamCard(match?.teamB, ETeam.teamB)}</div>
      {/* ===== LEVEL 4 END ===== */}
      {/* ===== LEVEL 5 START ===== */}
      <div className="lavel-5 w-full flex justify-between items-start px-2 md:px-6 mt-2 md:mt-6 pb-2">
        <div className="w-3/6">
          <p className="flex justify-start items-center gap-x-2 mb-2">
            <span>
              <Image width={20} height={20} src="/icons/clock.svg" className="w-6 svg-white" alt="clock-logo" />
            </span>
            <span>{readDate(match.date)}</span>
          </p>
        </div>
        <div className="w-3/6 text-end">
          <p className="flex justify-start items-center gap-x-2">
            <span>
              <Image width={20} height={20} src="/icons/location.svg" className="w-6 svg-white" alt="location-logo" />
            </span>
            <span>{match.description}</span>
          </p>
        </div>
      </div>
      {/* ===== LEVEL 5 END ===== */}
      {/* ===== LEVEL 6 START ===== */}
      {/* <div className="lavel-6 w-full flex justify-between items-start border-t border-gray-500 px-2 md:px-6 mt-2 md:mt-6 pb-2">
        <h3>Match Setting</h3>
        {match && <MatchAdd prevMatch={match} eventId={match.event}
          setActErr={setActErr} setIsLoading={setIsLoading} update matchId={match._id} />}
      </div> */}
      {/* ===== LEVEL 6 END ===== */}
      {/* ===== LEVEL 7 START ===== */}
      <div className="lavel-7  w-full flex justify-center px-2 md:px-6 mt-2 md:mt-6 pb-2">
        <Link href={`/matches/${match._id}/${ldoIdUrl}`} className="btn-info">
          Enter
        </Link>
      </div>
      {/* ===== LEVEL 7 END ===== */}
    </div>
  );
}

export default MatchCard;
