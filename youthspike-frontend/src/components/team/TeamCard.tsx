/* eslint-disable react/require-default-props */
import { IMatchExpRel, IPlayer, IRoundRelatives, ITeam } from '@/types';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { calcRoundScore } from '@/utils/scoreCalc';
import { ETeam } from '@/types/team';
import { useUser } from '@/lib/UserProvider';
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import Image from 'next/image';
import { imgW } from '@/utils/constant';
import { useLdoId } from '@/lib/LdoProvider';
import TextImg from '../elements/TextImg';
import { CldImage } from 'next-cloudinary';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface ITeamCardProps {
  team: ITeamCaptain;
  matchList?: IMatch[];
}

// Helper to calculate scores for a given team
const calculateScores = (match: IMatch, team: ITeamCaptain) => {
  let teamScore = 0;
  let opponentScore = 0;

  // @ts-ignore
  match.rounds.forEach((round: IRoundRelatives) => {
    if (!match.nets) return;

    const netList = match.nets.filter(
      (n) => typeof n.round === 'object' && (n.round as { _id: string })._id === round._id
    );
    const { score: myScore } = calcRoundScore(netList, round, team._id === match.teamA._id ? ETeam.teamA : ETeam.teamB);
    const { score: opScore } = calcRoundScore(netList, round, team._id === match.teamA._id ? ETeam.teamB : ETeam.teamA);

    teamScore += myScore;
    opponentScore += opScore;
  });

  return { teamScore, opponentScore };
};

function TeamCard({ team, matchList = [] }: ITeamCardProps) {
  console.log({team, matchList});
  
  const user = useUser();
  const params = useParams();
  const { ldoIdUrl } = useLdoId();

  const [teamScores, setTeamScores] = useState({ myTeamScore: 0, opTeamScore: 0 });

  useEffect(() => {
    if (matchList.length === 0) return;

    let totalTeamScore = 0;
    let totalOpponentScore = 0;

    matchList.forEach((match) => {
      const { teamScore, opponentScore } = calculateScores(match, team);
      totalTeamScore += teamScore;
      totalOpponentScore += opponentScore;
    });

    setTeamScores({ myTeamScore: totalTeamScore, opTeamScore: totalOpponentScore });

    // eslint-disable-next-line consistent-return
    return () => setTeamScores({ myTeamScore: 0, opTeamScore: 0 });
  }, [matchList, team]);

  const { myTeamScore, opTeamScore } = teamScores;

  return (
    <div className="team-card w-full flex justify-between items-center bg-gray-700 rounded-lg">
      <Link href={`/teams/${team._id}/${ldoIdUrl}`} className=" w-11/12 p-2 flex items-start justify-between">
        <div className="w-6/12">
          <div className="brand flex gap-1 items-center">
            {team.logo ? (
              <div className="advanced-img w-12">
                <CldImage alt={team.name} width="200" height="200" className="w-full" src={team.logo} crop="fit" />
              </div>
            ) : (
              <TextImg className="w-12 h-12" fullText={team.name} />
            )}
            <div className="name-record">
              <h3 className="leading-none text-lg font-bold">{team.name}</h3>
              {myTeamScore > 0 && (
                <p>
                  Records {myTeamScore}-{opTeamScore}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="w-6/12 brand flex gap-2">
          {team.captain?.profile && (
            <div className="advanced-img w-12 h-12 border-2 border-yellow-logo">
              <CldImage alt={team.captain.firstName} width="200" height="200" className="w-full" src={team.captain.profile} crop="fit" />
            </div>
          )}
          {team.captain?.firstName && (
            <div className="caption flex flex-col justify-center">
              <h3 className="leading-none text-lg font-bold capitalize">{`${team.captain.firstName} ${team.captain.lastName}`}</h3>
              <p className="uppercase text-xs">Captain</p>
            </div>
          )}
        </div>
      </Link>
      <div className="w-1/12">
        {user.token && (
          <Link href={`${ADMIN_FRONTEND_URL}/${params.eventId}/teams/${team._id}/${ldoIdUrl}`} className="pe-2 flex items-center justify-end">
            <Image src="/icons/edit.svg" height={imgW.logo} width={imgW.logo} alt="Exit Button" className="svg-white" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default TeamCard;
