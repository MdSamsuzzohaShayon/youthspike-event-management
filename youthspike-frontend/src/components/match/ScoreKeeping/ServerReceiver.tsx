'use client';

import React, { useCallback, useMemo, useState } from 'react';
import SelectInput from '@/components/elements/SelectInput';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCurrNetNum } from '@/redux/slices/netSlice';
import { IMatchExpRel, INetPlayers, IReceiverTeam, IServerTeam, IUser } from '@/types';
import organizeFetchedData from '@/utils/match/organizeFetchedData';
import ServerReceiverDisplay from './ServerReceiverDisplay';
import PlayerSelection from './PlayerSelection';
import ActionHandler from './ActionHandler';
import EmitEvents from '@/utils/socket/EmitEvents';
import { useSocket } from '@/lib/SocketProvider';
import useNetMaps from '@/hooks/score-keeping/useNetMaps';
import usePlayerMaps from '@/hooks/score-keeping/usePlayerMaps';
import useMakeTeam from '@/hooks/score-keeping/useMakeTeam';
import useInitialSelection from '@/hooks/score-keeping/useInitialSelection';
import useServerReceiverSocket from '@/hooks/score-keeping/useServerReceiverSocket';

/* ───────────────────────────────────────────── */

interface Props {
  matchId: string;
  matchData: IMatchExpRel;
  token: string | null;
  userInfo: IUser | null;
}

export default function ServerReceiver({ matchId, matchData, token, userInfo }: Props) {
  const dispatch = useAppDispatch();
  const socket = useSocket();

  /* Redux slices */
  const { roundList, current: currRound } = useAppSelector((s) => s.rounds);
  const { currNetNum, currentRoundNets, serverReceiversOnNet, currentServerReceiver: currServerReceiver } = useAppSelector((s) => s.nets);
  const { teamAPlayers, teamBPlayers } = useAppSelector((s) => s.players);
  const currMatch = useAppSelector((s) => s.matches.match);
  const currRoom = useAppSelector((s) => s.rooms.current);
  const { teamA, teamB } = useAppSelector((s) => s.teams);

  /* UI state */
  const [actionPreview, setActionPreview] = useState(false);
  const [serverPlaceholder, setServerPlaceholder] = useState(false);
  const [receiverPlaceholder, setReceiverPlaceholder] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);

  /* Derived maps / helpers */
  const netByNum = useNetMaps(currentRoundNets);
  const { teamAById, teamBById } = usePlayerMaps(teamAPlayers, teamBPlayers);
  const makeTeam = useMakeTeam(netByNum, teamAById, teamBById);

  const serverReceiverByNetId = useMemo(() => new Map(serverReceiversOnNet?.map((sr) => [sr.net, sr]) ?? []), [serverReceiversOnNet]);

  /* Populate initial selection once data is there */
  useInitialSelection(currNetNum, netByNum, serverReceiverByNetId, setSelectedServer, setSelectedReceiver);

  /* Socket listeners / room join */
  useServerReceiverSocket({
    socket,
    dispatch,
    roundList,
    teamA,
    teamB,
    currRound,
    matchId,
    serverReceiversOnNet,
  });

  /* ───── Derived memo ───── */
  const playersOfSelectedNet: INetPlayers | null = useMemo(() => {
    if (!currNetNum) return null;
    const net = netByNum.get(currNetNum);
    if (!net) return null;
    return {
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA ?? null,
      teamAPlayerB: net.teamAPlayerB ?? null,
      teamBPlayerA: net.teamBPlayerA ?? null,
      teamBPlayerB: net.teamBPlayerB ?? null,
    };
  }, [currNetNum, netByNum]);

  const serverTeam = useMemo(() => makeTeam(selectedServer, currNetNum, true) as IServerTeam | null, [selectedServer, currNetNum, makeTeam]);

  const receiverTeam = useMemo(() => makeTeam(selectedReceiver, currNetNum, false) as IReceiverTeam | null, [selectedReceiver, currNetNum, makeTeam]);

  const net = netByNum.get(currNetNum);

  /* ───── Handlers ───── */
  const handleNetChange = useCallback((e: React.SyntheticEvent) => dispatch(setCurrNetNum(Number((e.target as HTMLSelectElement).value))), [dispatch]);

  const handleSetPlayers = useCallback(() => {
    new EmitEvents(socket, dispatch).setServerReceiver({
      dispatch,
      currRoom,
      currRound,
      currMatch,
      currRoundNets: currentRoundNets,
      currNetNum,
      server: selectedServer,
      receiver: selectedReceiver,
      userInfo,
    });
  }, [socket, dispatch, currRoom, currRound, currMatch, currentRoundNets, currNetNum, selectedServer, selectedReceiver, userInfo]);

  /* ───── Hydrate redux ONCE ───── */
  React.useEffect(() => {
    organizeFetchedData({ matchData, token, userInfo, matchId, dispatch });
  }, []); // ← run exactly once

  /* ───── UI ───── */
  return (
    <div>
      <SelectInput
        handleSelect={handleNetChange}
        name="currNetNum"
        label="Current Net"
        optionList={currentRoundNets.map((n) => ({
          id: n.num,
          value: String(n.num),
          text: `Net ${n.num}`,
        }))}
        value={currNetNum || ''}
      />

      {actionPreview ? (
        <div className="server-receiver-with-actions w-full ">
          <div className="top-side w-full flex flex-col md:flex-row justify-between items-center">
            {/* Left side start  */}
            <div className="w-full md:w-2/6">
              <div className="slider">31st Play</div>
              <ServerReceiverDisplay selectedServer={selectedServer} selectedReceiver={selectedReceiver} serverTeam={serverTeam} receiverTeam={receiverTeam} />
            </div>
            {/* Left side end  */}

            {/* Middle side start  */}
            <div className="w-full md:w-1/6 flex  md:flex-col flex-row gap-y-2 gap-x-2 items-center mt-6 md:mt-2">
              <h2 className="uppercase">Freeze</h2>
              <div className="bg-yellow-logo h-24 w-24 rounded-xl flex items-center justify-center">
                <h2 className="text-black">{currServerReceiver?.teamAScore || 0}</h2>
              </div>
              <div className="bg-white text-black h-24 w-24 rounded-xl flex items-center justify-center">
                <h2>{currServerReceiver?.teamBScore || 0}</h2>
              </div>
              <h2 className="uppercase">Bucks</h2>
            </div>
            {/* Middle side end  */}

            {/* Right side start  */}
            <div className="w-full md:w-2/6 mt-6 flex flex-col gap-y-2">
              <button className="btn-light uppercase">Change Server/Receiver point 1</button>
              <button className="btn-info uppercase">+1 POINTS STEVE (#18) DEFENSIVE TOUCH & PUT AWAY. point 1</button>
            </div>
            {/* Right side end  */}
          </div>

          {/* Handle action for each button pressed  */}
          <ActionHandler
            dispatch={dispatch}
            server={selectedServer}
            receiver={selectedReceiver}
            socket={socket}
            currNet={netByNum.get(currNetNum)?._id ?? null}
            matchId={matchId}
            room={currRoom?._id || ''}
          />

          {actionPreview && (
            <div className="text-center my-6">
              <button
                onClick={() => setActionPreview(false)}
                type="button"
                className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
              >
                Server/Receiver
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="select-server-receiver">
          {!currRound || !currNetNum ? (
            <h3 className="uppercase">No round has been selected!</h3>
          ) : serverPlaceholder || receiverPlaceholder ? (
            <PlayerSelection
              teamAPlayers={teamAPlayers}
              teamBPlayers={teamBPlayers}
              teamA={teamA}
              teamB={teamB}
              selectedServer={selectedServer}
              selectedReceiver={selectedReceiver}
              playersOfSelectedNet={playersOfSelectedNet}
              serverPlaceholder={serverPlaceholder}
              receiverPlaceholder={receiverPlaceholder}
              handleServerSelection={(e, id) => {
                setSelectedServer(id ?? null);
                setServerPlaceholder(false);
              }}
              handleReceiverSelection={(e, id) => {
                setSelectedReceiver(id ?? null);
                setReceiverPlaceholder(false);
              }}
              handleClosePlayers={() => {
                setSelectedServer(null);
                setSelectedReceiver(null);
                setServerPlaceholder(false);
                setReceiverPlaceholder(false);
              }}
            />
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="w-full md:w-3/6">
                <ServerReceiverDisplay
                  selectedServer={selectedServer}
                  selectedReceiver={selectedReceiver}
                  serverTeam={serverTeam}
                  receiverTeam={receiverTeam}
                  handleAddServer={() => setServerPlaceholder(true)}
                  handleAddReceiver={() => setReceiverPlaceholder(true)}
                />

                {selectedServer && selectedReceiver && (
                  <div className="my-6 flex gap-x-2 justify-center">
                    <button onClick={handleSetPlayers} className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition">
                      Set Players
                    </button>
                    {currServerReceiver && (
                      <button
                        onClick={() => setActionPreview(true)}
                        className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
                      >
                        Action Preview
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
