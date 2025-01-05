'use client';

import React, { useState, useEffect } from 'react';
import Message from '@/components/elements/Message';
import EventAddUpdate from '@/components/event/EventAddUpdate';
import PlayerAdd from '@/components/player/PlayerAdd';
import UserMenuList from '@/components/layout/UserMenuList';
import Loader from '@/components/elements/Loader';
import { IError, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useLazyQuery } from '@apollo/client';
import { GET_A_EVENT } from '@/graphql/event';
import { GET_A_PLAYER } from '@/graphql/players';
import { isValidObjectId } from '@/utils/helper';
import { useUser } from '@/lib/UserProvider';
import { getCookie } from '@/utils/cookie';
import { motion } from 'framer-motion';
import CurrentEvent from '@/components/event/CurrentEvent';
import { useError } from '@/lib/ErrorContext';

const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const titleVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.6 } },
};

const SettingsPage = ({ params }: { params: { eventId: string } }) => {
  // Hooks
  const user = useUser();
  const { setActErr } = useError();

  // Local State
  const [isLoading, setIsLoading] = useState(false);
  const [teamList, setTeamList] = useState<ITeam[]>([]);

  // Queries
  const [fetchEvent, { data, loading, error }] = useLazyQuery(GET_A_EVENT, {
    variables: { eventId: params.eventId },
  });

  const [fetchPlayer, { data: playerData, error: playerErr, loading: playerLoading }] =
    useLazyQuery(GET_A_PLAYER);

  const playerUpdateCB = () => {
    // Callback for Player Update
  };

  useEffect(() => {
    if (params.eventId) {
      if (isValidObjectId(params.eventId)) {
        const userCookie = getCookie('user');
        if (userCookie) {
          const userRes = JSON.parse(userCookie);
          if (userRes.role === UserRole.captain || userRes.role === UserRole.co_captain) {
            const playerId =
              userRes.captainplayer || userRes.cocaptainplayer || null;
            if (playerId) fetchPlayer({ variables: { playerId } });
          } else {
            fetchEvent({ variables: { eventId: params.eventId } });
          }
        }
      } else {
        setActErr({ success: false, message: 'Invalid Event ID!' });
      }
    }
  }, [params.eventId]);

  if (loading || isLoading || playerLoading) return <Loader />;

  const prevEvent = data?.getEvent?.data;
  const prevPlayer = playerData?.getPlayer?.data;
  if(error){
    console.log(error);
    
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={pageVariants}
      className="container mx-auto px-4 py-8 min-h-screen"
    >
      {/* Title */}
      <motion.h1
        variants={titleVariants}
        className="text-3xl font-bold text-center mb-8"
      >
        {user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain
          ? 'Update Captain'
          : 'Update Event'}
      </motion.h1>

      {/* Navigation Menu */}
      {/* Event Menu Start */}
      <div className="event-and-menu bg-gray-800 p-8 rounded-lg shadow-lg">
        {prevEvent && <CurrentEvent currEvent={prevEvent} />}
        <div className="navigator mt-8">
          <UserMenuList eventId={params.eventId} />
        </div>
      </div>
      {/* Event Menu End */}

      {/* Main Content */}
      <div className="event-player-action mb-10">
        {user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain ? (
          prevPlayer && (
            <PlayerAdd
              setIsLoading={setIsLoading}
              eventId={params.eventId}
              update
              prevPlayer={prevPlayer}
              teamList={teamList}
              playerUpdateCB={playerUpdateCB}
            />
          )
        ) : (
          prevEvent && (
            <EventAddUpdate
              update
              setIsLoading={setIsLoading}
              prevEvent={prevEvent}
            />
          )
        )}
      </div>
    </motion.div>
  );
};

export default SettingsPage;
