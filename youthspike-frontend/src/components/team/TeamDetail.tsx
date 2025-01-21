import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { IEvent, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import { useLdoId } from '@/lib/LdoProvider';
import { useAppDispatch } from '@/redux/hooks';
import { setRankingMap } from '@/redux/slices/playerRankingSlice';
import Link from 'next/link';
import TextImg from '../elements/TextImg';
import PlayerList from '../player/PlayerList';
import MatchList from '../match/MatchList';
import PlayerStandings from '../player/PlayerStandings';

interface ITeamDetailProps {
  event: IEvent;
  team: ITeam;
}


// eslint-disable-next-line no-unused-vars, no-shadow
enum ETab {
  // eslint-disable-next-line no-unused-vars
  ROSTER = 'ROSTER',
  // eslint-disable-next-line no-unused-vars
  MATCHES = 'MATCHES',
}

function TeamDetail({ event, team }: ITeamDetailProps) {
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();

  const [selectedItem, setSelectedItem] = useState<ETab>(ETab.ROSTER);

  const handleSelectGroup = (e: React.SyntheticEvent, tab: ETab) => {
    e.preventDefault();
    setSelectedItem(tab);
  };

  useEffect(() => {
    if (team && team.playerRanking) {
      const rankingMap = new Map();
      // @ts-ignore
      team.playerRanking.rankings.forEach(({ player, rank }) => rankingMap.set(player._id, rank));
      dispatch(setRankingMap(Array.from(rankingMap)));
    }
  }, [dispatch, team]);

  const showContent = useCallback(() => {
    switch (selectedItem) {
      case ETab.ROSTER:
        // Players should be shown with their records. Win / losses for games
        // return <PlayerList playerList={team.players} matchList={team.matches} showRank />;
        return <PlayerStandings matchList={team.matches} playerList={team.players} teamRank />;
      case ETab.MATCHES:
        // @ts-ignore
        return <MatchList matchList={team.matches} division={team.division} />;
      default:
        return <PlayerStandings matchList={team.matches} playerList={team.players} teamRank />;
    }
  }, [selectedItem, team.division, team.matches, team.players]);

  return (
    <div className="min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold uppercase">Teams / Roster</h1>
        <h2 className="text-lg text-gray-300 uppercase">{event?.name}</h2>
      </div>

      <div className="team-detail flex flex-col items-center bg-gray-800 rounded-lg shadow-lg p-6">
        {team.logo ? (
          <AdvancedImage cldImg={cld.image(team.logo)} className="w-24 h-24 mb-4 rounded-full object-cover" />
        ) : (
          <TextImg className="w-24 h-24 mb-4 rounded-full bg-gray-700 flex items-center justify-center" fullText={team.name} txtCls="text-2xl" />
        )}
        <h3 className="text-xl font-semibold capitalize mb-4">{team.name}</h3>

        <Link href={`/events/${team.event._id}/${ldoIdUrl}`} className="btn-success bg-yellow-500 text-black py-2 px-4 rounded-md font-medium shadow hover:bg-yellow-400 transition mb-6">
          Main Event
        </Link>

        <div className="tab-menu w-full mb-6 bg-gray-700 rounded-lg p-4">
          <motion.ul className="flex justify-around items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <motion.li
              role="presentation"
              onClick={(e) => handleSelectGroup(e, ETab.ROSTER)}
              className={`p-3 w-1/2 text-center rounded-md cursor-pointer ${selectedItem === ETab.ROSTER ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-600 text-white'}`}
              whileHover={{ scale: 1.05 }}
            >
              Rosters
            </motion.li>
            <motion.li
              role="presentation"
              onClick={(e) => handleSelectGroup(e, ETab.MATCHES)}
              className={`p-3 w-1/2 text-center rounded-md cursor-pointer ${selectedItem === ETab.MATCHES ? 'bg-yellow-500 text-black font-bold' : 'bg-gray-600 text-white'}`}
              whileHover={{ scale: 1.05 }}
            >
              Matches
            </motion.li>
          </motion.ul>
        </div>
      </div>

      <div className="content mt-6">{showContent()}</div>
    </div>
  );
}

export default TeamDetail;
