'use client';

import SelectInput from '@/components/elements/SelectInput';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrNetNum } from '@/redux/slices/netSlice';
import { IMatchExpRel, IReceiverTeam, IServerTeam, IUser } from '@/types';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ServerReceiverDisplay from './ServerReceiverDisplay';
import PlayerSelection from './PlayerSelection';

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
  const [receiverPlaceholder, setReceiverPlaceholder] = useState<boolean>(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);

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
    setReceiverPlaceholder(true);
  }, []);

  const handleServerSelection = useCallback((e: React.SyntheticEvent, playerId: string | undefined) => {
    e.preventDefault();
    setSelectedServer(playerId || null);
    setServerPlaceholder(false);
  }, []);

  const handleReceiverSelection = useCallback((e: React.SyntheticEvent, playerId: string | undefined) => {
    e.preventDefault();
    setSelectedReceiver(playerId || null);
    setReceiverPlaceholder(false);
  }, []);

  const handleClosePlayers = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    setSelectedServer(null);
    setServerPlaceholder(false);
    setSelectedReceiver(null);
    setReceiverPlaceholder(false);
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

  const serverTeam: IServerTeam | null = useMemo(() => {
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
      server: server || null,
      servingPartner,
    };
  }, [selectedServer, teamAPlayers, teamBPlayers]);

  const receiverTeam: IReceiverTeam | null = useMemo(() => {
    if (!selectedReceiver) return null;

    const teamAMap = new Map(teamAPlayers.map((p) => [p._id, p]));
    const teamBMap = new Map(teamBPlayers.map((p) => [p._id, p]));

    let receiver = null,
      receivingPartner = null;

    if (teamAMap.has(selectedReceiver)) {
      if (!currNetNum) return null;
      const currNet = currRoundNets.find((n) => n.num === currNetNum);
      if (selectedReceiver === currNet?.teamAPlayerA) {
        receiver = teamAMap.get(currNet?.teamAPlayerA);
        receivingPartner = teamAMap.get(currNet?.teamAPlayerB || '') || null;
      } else if (selectedReceiver === currNet?.teamAPlayerB) {
        receiver = teamAMap.get(currNet?.teamAPlayerB);
        receivingPartner = teamAMap.get(currNet?.teamAPlayerA || '') || null;
      } else {
        return null;
      }
    }

    if (teamBMap.has(selectedReceiver)) {
      if (!currNetNum) return null;
      const currNet = currRoundNets.find((n) => n.num === currNetNum);
      if (selectedReceiver === currNet?.teamBPlayerA) {
        receiver = teamBMap.get(currNet?.teamBPlayerA);
        receivingPartner = teamBMap.get(currNet?.teamBPlayerB || '') || null;
      } else if (selectedReceiver === currNet?.teamBPlayerB) {
        receiver = teamBMap.get(currNet?.teamBPlayerB);
        receivingPartner = teamBMap.get(currNet?.teamBPlayerA || '') || null;
      } else {
        return null;
      }
    }

    return {
      receiver: receiver || null,
      receivingPartner,
    };
  }, [selectedReceiver, teamAPlayers, teamBPlayers]);

  return (
    <div>
      <SelectInput handleSelect={handleNetChange} name="currNetNum" optionList={currRoundNets.map((crn, i) => ({ id: i + 1, value: String(crn.num), text: `Net ${crn.num}` }))} />

      {selectedServer && selectedReceiver ? (
        <div className="server-receiver-with-actions w-full ">
          <div className="top-side w-full flex flex-col md:flex-row justify-between items-center">
            {/* Left side start  */}
            <div className="w-full md:w-2/6">
              <div className="slider">31st Play</div>
              <ServerReceiverDisplay
                selectedServer={selectedServer}
                selectedReceiver={selectedReceiver}
                serverTeam={serverTeam}
                receiverTeam={receiverTeam}
                handleAddServer={handleAddServer}
                handleAddReceiver={handleAddReceiver}
              />
            </div>
            {/* Left side end  */}

            {/* Middle side start  */}
            <div className="w-full md:w-1/6 flex  md:flex-col flex-row gap-y-2 gap-x-2 items-center mt-6 md:mt-2">
              <h2 className="uppercase">Freeze</h2>
              <div className="bg-yellow-logo h-24 w-24 rounded-xl flex items-center justify-center">
                <h2>13</h2>
              </div>
              <div className="bg-white text-black h-24 w-24 rounded-xl flex items-center justify-center">
                <h2>18</h2>
              </div>
              <h2 className="uppercase">Bucks</h2>
            </div>
            {/* Middle side end  */}

            {/* Right side start  */}
            <div className="w-full md:w-2/6 mt-6 flex flex-col gap-y-2">
              <button className="btn-light uppercase">
                Change
                Server/Receiver point 1
              </button>
              <button className="btn-info uppercase">
                +1 POINTS 
                STEVE (#18) DEFENSIVE TOUCH & PUT AWAY. point 1
              </button>
            </div>
            {/* Right side end  */}
          </div>

          <div className="bottom-side border-t border-yellow-logo mt-6 flex flex-col md:flex-row justify-between items-start">
            <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
              <h3 className="uppercase text-center">Serving Team</h3>
              <button className="btn-light uppercase">ACE no-touch</button>
              <button className="btn-light uppercase">Ace no 3rd touch</button>
              <button className="btn-light uppercase">Receiving Hitting Error</button>
              <button className="btn-light uppercase">Defensive Conversion</button>
              <button className="btn-light uppercase">Don't know</button>
            </div>
            <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
              <h3 className="uppercase text-center">Receiving Team</h3>
              <button className="btn-light uppercase">Service Fault</button>
              <button className="btn-info uppercase">1-2-3 put away</button>
              <button className="btn-light uppercase">rally Conversion</button>
              <button className="btn-light uppercase">Don't know</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="select-server-receiver">
          {!currRound || currNetNum === 0 ? (
            <div>{!currRound && <h3 className="uppercase">No round has been selected!</h3>}</div>
          ) : serverPlaceholder || receiverPlaceholder ? (
            <PlayerSelection
              teamAPlayers={teamAPlayers}
              teamBPlayers={teamBPlayers}
              playersOfSelectedNet={playersOfSelectedNet}
              serverPlaceholder={serverPlaceholder}
              receiverPlaceholder={receiverPlaceholder}
              handleServerSelection={handleServerSelection}
              handleReceiverSelection={handleReceiverSelection}
              handleClosePlayers={handleClosePlayers}
            />
          ) : (
            <div className="w-full  flex flex-col justify-center items-center">
              <div className="w-full md:w-3/6">
                <ServerReceiverDisplay
                  selectedServer={selectedServer}
                  selectedReceiver={selectedReceiver}
                  serverTeam={serverTeam}
                  receiverTeam={receiverTeam}
                  handleAddServer={handleAddServer}
                  handleAddReceiver={handleAddReceiver}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ServerReceiver;
