import { IMatchExpRel, INetRelatives, IRoundExpRel } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { calcRoundScore } from '@/utils/scoreCalc';
import Link from 'next/link';
import React, { useCallback, useMemo } from 'react';
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
  

  // Precompute nets by round to avoid repeated filtering
  const netsByRoundId = useMemo(() => {
    const map = new Map<string, INetRelatives[]>();
    allNets.forEach(net => {
      if (!map.has(net.round)) {
        map.set(net.round, []);
      }
      map.get(net.round)!.push(net);
    });
    return map;
  }, [allNets]);

  // Memoize team scores calculation
  const teamScores = useMemo(() => {
    const scores = {
      teamA: 0,
      teamB: 0,
      roundScores: new Map<string, { teamA: number; teamB: number }>()
    };

    roundList.forEach(round => {
      const roundNets = netsByRoundId.get(round._id) || [];
      // @ts-ignore
      const teamAScore = calcRoundScore(roundNets, round, ETeam.teamA).score;
      // @ts-ignore
      const teamBScore = calcRoundScore(roundNets, round, ETeam.teamB).score;
      
      scores.teamA += teamAScore;
      scores.teamB += teamBScore;
      scores.roundScores.set(round._id, { teamA: teamAScore, teamB: teamBScore });
    });

    return scores;
  }, [roundList, netsByRoundId]);

  const teamCard = useCallback(
    (team: ITeam, teamE: ETeam) => {
      const teamScore = teamE === ETeam.teamA ? teamScores.teamA : teamScores.teamB;
      const oponentScore = teamE === ETeam.teamA ? teamScores.teamB : teamScores.teamA;
      const won = teamScore > oponentScore && match.completed;

      return (
        <>
          <div className="advanced-img w-14">
            {team?.logo ? (
              <CldImage 
                alt={team.name} 
                width="200" 
                height="200" 
                className="w-full h-full" 
                src={team.logo} 
              />
            ) : (
              <Image 
                src="/free-logo.png" 
                width={imgW.logo} 
                height={imgW.logo} 
                className="w-full h-full" 
                alt="free-logo" 
              />
            )}
          </div>
          <h3 className={`text-2xl md:text-3xl font-semibold text-white capitalize text-center ${match.completed && won ? 'bg-green-600 text-white p-2 rounded-lg' : ''}`}>
            {team?.name}
          </h3>
          <h1 className={`h-12 w-12 flex justify-center items-center rounded-full border ${match.completed && won ? 'bg-green-600' : ''}`}>
            {teamScore}
          </h1>
        </>
      );
    },
    [teamScores, match.completed]
  );

  // Optimize messageCreate function with early returns and reduced complexity
  const messageCreate = useCallback(() => {
    for (let i = 0; i < roundList.length; i += 1) {
      const currRound = roundList[i];
      const roundNets = netsByRoundId.get(currRound._id) || [];
      
      // Check for INITIATE status
      if (currRound.teamAProcess === EActionProcess.INITIATE || 
          currRound.teamBProcess === EActionProcess.INITIATE) {
        return 'SCHEDULED';
      }
      
      // Check for CHECKIN status with incomplete nets
      if (currRound.teamAProcess === EActionProcess.CHECKIN || 
          currRound.teamBProcess === EActionProcess.CHECKIN) {
        const hasIncompleteNet = roundNets.some(net => 
          !net.teamAScore || !net.teamBScore
        );
        if (hasIncompleteNet) {
          return `ASSIGNING PLAYERS ROUND ${currRound.num}`;
        }
      }
      
      // Check for LINEUP status with incomplete nets
      if (currRound.teamAProcess === EActionProcess.LINEUP && 
          currRound.teamBProcess === EActionProcess.LINEUP) {
        const hasIncompleteNet = roundNets.some(net => 
          !net.teamAScore || !net.teamBScore
        );
        if (hasIncompleteNet) {
          return `ROUND ${currRound.num} IN ACTION`;
        }
      }
    }
    
    return '';
  }, [roundList, netsByRoundId]);

  const statusMessage = useMemo(() => messageCreate(), [messageCreate]);
  const isAdminOrDirector = useMemo(() => 
    user.info?.role === UserRole.admin || user.info?.role === UserRole.director,
    [user.info?.role]
  );

  return (
    <div
      className="w-full bg-gray-800 flex flex-col justify-between items-center relative rounded-lg shadow-lg overflow-hidden"
      style={{ minHeight: '6rem' }}
    >
      {/* ===== LEVEL 1 START ===== */}
      <div className="level-1 w-full flex justify-center px-4 md:px-8 py-3 border-b-2 border-yellow-500 text-white font-bold text-lg tracking-wide">
        {match.completed ? 'FINAL SCORE' : statusMessage}
      </div>
      {/* ===== LEVEL 1 END ===== */}

      {/* ===== LEVEL 2 START ===== */}
      <div className="level-2 w-full flex justify-between items-center px-4 md:px-8 py-4 text-white">
        {teamCard(match?.teamA, ETeam.teamA)}
      </div>
      {/* ===== LEVEL 2 END ===== */}

      {/* ===== LEVEL 3 START ===== */}
      <div className="level-3 w-full flex justify-center items-center px-4 md:px-8 py-4 gap-x-4 text-white">
        {isAdminOrDirector && (
          <Link href={`${ADMIN_FRONTEND_URL}/${params.eventId}/matches/${match._id}/${ldoIdUrl}`}>
            <Image 
              height={imgW.logo} 
              width={imgW.logo} 
              src="/icons/setting.svg" 
              alt="setting-icon" 
              className="w-6 svg-white cursor-pointer hover:opacity-80" 
            />
          </Link>
        )}
        <div className="rounds flex flex-col justify-center items-center w-full">
          <ul className="round-numbers w-full flex justify-center items-center gap-x-2">
            {roundList.map((round, i) => (
              <li key={round._id} className="w-12 flex justify-center items-center text-yellow-logo text-sm font-semibold">
                {`RD${match.extendedOvertime && i === roundList.length - 1 ? 'X' : round.num}`}
              </li>
            ))}
          </ul>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center mt-2">
            <PointsByRoundPublic 
            // @ts-ignore
              roundList={roundList} 
              allNets={allNets} 
              teamE={ETeam.teamA} 
              precomputedScores={teamScores.roundScores}
            />
          </div>
          <div className="points-by-rounds w-full flex flex-wrap justify-center items-center mt-2">
            <PointsByRoundPublic 
            // @ts-ignore
              roundList={roundList} 
              allNets={allNets} 
              teamE={ETeam.teamB} 
              dark 
              precomputedScores={teamScores.roundScores}
            />
          </div>
        </div>
        <Image 
          height={imgW.logo} 
          width={imgW.logo} 
          src="/icons/share.svg" 
          alt="share-icon" 
          className="w-6 svg-white cursor-pointer hover:opacity-80" 
        />
      </div>
      {/* ===== LEVEL 3 END ===== */}

      {/* ===== LEVEL 4 START ===== */}
      <div className="level-4 w-full flex justify-between items-center px-4 md:px-8 py-4 text-white">
        {teamCard(match?.teamB, ETeam.teamB)}
      </div>
      {/* ===== LEVEL 4 END ===== */}

      {/* ===== LEVEL 5 START ===== */}
      <div className="level-5 w-full flex justify-between items-start px-4 md:px-8 py-4 text-white">
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
        <Link 
          href={`/matches/${match._id}/${ldoIdUrl}`} 
          className="px-6 py-2 bg-yellow-logo text-black font-semibold rounded-md shadow-md hover:bg-yellow-600 transition-colors duration-300"
        >
          Enter
        </Link>
      </div>
      {/* ===== LEVEL 7 END ===== */}
    </div>
  );
}

export default React.memo(MatchCard);