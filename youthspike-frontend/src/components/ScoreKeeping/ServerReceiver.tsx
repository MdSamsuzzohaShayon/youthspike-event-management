"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import SelectInput from "@/components/elements/SelectInput";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCurrNetNum } from "@/redux/slices/netSlice";
import {
  EActionProcess,
  EMessage,
  EServerReceiverAction,
  ETeam,
  ETieBreaker,
  ETieBreakingStrategy,
  IAccessCode,
  IMatchExpRel,
  INetPlayers,
  IReceiverTeam,
  IServerReceiverOnNetMixed,
  IServerTeam,
  IUser,
} from "@/types";
import organizeFetchedData from "@/utils/match/organizeFetchedData";
import ServerReceiverDisplay from "./ServerReceiverDisplay";
import PlayerSelection from "./PlayerSelection";
import ActionHandler from "./ActionHandler";
import EmitEvents from "@/utils/socket/EmitEvents";
import { useSocket } from "@/lib/SocketProvider";
import useNetMaps from "@/hooks/score-keeping/useNetMaps";
import usePlayerMaps from "@/hooks/score-keeping/usePlayerMaps";
import useMakeTeam from "@/hooks/score-keeping/useMakeTeam";
import useInitialSelection from "@/hooks/score-keeping/useInitialSelection";
import useServerReceiverSocket from "@/hooks/score-keeping/useServerReceiverSocket";
import ScoreBoard from "./ScoreBoard";
import { setCurrentServerReceiver } from "@/redux/slices/serverReceiverOnNetSlice";
import ServerReceiverPlayInput from "./ServerReceiverPlayInput";
import { setMessage } from "@/redux/slices/elementSlice";
import LocalStorageService from "@/utils/LocalStorageService";
import RoundInputBox from "../elements/RoundInputBox";
import ChangePlayDialog from "../elements/Dialog/ChangePlayDialog";

/* ───────────────────────────────────────────── */
interface IServerReceiverProps {
  matchId: string;
  matchData: IMatchExpRel;
  accessCode: IAccessCode | null;
  token: string | null;
  userInfo: IUser | null;
}

export default function ServerReceiver({
  matchId,
  matchData,
  accessCode,
  token,
  userInfo,
}: IServerReceiverProps) {
  const dispatch = useAppDispatch();
  const socket = useSocket();

  /* Redux slices */
  const { roundList, current: currRound } = useAppSelector((s) => s.rounds);
  const {
    currNetNum,
    currentRoundNets,
    nets: allNets,
  } = useAppSelector((s) => s.nets);
  const {
    serverReceiversOnNet,
    currentServerReceiver: currServerReceiver,
    serverReceiverPlays,
  } = useAppSelector((s) => s.serverReceiverOnNets);
  const { teamAPlayers, teamBPlayers } = useAppSelector((s) => s.players);
  const { match: currMatch, myTeamE } = useAppSelector((s) => s.matches);
  const currRoom = useAppSelector((s) => s.rooms?.current);
  const { teamA, teamB } = useAppSelector((s) => s.teams);

  /* UI state */
  const [actionPreview, setActionPreview] = useState<boolean>(false);
  const [serverPlaceholder, setServerPlaceholder] = useState<boolean>(false);
  const [receiverPlaceholder, setReceiverPlaceholder] =
    useState<boolean>(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(null);
  const [toBeSelectedPlay, setToBeSelectedPlay] = useState<number | null>(null); // Selected playId before confirmation
  const [awardTo, setAwardTo] = useState<ETeam | null>(null);

  const confirmBoxEl = useRef<HTMLDialogElement | null>(null);
  const changePlayEl = useRef<HTMLDialogElement | null>(null);
  const revertPlayEl = useRef<HTMLDialogElement | null>(null);

  /* Derived maps / helpers */
  const netByNum = useNetMaps(currentRoundNets);
  const { teamAById, teamBById } = usePlayerMaps(teamAPlayers, teamBPlayers);
  const makeTeam = useMakeTeam(netByNum, teamAById, teamBById);

  const serverReceiverByNetId = useMemo(
    () =>
      new Map<string, IServerReceiverOnNetMixed>(
        (serverReceiversOnNet ?? []).map((sr) => [
          typeof sr.net === "string" ? sr.net : sr.net?._id,
          sr,
        ])
      ),
    [serverReceiversOnNet]
  );

  const finalRoundIncomplete: boolean = useMemo(() => {
    if (currRound?.num === roundList.length && currentRoundNets.length > 0) {
      // Check 2 FINAL_ROUND_NET_LOCKED
      const lockedNets = currentRoundNets.filter(
        (n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED
      );
      return lockedNets.length < 2;
      // Nets are banned in the final rtound
    }
    return false;
  }, [currRound, roundList, currentRoundNets]);

  /* Populate initial selection once data is there */
  useInitialSelection(
    currNetNum,
    netByNum,
    serverReceiverByNetId,
    setSelectedServer,
    setSelectedReceiver,
    setActionPreview
  );

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
    serverReceiverPlays,
    setActionPreview,
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

  const serverTeam = useMemo(
    () => makeTeam(selectedServer, currNetNum, true) as IServerTeam | null,
    [selectedServer, currNetNum, makeTeam]
  );
  const receiverTeam = useMemo(
    () => makeTeam(selectedReceiver, currNetNum, false) as IReceiverTeam | null,
    [selectedReceiver, currNetNum, makeTeam]
  );

  /* ───── Handlers ───── */
  const handleNetChange = (e: React.SyntheticEvent) => {
    const netNum = Number((e.target as HTMLSelectElement).value);
    dispatch(setCurrNetNum(netNum));

    const net = netByNum.get(netNum);

    LocalStorageService.setMatch(currMatch._id, currRound?._id || "", net?._id);

    const newServerReceiver = serverReceiversOnNet.find(
      (sr) => sr.net === net?._id
    );
    if (newServerReceiver) {
      if (!newServerReceiver.server) {
        setSelectedServer(null);
      } else {
        setSelectedServer(newServerReceiver.server as string);
      }
      if (!newServerReceiver.receiver) {
        setSelectedReceiver(null);
      } else {
        setSelectedReceiver(newServerReceiver.receiver as string);
      }
    } else {
      setActionPreview(false);
    }
    dispatch(setCurrentServerReceiver(newServerReceiver || null));
  };

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
      accessCode: token || accessCode?.code || null,
    });
  }, [
    socket,
    dispatch,
    currRoom,
    currRound,
    currMatch,
    currentRoundNets,
    currNetNum,
    selectedServer,
    selectedReceiver,
    accessCode,
  ]);

  const openResetConfirm = () => {
    confirmBoxEl.current?.showModal();
  };
  const closeResetConfirm = () => {
    confirmBoxEl.current?.close();
  };

  const handleServerSelection = (
    e: React.SyntheticEvent,
    playerId: string | null
  ) => {
    e.preventDefault();
    setSelectedServer(playerId || null);
    setServerPlaceholder(false);
  };
  const handleReceiverSelection = (
    e: React.SyntheticEvent,
    playerId: string | null
  ) => {
    e.preventDefault();
    setSelectedReceiver(playerId || null);
    setReceiverPlaceholder(false);
  };

  const handlePlayChange = () => {
    // select net
    const net = netByNum.get(currNetNum);
    // Select a play and
    // toBeSelectedPlay
    const emit = new EmitEvents(socket, dispatch);
    emit.revertPlay({
      match: currMatch._id,
      net: net?._id || null,
      room: currRoom?._id || null,
      accessCode: accessCode?.code.toString() || null,
      play: toBeSelectedPlay,
    });
    changePlayEl.current?.close();
  };

  const handleConfirmReset = useCallback(() => {
    const emit = new EmitEvents(socket, dispatch);
    const net = netByNum.get(currNetNum);
    emit.resetScores({
      match: currMatch._id,
      net: net?._id || null,
      room: currRoom?._id || null,
      accessCode: accessCode?.code.toString() || token || null,
    });

    closeResetConfirm();
  }, [socket, dispatch, currRoom, currMatch, currNetNum, accessCode]);

  const handleUpdateScore = useCallback(() => {
    const net = netByNum.get(currNetNum);
    if (!socket || !currMatch._id || !net?._id || !currRoom?._id) {
      dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Match, net, receiver, or room does not exist!",
        })
      );
      return;
    }

    if (!accessCode?.code) {
      dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "You do not have permission to do this operation!",
        })
      );
      return;
    }
    const actionData = {
      match: currMatch._id,
      net: net?._id,
      room: currRoom?._id,
      accessCode: accessCode.code,
    };
    const emit = new EmitEvents(socket, dispatch);
    emit.updateCachePoints(actionData);
    dispatch(
      setMessage({
        type: EMessage.SUCCESS,
        message: "You have updated the score successfully!",
      })
    );
  }, [socket, currMatch, selectedReceiver, currNetNum, currRoom, accessCode]);

  const handleRevertPlay = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const highestPlay = currPlays.reduce(
      (max, current) => (current.play > max.play ? current : max),
      currPlays[0]
    );
    const lastPlay: number = highestPlay.play;
    const emit = new EmitEvents(socket, dispatch);
    emit.revertPlay({
      match: currMatch._id,
      net: netByNum.get(currNetNum)?._id || null,
      room: currRoom?._id || null,
      accessCode: token || accessCode?.code || null,
      play: lastPlay,
    });
    revertPlayEl.current?.close();
  };

  const serverTeamE: ETeam | null = useMemo(() => {
    if (!selectedServer) return null;
    const teamAPlayerIds = new Set(teamAPlayers.map((p) => p._id));
    const teamBPlayerIds = new Set(teamBPlayers.map((p) => p._id));
    if (teamAPlayerIds.has(selectedServer)) {
      return ETeam.teamA;
    } else if (teamBPlayerIds.has(selectedServer)) {
      return ETeam.teamB;
    }
    return null;
  }, [teamAPlayers, teamBPlayers, selectedServer, selectedReceiver]);

  const currNet = useMemo(() => {
    const net = netByNum.get(currNetNum);
    return net;
  }, [netByNum, currNetNum]);

  const currPlays = useMemo(() => {
    const selectedPlays = serverReceiverPlays.filter(
      (sr) => sr.net === currNet?._id
    );
    return selectedPlays;
  }, [serverReceiverPlays, currNet]);

  const lastPlay = useMemo(() => {
    return currPlays.reduce(
      (max, current) => (current.play > max.play ? current : max),
      currPlays[0]
    );
  }, [currPlays]);

  /* ───── Hydrate redux ONCE ───── */
  React.useEffect(() => {
    organizeFetchedData({ matchData, token, userInfo, matchId, dispatch });
  }, []); // ← run exactly once

  /* ───── UI ───── */

  if (
    currRound?.teamAProcess !== EActionProcess.LINEUP ||
    currRound?.teamBProcess !== EActionProcess.LINEUP
  ) {
    return (
      <div className="w-full">
        <RoundInputBox
          allNets={allNets}
          currMatch={currMatch}
          currRound={currRound}
          dispatch={dispatch}
          myTeamE={myTeamE}
          roundList={roundList}
        />
        <div className="w-full flex justify-center mt-10">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md max-w-xl w-full text-center">
            <h2 className="text-lg font-semibold mb-2">Lineup Incomplete</h2>
            <p>
              Both teams must complete their player lineup before selecting a
              server or receiver.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (
    finalRoundIncomplete &&
    currMatch.tieBreaking !== ETieBreakingStrategy.OVERTIME_ROUND
  ) {
    return (
      <div className="w-full">
        <RoundInputBox
          allNets={allNets}
          currMatch={currMatch}
          currRound={currRound}
          dispatch={dispatch}
          myTeamE={myTeamE}
          roundList={roundList}
        />
        <div className="w-full flex justify-center mt-10">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md max-w-xl w-full text-center">
            <h2 className="text-lg font-semibold mb-2">
              Final Round Nets Not Banned Yet
            </h2>
            <p>
              Please ban the nets for the final round before proceeding with
              server/receiver selection.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ServerReceiver">
      <RoundInputBox
        allNets={allNets}
        currMatch={currMatch}
        currRound={currRound}
        dispatch={dispatch}
        myTeamE={myTeamE}
        roundList={roundList}
      />
      <div className="input-wrapper relative">
        <SelectInput
          handleSelect={handleNetChange}
          name="currNetNum"
          label="Current Net"
          optionList={currentRoundNets.map((n) => ({
            id: n.num,
            value: String(n.num),
            text: `Net ${n.num}`,
          }))}
          value={currNetNum || ""}
        />
      </div>

      {actionPreview ? (
        <div className="server-receiver-with-actions w-full ">
          <div className="top-side w-full flex flex-col md:flex-row justify-between items-center">
            {/* Left side start  */}
            <div className={`w-full w-3/6`}>
              <ServerReceiverDisplay
                serverTeam={serverTeam}
                receiverTeam={receiverTeam}
                currServerReceiver={currServerReceiver}
              />
            </div>
            {/* Left side end  */}

            {/* Right side start  */}
            <div className="3/6 hidden md:flex justify-center items-center flex-col">
              <div className="w-5/6">
                <ScoreBoard
                  currServerReceiver={currServerReceiver}
                  handleOpenPlays={(e) => {
                    changePlayEl?.current?.showModal();
                  }}
                  teamA={teamA || null}
                  teamB={teamB || null}
                  awardTo={awardTo}
                  setAwardTo={setAwardTo}
                  currPlays={currPlays}
                  revertPlayEl={revertPlayEl}
                  key="sb-1"
                />
              </div>
            </div>
            {/* Right side end  */}
          </div>

          {/* Handle action for each button pressed  */}
          <div className="scrollable-action-handler w-full relative">
            <div className="w-full sticky top-0 md:hidden bg-black py-2">
              <ScoreBoard
                currServerReceiver={currServerReceiver}
                handleOpenPlays={(e) => {
                  changePlayEl?.current?.showModal();
                }}
                teamA={teamA || null}
                teamB={teamB || null}
                awardTo={awardTo}
                setAwardTo={setAwardTo}
                currPlays={currPlays}
                revertPlayEl={revertPlayEl}
                key="sb-2"
              />
            </div>
            <ActionHandler
              teamA={teamA || null}
              teamB={teamB || null}
              serverTeamE={serverTeamE}
              awardTo={awardTo}
              dispatch={dispatch}
              socket={socket}
              match={matchId}
              net={currNet?._id || null}
              receiver={selectedReceiver}
              room={currRoom?._id || null}
              setAwardTo={setAwardTo}
            />
          </div>

          {actionPreview && (
            <div className="mt-6 flex justify-center items-center gap-x-2">
              <button
                onClick={() => setActionPreview(false)}
                type="button"
                className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
              >
                Server/Receiver
              </button>
              <button
                onClick={handleUpdateScore}
                type="button"
                className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
              >
                Update score
              </button>
              <button
                onClick={openResetConfirm}
                className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
              >
                Reset
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
              handleServerSelection={handleServerSelection}
              handleReceiverSelection={handleReceiverSelection}
              handleClosePlayers={() => {
                setServerPlaceholder(false);
                setReceiverPlaceholder(false);
              }}
            />
          ) : (
            <div className="w-full flex flex-col items-center">
              <div className="w-full md:w-3/6">
                <ServerReceiverDisplay
                  serverTeam={serverTeam}
                  receiverTeam={receiverTeam}
                  handleAddServer={() => setServerPlaceholder(true)}
                  handleAddReceiver={() => setReceiverPlaceholder(true)}
                  currServerReceiver={currServerReceiver}
                />

                {selectedServer && selectedReceiver && (
                  <div className="my-6 flex gap-x-2 justify-center">
                    {!currServerReceiver ? (
                      <button
                        onClick={handleSetPlayers}
                        className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
                      >
                        Confirm Order
                      </button>
                    ) : (
                      <button
                        onClick={openResetConfirm}
                        className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
                      >
                        Reset
                      </button>
                    )}

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

      <ChangePlayDialog
        changePlayEl={changePlayEl}
        currPlays={currPlays}
        handlePlayChange={handlePlayChange}
        setToBeSelectedPlay={setToBeSelectedPlay}
        toBeSelectedPlay={toBeSelectedPlay}
        teamAById={teamBById}
        teamBById={teamBById}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamAPlayers}
      />

      <dialog ref={confirmBoxEl} className="modal-dialog">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-yellow-400">
            Reset Scorekeeper Setting
          </h2>
          <p className="text-sm text-gray-300">
            ⚠️ Warning: This will reset everything including player statistics,
            team scores, and selected server player. Are you sure you want to
            proceed?
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              className="bg-yellow-logo hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium transition duration-200"
              onClick={handleConfirmReset}
            >
              Confirm
            </button>
            <button
              className="bg-transparent border border-yellow-logo text-yellow-400 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-md transition duration-200"
              onClick={closeResetConfirm}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>

      {/* handleRevertPlay */}
      <dialog ref={revertPlayEl} className="modal-dialog">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-yellow-400">
            Revert to previous play
          </h2>

          {lastPlay && (
            <div className="flex-1 overflow-y-auto pr-1">
              <ul className="space-y-2">
                <ServerReceiverPlayInput
                  sr={lastPlay}
                  teamAById={teamAById}
                  teamBById={teamBById}
                  key={`last-play-${lastPlay.play}`}
                  teamAPlayers={teamAPlayers}
                  teamBPlayers={teamBPlayers}
                />
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-300">
            ⚠️ Warning: This will revert the previous play (one single play
            back). From that play you can continue the game. But this record
            will be deleted.
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              className="bg-yellow-logo hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium transition duration-200"
              onClick={handleRevertPlay}
            >
              Confirm
            </button>
            <button
              className="bg-transparent border border-yellow-logo text-yellow-400 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-md transition duration-200"
              onClick={(e) => {
                revertPlayEl.current?.close();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
