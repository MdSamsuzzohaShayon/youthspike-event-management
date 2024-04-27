import { useUser } from '@/lib/UserProvider';
import { IMatchExpRel, INetRelatives, IRoundExpRel, IRoundRelatives } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { FRONTEND_URL } from '@/utils/keys';
import { calcRoundScore } from '@/utils/scoreCalc';
import Link from 'next/link';
import React, { useState } from 'react';
import { readDate, readTime } from '@/utils/datetime';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import Image from 'next/image';

interface MatchCardProps {
  match: IMatchExpRel;
}

function MatchCard({ match }: MatchCardProps) {
  const user = useUser();
  const [roundList, setRoundList] = useState<IRoundExpRel[]>(match?.rounds ? match.rounds : []);
  // @ts-ignore
  const [allNets, setAllNets] = useState<INetRelatives[]>(match?.nets ? match.nets.map((n) => ({ ...n, round: n.round._id })) : []);
  

  const teamCard = (team: ITeam, teamE: ETeam) => {
    let pointsOfRound = 0;
    roundList.forEach((r) => {
      const { score } = calcRoundScore(
        allNets.filter((n) => n.round === r._id),
        r,
        teamE,
      );
      pointsOfRound += score;
    });
    return (
      <>
        <div className="advanced-img w-14">
          {team?.logo ? <AdvancedImage cldImg={cld.image(team?.logo)} className="w-full h-full" /> : <Image src="/free-logo.png" className="w-full h-full" alt="free-logo" />}
        </div>
        <h3 className="capitalize">{team.name}</h3>
        <h1 className="h-12 w-12 flex justify-center items-center rounded-full border border-gray-100">{pointsOfRound}</h1>
      </>
    );
  };

  return (
    <div className="w-full md:w-5/12 bg-gray-700 flex flex-col justify-between items-center relative rounded-lg" style={{ minHeight: '6rem' }}>
      {/* ===== LEVEL 1 START ===== */}
      <div className="level-1 w-full flex justify-center px-2 md:px-6 mt-2 md:mt-6">
        <Link href={`/matches/${match._id}`} className="btn-info">
          Enter
        </Link>
      </div>
      {/* ===== LEVEL 1 END ===== */}

      {/* ===== LEVEL 2 START ===== */}
      <div className="lavel-2 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">{teamCard(match?.teamA, ETeam.teamA)}</div>
      {/* ===== LEVEL 2 END ===== */}

      {/* ===== LEVEL 3 START ===== */}
      <div className="lavel-3 w-full flex justify-center items-center px-2 md:px-6 mt-2 md:mt-6 gap-x-2">
        <h1>VS</h1>
      </div>
      {/* ===== LEVEL 3 END ===== */}

      {/* ===== LEVEL 4 START ===== */}
      <div className="lavel-4 w-full flex justify-between items-center px-2 md:px-6 mt-2 md:mt-6">{teamCard(match?.teamB, ETeam.teamB)}</div>
      {/* ===== LEVEL 4 END ===== */}

      {/* ===== LEVEL 5 START ===== */}
      <div className="lavel-4 w-full flex justify-between items-start px-2 md:px-6 mt-2 md:mt-6 pb-2">
        <div className="w-3/6">
          <p className="flex justify-start items-center gap-x-2 mb-2">
            <span>
              <Image width={20} height={20} src="/icons/clock.svg" className="w-6 svg-white" alt="clock-logo" />
            </span>
            <span>{readDate(match.date)}</span>
          </p>
          <p className="flex justify-start items-center gap-x-2">
            <span>
              <Image width={20} height={20} src="/icons/date.svg" className="w-6 svg-white" alt="date-logo" />
            </span>
            <span>Start {readTime(match.date)}</span>
          </p>
        </div>
        <div className="w-3/6 text-end">
          <p className="flex justify-start items-center gap-x-2">
            <span>
              <Image width={20} height={20} src="/icons/location.svg" className="w-6 svg-white" alt="location-logo" />
            </span>
            <span>{match.location}</span>
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
      {/* ===== LEVEL 5 END ===== */}
    </div>
  );
}

export default MatchCard;
