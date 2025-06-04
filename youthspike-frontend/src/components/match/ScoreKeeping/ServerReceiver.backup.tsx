
'use client';

import SelectInput from '@/components/elements/SelectInput';
import TextImg from '@/components/elements/TextImg';
import cld from '@/config/cloudinary.config';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrNetNum } from '@/redux/slices/netSlice';
import { IMatchExpRel, IUser } from '@/types';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface IServerReceiverProps {
  matchId: string;
  matchData: IMatchExpRel;
  token: string | null;
  userInfo: IUser | null;
}

function ServerReceiver({ matchId, matchData, token, userInfo }: IServerReceiverProps) {
  const dispatch = useAppDispatch();
  const { roundList, current: currRound } = useAppSelector((state) => state.rounds);
  const { currNetNum, currentRoundNets: currRoundNets } = useAppSelector((state) => state.nets);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);

  // Local state
  const [serverPlaceholder, setServerPlaceholder] = useState<boolean>(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);

  const handleNetChange = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    dispatch(setCurrNetNum(parseInt(inputEl.value, 10)));
  }, []);

  const handleAddServer = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    setServerPlaceholder(true);
  }, []);

  const handleAddReceiver = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
  }, []);

  // e=>
  const handleServerSelection = useCallback((e: React.SyntheticEvent, playerId: string | undefined) => {
    e.preventDefault();
    setSelectedServer(playerId || null);
    setServerPlaceholder(false);
  }, []);

  const handleClosePlayers = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    setSelectedServer(null);
    setServerPlaceholder(false);
  }, []);

  useEffect(() => {
    // Setup fetched data
    (async () => {
      await organizeFetchedData({
        matchData,
        token,
        userInfo,
        matchId,
        dispatch,
      });
    })();
  }, []);

  const playersOfSelectedNet = useMemo(() => {
    if (!currNetNum) return null;
    const currNet = currRoundNets.find((n) => n.num === currNetNum);
    return {
      teamAPlayerA: currNet?.teamAPlayerA,
      teamAPlayerB: currNet?.teamAPlayerB,
      teamBPlayerA: currNet?.teamBPlayerA,
      teamBPlayerB: currNet?.teamBPlayerB,
    };
  }, [currRoundNets, currNetNum]);

  const serverTeam = useMemo(() => {
    if (!selectedServer) return null;

    const teamAMap = new Map(teamAPlayers.map((p) => [p._id, p]));
    const teamBMap = new Map(teamBPlayers.map((p) => [p._id, p]));

    let server = null,
      servingPartner = null;

    if (teamAMap.has(selectedServer)) {
      if (!currNetNum) return null;
      const currNet = currRoundNets.find((n) => n.num === currNetNum);
      if (selectedServer === currNet?.teamAPlayerA) {
        server = teamAMap.get(currNet?.teamAPlayerA);
        servingPartner = teamAMap.get(currNet?.teamAPlayerB || '') || null;
      } else if (selectedServer === currNet?.teamAPlayerB) {
        server = teamAMap.get(currNet?.teamAPlayerB);
        servingPartner = teamAMap.get(currNet?.teamAPlayerA || '') || null;
      } else {
        return null;
      }
    }

    if (teamBMap.has(selectedServer)) {
      if (!currNetNum) return null;
      const currNet = currRoundNets.find((n) => n.num === currNetNum);
      if (selectedServer === currNet?.teamBPlayerA) {
        server = teamBMap.get(currNet?.teamBPlayerA);
        servingPartner = teamBMap.get(currNet?.teamBPlayerB || '') || null;
      } else if (selectedServer === currNet?.teamBPlayerB) {
        server = teamBMap.get(currNet?.teamBPlayerB);
        servingPartner = teamBMap.get(currNet?.teamBPlayerA || '') || null;
      } else {
        return null;
      }
    }

    return {
      server,
      servingPartner,
    };
  }, [selectedServer, teamAPlayers, teamBPlayers]);

  const renderTeamA = useMemo(() => {
    const playersMap = new Map(teamAPlayers.map((p) => [p._id, p]));
    const playerA = playersMap.get(playersOfSelectedNet?.teamAPlayerA || '');
    const playerB = playersMap.get(playersOfSelectedNet?.teamAPlayerB || '');

    return (
      <div>
        <h4>Team A</h4>
        <ul>
          <li role="presentation" onClick={(e) => handleServerSelection(e, playerA?._id)}>
            {playerA?.firstName} {playerA?.lastName}
          </li>
          <li role="presentation" onClick={(e) => handleServerSelection(e, playerB?._id)}>
            {playerB?.firstName} {playerB?.lastName}
          </li>
        </ul>
      </div>
    );
  }, [teamAPlayers, playersOfSelectedNet]);

  const renderTeamB = useMemo(() => {
    const playersMap = new Map(teamBPlayers.map((p) => [p._id, p]));
    const playerA = playersMap.get(playersOfSelectedNet?.teamBPlayerA || '');
    const playerB = playersMap.get(playersOfSelectedNet?.teamBPlayerB || '');

    return (
      <div>
        <h4>Team B</h4>
        <ul>
          <li role="presentation" onClick={(e) => handleServerSelection(e, playerA?._id)}>
            {playerA?.firstName} {playerA?.lastName}
          </li>
          <li role="presentation" onClick={(e) => handleServerSelection(e, playerB?._id)}>
            {playerB?.firstName} {playerB?.lastName}
          </li>
        </ul>
      </div>
    );
  }, [teamBPlayers, playersOfSelectedNet]);

  return (
    <div>
      <SelectInput handleSelect={handleNetChange} name="currNetNum" optionList={currRoundNets.map((crn, i) => ({ id: i + 1, value: String(crn.num), text: `Net ${crn.num}` }))} />
      {!currRound || currNetNum === 0 ? (
        <div>{!currRound && <h3 className="uppercase">No round has been selected!</h3>}</div>
      ) : serverPlaceholder ? (
        <div className="display-server-receiver">
          <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400">Select a server</h3>
          {playersOfSelectedNet && (
            <div className="team-players mt-4">
              <img src="/icons/close.svg" className="svg-white" role="presentation" onClick={handleClosePlayers} />
              {renderTeamA}
              {renderTeamB}
            </div>
          )}
        </div>
      ) : (
        <div className="display-server-receiver">
          <h3 className="text-xl font-semibold uppercase text-center mb-6 text-yellow-400">Selected Server/Receiver</h3>
          <div className="w-full flex flex-col lg:flex-row justify-center items-center gap-6">
            {/* Left Side */}
            <div className="w-full lg:w-1/3 flex flex-col items-center gap-4">
              <div className="w-32 h-32"></div>
              {/* <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" /> */}
              <div className="h-24 w-24 bg-white text-black flex items-center justify-center rounded-xl shadow-md">
                {selectedServer && serverTeam ? (
                  serverTeam?.servingPartner?.profile ? (
                    <AdvancedImage cldImg={cld.image(serverTeam?.servingPartner?.profile)} />
                  ) : (
                    <TextImg className="w-full h-full rounded-xl" fText={serverTeam?.servingPartner?.firstName} lText={serverTeam?.servingPartner?.lastName} />
                  )
                ) : (
                  <div />
                )}
              </div>
              <h3 className="text-center uppercase text-yellow-400 font-semibold">
                Serving <br /> Partner
              </h3>
              {/* <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" /> */}
              <div className="w-32 h-32"></div>
            </div>

            {/* Middle Side */}
            <div className="w-full lg:w-1/3 flex justify-center items-center">
              <div className="w-4/6 md:w-2/6 flex flex-col items-center gap-6 bg-white text-black rounded-xl p-6 shadow-lg">
                <Image alt="Logo" src="/imgs/spikeball-logo.webp" width={40} height={40} className="mb-2" />

                <div className="bg-black h-24 w-24 flex items-center justify-center rounded-xl border-4 border-yellow-400" role="presentation" onClick={handleAddServer}>
                  {selectedServer && serverTeam ? (
                    serverTeam?.server?.profile ? (
                      <AdvancedImage cldImg={cld.image(serverTeam?.server?.profile)} />
                    ) : (
                      <TextImg className="w-full h-full rounded-0" fText={serverTeam?.server?.firstName} lText={serverTeam?.server?.lastName} />
                    )
                  ) : (
                    <Image alt="Add Server" src="/icons/plus.svg" width={50} height={50} className="invert" />
                  )}
                </div>
                <h3 className="uppercase text-center font-semibold text-yellow-400">Server</h3>

                <div className="flex justify-center items-center py-2">
                  <Image alt="Net" src="/imgs/spikeball-net.png" width={80} height={80} />
                </div>

                <div className="bg-black h-24 w-24 flex items-center justify-center rounded-xl border-4 border-yellow-400" role="presentation" onClick={handleAddReceiver}>
                  <Image alt="Add Receiver" src="/icons/plus.svg" width={50} height={50} className="invert" />
                </div>
                <h3 className="uppercase text-center font-semibold text-yellow-400">Receiver</h3>
              </div>
            </div>

            {/* Right Side */}
            <div className="w-full lg:w-1/3 flex flex-col items-center gap-4">
              {/* <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" /> */}
              <div className="w-32 h-32"></div>
              <div className="h-24 w-24 bg-white text-black flex items-center justify-center rounded-xl shadow-md">{/* Placeholder for player avatar or info */}</div>
              <h3 className="text-center uppercase text-yellow-400 font-semibold">
                Receiving <br /> Partner
              </h3>
              {/* <Image alt="Player" src="/imgs/player.png" width={100} height={100} className="w-32 h-32 object-cover rounded-xl border-4 border-yellow-400" /> */}
              <div className="w-32 h-32"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServerReceiver;
