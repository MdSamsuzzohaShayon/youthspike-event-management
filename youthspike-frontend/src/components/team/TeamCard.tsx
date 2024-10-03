import { IMatchExpRel, IPlayer, IRoundRelatives, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import cld from '@/config/cloudinary.config';
import TextImg from '../elements/TextImg';
import { calcRoundScore } from '@/utils/scoreCalc';
import { ETeam } from '@/types/team';

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

  match.rounds.forEach((round: IRoundRelatives) => {
    if (!match.nets) return;

    const netList = match.nets.filter(n => n.round._id === round._id);
    const { score: myScore } = calcRoundScore(netList, round, team._id === match.teamA._id ? ETeam.teamA : ETeam.teamB);
    const { score: opScore } = calcRoundScore(netList, round, team._id === match.teamA._id ? ETeam.teamB : ETeam.teamA);

    teamScore += myScore;
    opponentScore += opScore;
  });

  return { teamScore, opponentScore };
};

function TeamCard({ team, matchList = [] }: ITeamCardProps) {
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
    <Link href={`/teams/${team._id}`} className="team-card w-full p-2 bg-gray-700 rounded-lg flex items-start justify-between">
      <div className="w-6/12">
        <div className="brand flex gap-1 items-center">
          {team.logo ? (
            <div className="advanced-img w-12">
              <AdvancedImage cldImg={cld.image(team.logo)} alt={team.name} className="w-full" />
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
      <div className="w-6/12">
        <div className="brand flex gap-1">
          {team.captain?.profile && (
            <div className="advanced-img w-12 h-12 rounded-full border-2 border-yellow-logo">
              <AdvancedImage cldImg={cld.image(team.captain.profile)} alt={team.captain.firstName} className="w-full" />
            </div>
          )}
          {team.captain?.firstName && (
            <div className="caption flex flex-col">
              <p className="uppercase text-xs">Captain</p>
              <h3 className="leading-none text-lg font-bold capitalize">
                {`${team.captain.firstName} ${team.captain.lastName}`}
              </h3>
            </div>
          )}
        </div>
        {team.players && (
          <p className="flex gap-1">
            Active players <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black-logo">{team.players.length}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

export default TeamCard;
