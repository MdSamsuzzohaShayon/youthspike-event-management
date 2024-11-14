/* eslint-disable react/require-default-props */
import { IGroup, IMatchExpRel, IPlayer, ITeam } from '@/types';
import React, { useState } from 'react';
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
  groupList: IGroup[];
  teamList?: ITeamCaptain[];
  matchList?: IMatch[];
}

function TeamList({ groupList, teamList, matchList }: ITeamListProps) {
  
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const handleSelectGroup = (e: React.SyntheticEvent, groupId: string | null) => {
    e.preventDefault();
    setSelectedItem(groupId);
  };

  const renderTeamCardMatches = (team: ITeamCaptain, ml?: IMatch[]) => {
    if (!ml) return null;
    const newMatchList = ml.filter((match) => match.teamA._id === team._id || match.teamB._id === team._id);

    return <TeamCard team={team} key={team._id} matchList={newMatchList} />;
  };

  return (
    <div className="teamList w-full flex flex-col lg:gap-4">
      <div className="group-menu w-full mb-4 lg:sticky lg:top-4 p-4 bg-gray-800 rounded-md">
        <h2 className="text-lg font-semibold mb-2 text-white text-center">Groups</h2>
        <motion.ul className="w-full flex flex-wrap justify-around items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <motion.li
            key="group-for-all"
            role="presentation"
            onClick={(e) => handleSelectGroup(e, null)}
            className={`p-2 rounded-md cursor-pointer mb-2 text-center ${selectedItem === null ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-700 text-white'}`}
            whileHover={{ scale: 1.1 }}
          >
            All
          </motion.li>
          {groupList.map((group) => (
            <motion.li
              key={group._id}
              role="presentation"
              onClick={(e) => handleSelectGroup(e, group._id)}
              className={`p-2 rounded-md cursor-pointer mb-2 text-center ${selectedItem === group._id ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-700 text-white'}`}
              whileHover={{ scale: 1.1 }}
            >
              {group.name}
            </motion.li>
          ))}
        </motion.ul>
      </div>

      <div className="map-card flex flex-col gap-4">
        {teamList &&
          (selectedItem
            ? teamList.map(
                (team) =>
                  team.group._id === selectedItem && (
                    <motion.div key={team._id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                      {renderTeamCardMatches(team, matchList)}
                    </motion.div>
                  ),
              )
            : teamList.map((team) => (
                <motion.div key={team._id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                  {renderTeamCardMatches(team, matchList)}
                </motion.div>
              )))}
      </div>
    </div>
  );
}

export default TeamList;
