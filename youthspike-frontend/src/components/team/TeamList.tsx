/* eslint-disable react/require-default-props */
import { IMatchExpRel, IPlayer, ITeam } from '@/types';
import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import TeamCard from './TeamCard';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatch extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface ITeamListProps {
  // division: string | null;
  teamList?: ITeamCaptain[];
  matchList?: IMatch[];
}

function TeamList({ teamList, matchList }: ITeamListProps) {
  const renderTeamCardMatches = useCallback((team: ITeamCaptain, ml?: IMatch[]) => {
    if (!ml) return null;
    const newMatchList = ml.filter((match) => match.teamA._id === team._id || match.teamB._id === team._id);

    return <TeamCard team={team} key={team._id} matchList={newMatchList} />;
  }, []);

  return (
    <div className="teamList w-full flex flex-col lg:gap-4">
      <div className="map-card flex flex-col gap-4">
        {teamList &&
          teamList.map((team, index) => (
            <motion.div key={team?._id || index} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              {renderTeamCardMatches(team, matchList)}
            </motion.div>
          ))}
      </div>
    </div>
  );
}

export default TeamList;
