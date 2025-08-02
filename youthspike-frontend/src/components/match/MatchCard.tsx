import { IMatchExpRel, INetRelatives, IRoundExpRel } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { calcRoundScore } from '@/utils/scoreCalc';
import Link from 'next/link';
import React, { useCallback } from 'react';
import { readDate } from '@/utils/datetime';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { imgW } from '@/utils/constant';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { EActionProcess } from '@/types/room';
import PointsByRoundPublic from './PointsByRoundPublic';
import { CldImage } from 'next-cloudinary';

interface MatchCardProps {
  match: IMatchExpRel;
  roundList: IRoundExpRel[];
  allNets: INetRelatives[];
}

function MatchCard({ match, roundList, allNets }: MatchCardProps) {
  const params = useParams();
  const { ldoIdUrl } = useLdoId();

  const user = useUser();

  const teamCard = useCallback(
    (team: ITeam, teamE: ETeam) => {
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

      const won = teamScore > oponentScore && match.completed;
      return (
        <>
          <div className="advanced-img w-14">
            {team?.logo ? (
              <CldImage alt={team.name} width="200" height="200" className="w-full h-full" src={team.logo} />
            ) : (
              <Image src="/free-logo.png" width={imgW.logo} height={imgW.logo} className="w-full h-full" alt="free-logo" />
            )}
          </div>
          <h3 className={`text-2xl md:text-3xl font-semibold text-white capitalize text-center ${match.completed && won ? 'bg-green-600 text-white p-2 rounded-lg' : ''}`}>{team?.name}</h3>
          <h1 className={`h-12 w-12 flex justify-center items-center rounded-full border ${match.completed && won ? 'bg-green-600' : ''}`}>{teamScore}</h1>
        </>
      );
    },
    [allNets, match.completed, roundList],
  );

  const messageCreate = useCallback(() => {
    let runningRoundIndex: null | number = null;
    let msg: string = '';

    // make sure which round they are on
    for (let i = 0; i < roundList.length; i += 1) {
      const currRound = roundList[i];
      if (currRound?.teamAProcess === EActionProcess.INITIATE || currRound?.teamBProcess === EActionProcess.INITIATE) {
        msg = 'SCHEDULED';
        runningRoundIndex = i;
        // break round loop
        break;
      } else if (currRound?.teamAProcess === EActionProcess.CHECKIN || currRound?.teamBProcess === EActionProcess.CHECKIN) {
        const currRoundNets = allNets.filter((n) => n.round === roundList[i]._id);
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
        const currRoundNets = allNets.filter((n) => n.round === roundList[i]._id);
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
  }, [allNets, roundList]);

  return (
    <div
      className="w-full bg-gray-800 flex flex-col justify-between items-center relative rounded-lg shadow-lg overflow-hidden"
      style={{ minHeight: '6rem' }}
    >
      {/* ===== LEVEL 1 START ===== */}
      <div
        className="level-1 w-full flex justify-center px-4 md:px-8 py-3 border-b-2 border-yellow-500 text-white font-bold text-lg tracking-wide"
      >
        {match.completed ? 'FINAL SCORE' : messageCreate()}
      </div>
      {/* ===== LEVEL 1 END ===== */}

      {/* ===== LEVEL 2 START ===== */}
      <div
        className="level-2 w-full flex justify-between items-center px-4 md:px-8 py-4 text-white"
      >
        {teamCard(match?.teamA, ETeam.teamA)}
      </div>
      {/* ===== LEVEL 2 END ===== */}

      {/* ===== LEVEL 3 START ===== */}
      <div
        className="level-3 w-full flex justify-center items-center px-4 md:px-8 py-4 gap-x-4 text-white"
      >
        {user.info?.role === UserRole.admin ||
          (user.info?.role === UserRole.director && (
            <Link href={`${ADMIN_FRONTEND_URL}/${params.eventId}/matches/${match._id}/${ldoIdUrl}`}>
              <Image height={imgW.logo} width={imgW.logo} src="/icons/setting.svg" alt="setting-icon" className="w-6 svg-white cursor-pointer hover:opacity-80" />
            </Link>
          ))}
        <div className="rounds flex flex-col justify-center items-center w-full">
          <ul className="round-numbers w-full flex justify-center items-center gap-x-2">
            {roundList.map((round, i) => (
              <li key={round._id} className="w-12 flex justify-center items-center text-yellow-logo text-sm font-semibold">
                {`RD${match.extendedOvertime && i === roundList.length - 1 ? 'X' : round.num}`}
              </li>
            ))}
          </ul>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center mt-2">
            {/* @ts-ignore */}
            <PointsByRoundPublic roundList={roundList} allNets={allNets} teamE={ETeam.teamA} />
          </div>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center mt-2">
            {/* @ts-ignore */}
            <PointsByRoundPublic roundList={roundList} allNets={allNets} teamE={ETeam.teamB} dark />
          </div>
        </div>
        <Image height={imgW.logo} width={imgW.logo} src="/icons/share.svg" alt="share-icon" className="w-6 svg-white cursor-pointer hover:opacity-80" />
      </div>
      {/* ===== LEVEL 3 END ===== */}

      {/* ===== LEVEL 4 START ===== */}
      <div
        className="level-4 w-full flex justify-between items-center px-4 md:px-8 py-4 text-white"
      >
        {teamCard(match?.teamB, ETeam.teamB)}
      </div>
      {/* ===== LEVEL 4 END ===== */}

      {/* ===== LEVEL 5 START ===== */}
      <div
        className="level-5 w-full flex justify-between items-start px-4 md:px-8 py-4 text-white"
      >
        <div className="w-1/2">
          <p className="flex items-center gap-x-2">
            <Image width={20} height={20} src="/icons/clock.svg" className="w-6 svg-white" alt="clock-logo" />
            <span>{readDate(match.date)}</span>
          </p>
        </div>
        <div className="w-1/2 text-right">
          <p className="flex items-center gap-x-2">
            <Image width={20} height={20} src="/icons/location.svg" className="w-6 svg-white" alt="location-logo" />
            <span>{match.location}</span>
          </p>
          <p className="flex items-center gap-x-2">
            <Image width={20} height={20} src="/icons/location.svg" className="w-6 svg-white" alt="location-logo" />
            <span>{match.description}</span>
          </p>
        </div>
      </div>
      {/* ===== LEVEL 5 END ===== */}

      {/* ===== LEVEL 7 START ===== */}
      <div className="level-7 w-full flex justify-center px-4 md:px-8 py-4" >
        <Link href={`/matches/${match._id}/${ldoIdUrl}`} className="px-6 py-2 bg-yellow-logo text-black font-semibold rounded-md shadow-md hover:bg-yellow-600 transition-colors duration-300">
          Enter
        </Link>
      </div>
      {/* ===== LEVEL 7 END ===== */}
    </div>
  );
}

export default MatchCard;
