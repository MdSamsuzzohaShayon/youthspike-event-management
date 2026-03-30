"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  EActionProcess,
  EMessage,
  ESRRole,
  ETeam,
  ETieBreaker,
  ETieBreakingStrategy,
  IAccessCode,
  IMatchExpRel,
  INetPlayers,
  IPlayer,
  IServerReceiverOnNetMixed,
  IUser,
  UserRole,
} from "@/types";
import organizeFetchedData from "@/utils/match/organizeFetchedData";
import ServerReceiverDisplay from "./ServerReceiverDisplay";
import PlayerSelection from "./PlayerSelection";
import ActionHandler from "./ActionHandler";
import EmitEvents from "@/utils/socket/EmitEvents";
import { useSocket } from "@/lib/SocketProvider";
import useNetMaps from "@/hooks/score-keeping/useNetMaps";
import useInitialSelection from "@/hooks/score-keeping/useInitialSelection";
import useServerReceiverSocket from "@/hooks/score-keeping/useServerReceiverSocket";
import ScoreBoard from "./ScoreBoard";
import { setMessage } from "@/redux/slices/elementSlice";
import LocalStorageService from "@/utils/LocalStorageService";
import RoundInputBox from "../elements/RoundInputBox";
import ChangePlayDialog from "../elements/Dialog/ChangePlayDialog";
import ResetPlayDialog from "../elements/Dialog/ResetPlayDialog";
import RevertPreviousDialog from "../elements/Dialog/RevertPreviousDialog";
import NetInputItem from "./NetInputItem";
import { shallowEqual } from "react-redux";
import { setCurrentServerReceiver } from "@/redux/slices/serverReceiverOnNetSlice";
import { toOrdinal } from "@/utils/helper";
import Link from "next/link";
import ServerReceiverDialog from "../elements/Dialog/ServerReceiverDialog";

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
  const {
    roundList,
    currRound,
    currNetNum,
    currRoundNets,
    allNets,
    serverReceiversOnNet,
    currServerReceiver,
    serverReceiverPlays,
    teamAPlayers,
    teamBPlayers,
    currMatch,
    myTeamE,
    matchScore,
    currRoom,
    teamA,
    teamB,
  } = useAppSelector(
    (state) => ({
      roundList: state.rounds.roundList,
      currRound: state.rounds.current,

      currNetNum: state.nets.currNetNum,
      currRoundNets: state.nets.currentRoundNets,
      allNets: state.nets.nets,

      serverReceiversOnNet: state.serverReceiverOnNets.serverReceiversOnNet,
      currServerReceiver: state.serverReceiverOnNets.currentServerReceiver,
      serverReceiverPlays: state.serverReceiverOnNets.serverReceiverPlays,

      teamAPlayers: state.players.teamAPlayers,
      teamBPlayers: state.players.teamBPlayers,

      currMatch: state.matches.match,
      myTeamE: state.matches.myTeamE,
      matchScore: state.matches.matchScore,

      currRoom: state.rooms?.current,

      teamA: state.teams.teamA,
      teamB: state.teams.teamB,
    }),
    shallowEqual
  );

  /* UI state */
  const [actionPreview, setActionPreview] = useState<boolean>(false);
  const [serverPlaceholder, setServerPlaceholder] = useState<boolean>(false);
  const [receiverPlaceholder, setReceiverPlaceholder] =
    useState<boolean>(false);
  const [toBeSelectedPlay, setToBeSelectedPlay] = useState<number | null>(null); // Selected playId before confirmation
  const [awardTo, setAwardTo] = useState<ETeam | null>(null);

  const confirmBoxEl = useRef<HTMLDialogElement | null>(null);
  const changePlayEl = useRef<HTMLDialogElement | null>(null);
  const srChangerEl = useRef<HTMLDialogElement | null>(null);
  const revertPlayEl = useRef<HTMLDialogElement | null>(null);
  const stickyScoreBoardRef = useRef<HTMLDivElement | null>(null);

  /* Derived maps / helpers */
  const netByNum = useNetMaps(currRoundNets);

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

  const eventId = useMemo(()=>{
    return matchData?.event?._id || currMatch?.event
  }, [matchData, currMatch]);

  const finalRoundIncomplete: boolean = useMemo(() => {
    if (currRound?.num === roundList.length && currRoundNets.length > 0) {
      // Check 2 FINAL_ROUND_NET_LOCKED
      const lockedNets = currRoundNets.filter(
        (n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED
      );
      return lockedNets.length < 2;
      // Nets are banned in the final rtound
    }
    return false;
  }, [currRound, roundList, currRoundNets]);

  /* Populate initial selection once data is there */
  useInitialSelection(
    currNetNum,
    netByNum,
    serverReceiverByNetId,
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
    currNetNum,
    netByNum,
    serverReceiversOnNet,
    serverReceiverPlays,
    currServerReceiver,
    setActionPreview,
    currRoundNets,
    allNets,
    currMatch,
  });

  /* ───── Derived memo ───── */

  const selectedNet = useMemo(() => {
    const net = netByNum.get(currNetNum);
    if (!net) return null;
    return net;
  }, [netByNum, currNetNum]);

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
  }, [selectedNet]);

  const isFinalRound = useMemo(() => {
    return currRound?.num === roundList.length;
  }, [currRound]);

  /* ───── Handlers ───── */
  const handleNetChange = (e: React.SyntheticEvent, netNum: number) => {
    e.preventDefault();

    const net = netByNum.get(netNum);

    LocalStorageService.setMatch(currMatch._id, currRound?._id || "", net?._id);

    window.location.reload();
  };

  const handleSetPlayers = useCallback(() => {
    new EmitEvents(socket, dispatch).setServerReceiver({
      dispatch,
      currRoom,
      currRound,
      currMatch,
      currRoundNets,
      currNetNum,
      accessCode: token || accessCode?.code || null,
      currServerReceiver,
    });
  }, [
    socket,
    dispatch,
    currRoom,
    currRound,
    currMatch,
    currRoundNets,
    currNetNum,
    accessCode,
    currServerReceiver,
  ]);

  const openResetConfirm = () => {
    setActionPreview(false);
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
    let servingPartner = null;
    if (currNet?.teamAPlayerA === playerId) {
      servingPartner = currNet?.teamAPlayerB || null;
    } else if (currNet?.teamAPlayerB === playerId) {
      servingPartner = currNet?.teamAPlayerA || null;
    } else if (currNet?.teamBPlayerA === playerId) {
      servingPartner = currNet?.teamBPlayerB || null;
    } else if (currNet?.teamBPlayerB === playerId) {
      servingPartner = currNet?.teamBPlayerA || null;
    }

    if (playerId && currServerReceiver)
      dispatch(
        setCurrentServerReceiver({
          ...currServerReceiver,
          server: playerId,
          servingPartner,
        })
      );
    setServerPlaceholder(false);
  };
  const handleReceiverSelection = (
    e: React.SyntheticEvent,
    playerId: string | null
  ) => {
    e.preventDefault();
    let receivingPartner = null;
    if (currNet?.teamAPlayerA === playerId) {
      receivingPartner = currNet?.teamAPlayerB || null;
    } else if (currNet?.teamAPlayerB === playerId) {
      receivingPartner = currNet?.teamAPlayerA || null;
    } else if (currNet?.teamBPlayerA === playerId) {
      receivingPartner = currNet?.teamBPlayerB || null;
    } else if (currNet?.teamBPlayerB === playerId) {
      receivingPartner = currNet?.teamBPlayerA || null;
    }
    if (playerId && currServerReceiver)
      dispatch(
        setCurrentServerReceiver({
          ...currServerReceiver,
          receiver: playerId,
          receivingPartner,
        })
      );
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
      event: eventId,
      accessCode: token || accessCode?.code.toString() || null,
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
      event: eventId,
      accessCode: accessCode?.code.toString() || token || null,
    });

    closeResetConfirm();
  }, [socket, dispatch, currRoom, currMatch, currNetNum, accessCode]);

  const handleUpdateScore = useCallback(() => {
    const net = netByNum.get(currNetNum);
    if (!socket || !currMatch._id || !net?._id || !currRoom?._id) {
      // dispatch(
      //   setMessage({
      //     type: EMessage.ERROR,
      //     message: "Match, net, receiver, or room does not exist!",
      //   })
      // );
      console.error("Match, net, receiver, or room does not exist!");

      return;
    }

    if (!serverReceiverPlays || serverReceiverPlays.length === 0) {
      console.error(
        "This is the first play, you do not need to update anything here"
      );
      return;
    }

    if (!token && !accessCode?.code) {
      dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "You do not have permission to do this operation!",
        })
      );
      return;
    }
    const actionData = {
      dispatch,
      match: currMatch._id,
      net: net?._id,
      room: currRoom?._id,
      event: eventId,
      accessCode: token || (accessCode && accessCode.code) || null,
      currRoundNets,
      roundList,
      currRound,
    };
    const emit = new EmitEvents(socket, dispatch);
    emit.updateCachePoints(actionData);
    dispatch(
      setMessage({
        type: EMessage.SUCCESS,
        message: "You have updated the score successfully!",
      })
    );
  }, [
    socket,
    currMatch,
    serverReceiverPlays,
    currNetNum,
    currRoom,
    token,
    accessCode,
  ]);

  const serverTeamE: ETeam | null = useMemo(() => {
    if (!currServerReceiver) return null;
    const teamAPlayerIds = new Set(teamAPlayers.map((p) => p._id));
    const teamBPlayerIds = new Set(teamBPlayers.map((p) => p._id));
    if (teamAPlayerIds.has(String(currServerReceiver.server))) {
      return ETeam.teamA;
    } else if (teamBPlayerIds.has(String(currServerReceiver.server))) {
      return ETeam.teamB;
    }
    return null;
  }, [teamAPlayers, teamBPlayers, currServerReceiver]);

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

  const playerMap = useMemo(() => {
    const map = new Map<string, IPlayer>();

    for (const player of teamAPlayers) {
      map.set(player._id, player);
    }

    for (const player of teamBPlayers) {
      map.set(player._id, player);
    }

    return map;
  }, [teamAPlayers, teamBPlayers]);

  /* ───── Hydrate redux ONCE ───── */

  useEffect(() => {
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

  if (
    !currMatch.completed &&
    isFinalRound &&
    currRound?.completed &&
    currMatch.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND &&
    matchScore.teamAMScore === matchScore.teamBMScore
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
            <h2 className="text-lg font-semibold mb-2">Match Tied</h2>
            <p>
              Score of both teams are same, the match is tied! Either you play
              overtime round or you finish the match!
            </p>
            {token &&
              (userInfo?.role === UserRole.admin ||
                userInfo?.role === UserRole.captain ||
                userInfo?.role === UserRole.co_captain ||
                userInfo?.role === UserRole.director) && (
                <div>
                  <Link
                    href={`/matches/${matchData._id}`}
                    className="inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition"
                  >
                    ← Go back to captain
                  </Link>
                </div>
              )}
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
      {/* // In your ServerReceiver component, update the net input section: */}
      {/* Mobile-optimized net input section */}
      <div className="input-wrapper relative">
        {teamA && teamB && (
          <div className="space-y-2">
            {/* Mobile horizontal scrollable nets */}
            <div className="net-items overflow-x-auto pb-2 -mx-4 px-4">
              <div className="flex gap-2 min-w-max">
                {currRoundNets.map((n) => (
                  <div key={n._id} className="w-40 md:w-4/12 flex-shrink-0">
                    {/* Fixed width for consistent sizing */}
                    <NetInputItem
                      onNetChange={handleNetChange}
                      net={n}
                      playerMap={playerMap}
                      teamA={teamA}
                      teamB={teamB}
                      isCurrentNet={n.num === currNetNum}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {actionPreview ? (
        <div className="server-receiver-with-actions w-full ">
          <div className="top-side w-full flex flex-col md:flex-row justify-between items-center">
            {/* Left side start  */}
            <div className={`w-full w-3/6`}>
              <ServerReceiverDisplay
                teamA={teamA || null}
                teamB={teamB || null}
                playerMap={playerMap}
                currServerReceiver={currServerReceiver}
                matchId={currMatch._id}
              />
            </div>
            {/* Left side end  */}

            {/* Right side start  */}
            <div className="3/6 hidden md:flex justify-center items-center flex-col">
              {currServerReceiver?.net === selectedNet?._id && (
                <div className="w-5/6">
                  <ScoreBoard
                    currServerReceiver={currServerReceiver}
                    handleOpenPlays={(_e) => {
                      changePlayEl?.current?.showModal();
                    }}
                    teamA={teamA || null}
                    teamB={teamB || null}
                    awardTo={awardTo}
                    setAwardTo={setAwardTo}
                    currPlays={currPlays}
                    revertPlayEl={revertPlayEl}
                    stickyScoreBoardRef={stickyScoreBoardRef}
                    teamAPlayers={teamAPlayers}
                    teamBPlayers={teamBPlayers}
                    key="sb-1"
                  />
                </div>
              )}
            </div>
            {/* Right side end  */}
          </div>

          {/* Handle action for each button pressed  */}
          <div className="scrollable-action-handler w-full">
            <div className="hidden md:flex w-full items-center justify-center gap-x-2">
              <button
                onClick={(_e) => {
                  changePlayEl?.current?.showModal();
                }}
                className="btn-info"
              >
                {`${toOrdinal(currServerReceiver?.mutate || 1)} play`}
              </button>
              {currPlays.length > 0 && (
                <button
                  className="btn-info"
                  onClick={() => revertPlayEl.current?.showModal()}
                >
                  Revert Play
                </button>
              )}
            </div>
            <div
              ref={stickyScoreBoardRef}
              className="w-full md:hidden bg-black py-2"
            >
              {currServerReceiver?.net === selectedNet?._id && (
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
                  stickyScoreBoardRef={stickyScoreBoardRef}
                  revertPlayEl={revertPlayEl}
                  teamAPlayers={teamAPlayers}
                  teamBPlayers={teamBPlayers}
                  key="sb-2"
                />
              )}
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
              room={currRoom?._id || null}
              setAwardTo={setAwardTo}
              eventId={eventId}
              currServerReceiver={currServerReceiver}
            />
          </div>

          {actionPreview && (
            <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
              <button
                onClick={handleUpdateScore}
                type="button"
                className="btn-info"
              >
                Update score, only at the end of game
              </button>
              <button onClick={openResetConfirm} className="btn-info">
                Reset
              </button>
              <button
                onClick={() => {
                  srChangerEl.current?.showModal();
                }}
                className="btn-info"
              >
                Change Server/Receiver
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
              currServerReceiver={currServerReceiver}
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
                  handleAddServer={() => setServerPlaceholder(true)}
                  handleAddReceiver={() => setReceiverPlaceholder(true)}
                  playerMap={playerMap}
                  teamA={teamA || null}
                  teamB={teamB || null}
                  currServerReceiver={currServerReceiver}
                  matchId={currMatch._id}
                />

                {currPlays.length === 0 &&
                  currServerReceiver?.server &&
                  currServerReceiver.receiver && (
                    <div className="my-6 flex gap-x-2 justify-center">
                      <button
                        onClick={handleSetPlayers}
                        className="inline-block text-sm btn-info"
                      >
                        Confirm Order
                      </button>
                      <button
                        onClick={() => setActionPreview(false)}
                        type="button"
                        className="inline-block text-sm btn-info"
                      >
                        Server/Receiver
                      </button>
                    </div>
                  )}

                {currPlays.length > 0 && (
                  <>
                    <button
                      onClick={openResetConfirm}
                      className="inline-block text-sm btn-info"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setActionPreview(true)}
                      className="inline-block text-sm btn-info"
                    >
                      Action Preview
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full mt-4 flex justify-center items-center">
        <button
          className="btn-info flex flex-col flex-wrap items-center justify-center"
          onClick={() => window.location.reload()}
        >
          <span>If score doesn’t update, REFRESH before advancing.</span>
          <span className="font-normal text-xs capitalize">
            If you leave the screen you will need to refresh FIRST.
          </span>
        </button>
      </div>

      <ChangePlayDialog
        changePlayEl={changePlayEl}
        currPlays={currPlays}
        handlePlayChange={handlePlayChange}
        setToBeSelectedPlay={setToBeSelectedPlay}
        toBeSelectedPlay={toBeSelectedPlay}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        playerMap={playerMap}
      />

      <ResetPlayDialog
        closeResetConfirm={closeResetConfirm}
        confirmBoxEl={confirmBoxEl}
        handleConfirmReset={handleConfirmReset}
      />

      <RevertPreviousDialog
        accessCode={accessCode}
        currMatch={currMatch}
        currNetNum={currNetNum}
        currPlays={currPlays}
        currRoom={currRoom}
        dispatch={dispatch}
        socket={socket}
        netByNum={netByNum}
        playerMap={playerMap}
        revertPlayEl={revertPlayEl}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        token={token}
        teamA={teamA || null}
        teamB={teamB || null}
        eventId={eventId}
      />

      {/* Server receiver change manually  */}
      <ServerReceiverDialog
        currServerReceiver={currServerReceiver}
        net={selectedNet}
        playerMap={playerMap}
        teamA={teamA || null}
        teamB={teamB || null}
        srChangerEl={srChangerEl}
        eventId={eventId}
      />
    </div>
  );
}
