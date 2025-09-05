'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { IEvent, INetRelatives, IRoundRelatives, ITeam } from '@/types';
import { useLdoId } from '@/lib/LdoProvider';
import { useAppDispatch } from '@/redux/hooks';
import { setRankingMap } from '@/redux/slices/playerRankingSlice';
import Link from 'next/link';
import { EVENT_ITEM } from '@/utils/constant';
import { EEventItem } from '@/types/event';
import TextImg from '../elements/TextImg';
import MatchList from '../match/MatchList';
import PlayerStandings from '../player/PlayerStandings';
import { CldImage } from 'next-cloudinary';

interface ITeamDetailProps {
  event: IEvent;
  team: ITeam;
  nets: INetRelatives[]; 
  rounds: IRoundRelatives[];
}

// eslint-disable-next-line no-unused-vars, no-shadow
enum ETab {
  // eslint-disable-next-line no-unused-vars
  ROSTER = 'ROSTER',
  // eslint-disable-next-line no-unused-vars
  MATCHES = 'MATCHES',
}

function TeamDetail({ event, team, nets, rounds }: ITeamDetailProps) {
  const dispatch = useAppDispatch();
  const { ldoIdUrl } = useLdoId();
  const [redirectSymbol, setRedirectSymbol] = useState<string>('?');

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

  useEffect(() => {
    if (ldoIdUrl && ldoIdUrl !== '') {
      setRedirectSymbol('&');
    }
  }, [ldoIdUrl]);

  const showContent = useCallback(() => {
    switch (selectedItem) {
      case ETab.ROSTER:
        // Players should be shown with their records. Win / losses for games
        return <PlayerStandings matchList={team.matches} playerList={team.players} teamRank />;
      case ETab.MATCHES:
        // @ts-ignore
        return <MatchList matchList={team.matches} nets={nets} rounds={rounds} />;
      default:
        return <PlayerStandings matchList={team.matches} playerList={team.players} teamRank />;
    }
  }, [selectedItem, team.division, team.matches, team.players]);

  // href={`/events/${event._id}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.TEAM}`}

  return (
    <React.Fragment>
      <div className="flex flex-col items-center">
        {/* Header Section */}
        <div className="team-detail w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute inset-0 bg-yellow-400 opacity-10 rounded-2xl blur-lg" />

          {/* Team Logo */}
          {team.logo ? (
            <CldImage alt={team.name} width="200" height="200" className="flex justify-center items-center w-24 h-24 bg-yellow-400 text-gray-900 text-3xl font-bold rounded-full shadow-lg border-4 border-yellow-500 relative z-10" src={team.logo} />
          ) : (
            <TextImg
              className="flex justify-center items-center w-24 h-24 bg-yellow-400 text-gray-900 text-3xl font-bold rounded-full shadow-lg border-4 border-yellow-500 relative z-10"
              fullText={team.name}
              txtCls="text-2xl"
            />
          )}

          {/* Team Name */}
          <h3 className="text-2xl font-semibold mt-5 relative z-10">{team.name}</h3>

          {/* Event Title */}
          <div className="text-center mb-6 relative z-10">
            <h1 className="text-4xl font-extrabold uppercase tracking-wide text-yellow-400">Teams / Roster</h1>
            <h2 className="text-sm text-gray-300 uppercase mt-1">{event.name}</h2>
          </div>

          {/* Standings Button */}
          <Link
            href={`/events/${event._id}/${ldoIdUrl}${redirectSymbol}${EVENT_ITEM}=${EEventItem.TEAM}`}
            className="mt-5 bg-yellow-500 hover:bg-yellow-400 text-gray-900 transition py-3 px-6 rounded-lg text-md font-medium shadow-lg relative z-10"
          >
            View Standings
          </Link>

          {/* Tab Menu */}
          <div className="tab-menu w-full mt-6 relative z-10">
            <ul className="flex bg-gray-700 rounded-xl overflow-hidden border border-gray-600 text-md shadow-lg">
              <li
                className={`w-1/2 text-center py-4 cursor-pointer ${
                  selectedItem === ETab.ROSTER ? 'bg-yellow-500 text-gray-900 font-bold tracking-wide' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                role="presentation"
                onClick={(e) => handleSelectGroup(e, ETab.ROSTER)}
              >
                Rosters
              </li>
              <li
                className={`w-1/2 text-center py-4 cursor-pointer ${
                  selectedItem === ETab.MATCHES ? 'bg-yellow-500 text-gray-900 font-bold tracking-wide' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
                role="presentation"
                onClick={(e) => handleSelectGroup(e, ETab.MATCHES)}
              >
                Matches
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="content mt-6">{showContent()}</div>
    </React.Fragment>
  );
}

export default TeamDetail;
