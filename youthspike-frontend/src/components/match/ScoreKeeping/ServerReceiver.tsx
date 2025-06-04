// components/ServerReceiver.tsx
'use client';

import SelectInput from '@/components/elements/SelectInput';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrNetNum } from '@/redux/slices/netSlice';
import { IMatchExpRel, IPlayer, IUser } from '@/types';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo } from 'react';
import KeepTeamPlayers from './KeepTeamPlayers';
import KeepPlayerCard from './KeepPlayerCard';

interface ServerReceiverProps {
  matchId: string;
  matchData: IMatchExpRel;
  token: string | null;
  userInfo: IUser | null;
}

const ServerReceiver: React.FC<ServerReceiverProps> = ({ matchId, matchData, token, userInfo }) => {
  const dispatch = useAppDispatch();
  const { current: currRound } = useAppSelector((state) => state.rounds);
  const { currNetNum, currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);

  // Local state
  const [serverPlaceholder, setServerPlaceholder] = React.useState(false);
  const [selectedServer, setSelectedServer] = React.useState<string | null>(null);

  // Memoize players by ID for O(1) lookups
  const playersById = useMemo(() => {
    const map = new Map<string, IPlayer>();
    teamAPlayers.forEach(p => map.set(p._id, p));
    teamBPlayers.forEach(p => map.set(p._id, p));
    return map;
  }, [teamAPlayers, teamBPlayers]);

  // Memoize current net players
  const currentNetPlayers = useMemo(() => {
    if (!currNetNum) return null;
    const net = currRoundNets.find(n => n.num === currNetNum);
    if (!net) return null;

    return {
      teamA: [net.teamAPlayerA, net.teamAPlayerB].map(id => id ? playersById.get(id) : undefined),
      teamB: [net.teamBPlayerA, net.teamBPlayerB].map(id => id ? playersById.get(id) : undefined),
    };
  }, [currNetNum, currRoundNets, playersById]);

  // Memoize server team info
  const serverTeam = useMemo(() => {
    if (!selectedServer || !currentNetPlayers) return null;

    const server = playersById.get(selectedServer);
    if (!server) return null;

    // Find serving partner (the other player on the same team)
    const isTeamA = currentNetPlayers.teamA.some(p => p?._id === selectedServer);
    const partner = isTeamA 
      ? currentNetPlayers.teamA.find(p => p?._id !== selectedServer)
      : currentNetPlayers.teamB.find(p => p?._id !== selectedServer);

    return { server, servingPartner: partner };
  }, [selectedServer, currentNetPlayers, playersById]);

  // Handlers
  const handleNetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCurrNetNum(parseInt(e.target.value, 10)));
  }, [dispatch]);

  const handleAddServer = useCallback(() => {
    setServerPlaceholder(true);
  }, []);

  const handlePlayerSelect = useCallback((playerId: string) => {
    setSelectedServer(playerId);
    setServerPlaceholder(false);
  }, []);

  const handleClosePlayers = useCallback(() => {
    setSelectedServer(null);
    setServerPlaceholder(false);
  }, []);

  // Initial data setup
  useEffect(() => {
    organizeFetchedData({ matchData, token, userInfo, matchId, dispatch });
  }, [matchData, token, userInfo, matchId, dispatch]);

  if (!currRound || currNetNum === 0) {
    return <div>{!currRound && <h3 className="uppercase">No round has been selected!</h3>}</div>;
  }

  if (serverPlaceholder && currentNetPlayers) {
    return (
      <div className="display-server-receiver">
        <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400">
          Select a server
        </h3>
        <div className="team-players mt-4">
          <button 
            onClick={handleClosePlayers}
            className="absolute top-4 right-4 p-2"
            aria-label="Close player selection"
          >
            <Image src="/icons/close.svg" width={24} height={24} className="invert" alt="Close" />
          </button>
          <KeepTeamPlayers
            teamName="Team A"
            players={currentNetPlayers.teamA}
            onPlayerSelect={handlePlayerSelect}
          />
          <KeepTeamPlayers
            teamName="Team B"
            players={currentNetPlayers.teamB}
            onPlayerSelect={handlePlayerSelect}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SelectInput
        handleSelect={handleNetChange}
        name="currNetNum"
        optionList={currRoundNets.map((crn, i) => ({
          id: i + 1,
          value: String(crn.num),
          text: `Net ${crn.num}`,
        }))}
      />

      <div className="display-server-receiver">
        <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400">
          Selected Server/Receiver
        </h3>
        
        <div className="w-full flex flex-col lg:flex-row justify-center items-center gap-6">
          {/* Serving Partner */}
          <div className="w-full lg:w-1/3 flex flex-col items-center gap-4">
            <div className="w-32 h-32" />
            <KeepPlayerCard
              player={serverTeam?.servingPartner}
              size="md"
              className="bg-white text-black shadow-md"
            />
            <h3 className="text-center uppercase text-yellow-400 font-semibold">
              Serving <br /> Partner
            </h3>
            <div className="w-32 h-32" />
          </div>

          {/* Server/Receiver Section */}
          <div className="w-full lg:w-1/3 flex justify-center items-center">
            <div className="w-4/6 md:w-2/6 flex flex-col items-center gap-6 bg-white text-black rounded-xl p-6 shadow-lg">
              <Image 
                src="/imgs/spikeball-logo.webp" 
                width={40} 
                height={40} 
                className="mb-2" 
                alt="Spikeball logo" 
              />

              <KeepPlayerCard
                player={serverTeam?.server}
                onClick={handleAddServer}
                className="border-4 border-yellow-400 bg-black"
              />
              <h3 className="uppercase text-center font-semibold text-yellow-400">Server</h3>

              <div className="flex justify-center items-center py-2">
                <Image 
                  src="/imgs/spikeball-net.png" 
                  width={80} 
                  height={80} 
                  alt="Spikeball net" 
                />
              </div>

              <KeepPlayerCard
                onClick={() => {}}
                className="border-4 border-yellow-400 bg-black"
              />
              <h3 className="uppercase text-center font-semibold text-yellow-400">Receiver</h3>
            </div>
          </div>

          {/* Receiving Partner */}
          <div className="w-full lg:w-1/3 flex flex-col items-center gap-4">
            <div className="w-32 h-32" />
            <div className="h-24 w-24 bg-white text-black flex items-center justify-center rounded-xl shadow-md" />
            <h3 className="text-center uppercase text-yellow-400 font-semibold">
              Receiving <br /> Partner
            </h3>
            <div className="w-32 h-32" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerReceiver;
