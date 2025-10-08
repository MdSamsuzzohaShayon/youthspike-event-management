import React, { useRef, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { ETeam, IMatchRelatives, IRoom, IRoundRelatives, ITeam } from "@/types";
import { readDate } from "@/utils/datetime";
import { EMenuTitle, IColMenu } from "@/types/elements";
import { setMessage, setSelectedColItem } from "@/redux/slices/elementSlice";
import { useLdoId } from "@/lib/LdoProvider";
import { ADMIN_FRONTEND_URL } from "@/utils/keys";
import TeamInMatch from "../team/TeamInMatch";
import CollapseContent from "./CollapseContent";
import { EActionProcess } from "@/types/room";
import { CldImage } from "next-cloudinary";
import { useUser } from "@/lib/UserProvider";
import EmitEvents from "@/utils/socket/EmitEvents";
import { useSocket } from "@/lib/SocketProvider";
import { useMutation } from "@apollo/client";
import { UPDATE_TEAM_PLAYER_RANKING } from "@/graphql/player-ranking";

interface IMatchSettingProps {
  match: IMatchRelatives;
  myTeam: ITeam | null;
  opTeam: ITeam | null;
  currRoom: IRoom | null;
  currRound: IRoundRelatives | null;
  myTeamE: ETeam;
}

function MatchSetting({
  match,
  myTeam,
  opTeam,
  currRoom,
  currRound,
  myTeamE,
}: IMatchSettingProps) {
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();
  const { ldoIdUrl } = useLdoId();
  const dialogSettingEl = useRef<HTMLDialogElement>(null);

  const [mutateTeamPlayerRanking, { error: uErr }] = useMutation(
    UPDATE_TEAM_PLAYER_RANKING
  );

  // ✅ Single useAppSelector
  const {
    ldo,
    colMenus,
    selectedColItem,
    teamAPlayerRanking,
    teamBPlayerRanking,
    rounds: roundList,
  } = useAppSelector((state) => ({
    ldo: state.events.ldo,
    colMenus: state.elements.colMenus,
    selectedColItem: state.elements.selectedColItem,
    teamAPlayerRanking: state.playerRanking.teamAPlayerRanking,
    teamBPlayerRanking: state.playerRanking.teamBPlayerRanking,
    rounds: state.rounds.roundList,
  }));

  // ====== Handlers ======
  const handleSettingOpen = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    dialogSettingEl.current?.showModal();
  }, []);

  const handleSettingClose = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    dialogSettingEl.current?.close();
  }, []);

  const handleMenuItem = useCallback(
    (e: React.SyntheticEvent, menuItem: EMenuTitle) => {
      e.preventDefault();
      dispatch(setSelectedColItem(menuItem));
    },
    [dispatch]
  );

  const handleUndoCheckIn = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      const emitEvent = new EmitEvents(socket, dispatch);
      emitEvent.undoCheckIn({
        user,
        currRoom,
        currRound,
        roundList,
        dispatch,
        myTeamE,
        socket,
      });
      dialogSettingEl.current?.close();
    },
    [socket, dispatch, user, currRoom, currRound, roundList, myTeamE]
  );

  const handleUnlockRank = useCallback(
    async (e: React.SyntheticEvent, rankLock: boolean) => {
      e.preventDefault();
      try {
        await mutateTeamPlayerRanking({
          variables: {
            input: { match: match._id, team: myTeam?._id, rankLock },
          },
        });
        dialogSettingEl.current?.close();
        window.location.reload();
      } catch (error) {
        console.log(error);
      }
    },
    [mutateTeamPlayerRanking, match._id, myTeam?._id]
  );

  

  // ====== Derived State ======
  const canBeScoreKeeper = useMemo(() => {
    if (!currRoom || !currRound) return false;
    const roundExist = currRoom.rounds.find((r) => r._id === currRound._id);
    if (!roundExist) return false;
    return (
      roundExist.teamAProcess === EActionProcess.LINEUP &&
      roundExist.teamBProcess === EActionProcess.LINEUP
    );
  }, [currRoom, currRound]);

  useEffect(() => {
    if (uErr) {
      dispatch(setMessage({ message: uErr?.name || "Error unlocking rank" }));
    }
  }, [dispatch, uErr]);

  // ====== Memoized UI Pieces ======
  const matchDetails = useMemo(
    () => ({
      date: readDate(match.date),
      description: match.description,
      location: match.location,
      netVariance: match.netVariance,
      numberOfNets: match.numberOfNets,
      numberOfRounds: match.numberOfRounds,
      tieBreaking: match.tieBreaking?.replace(/_/, " "),
    }),
    [match]
  );

  const dialogHeader = useMemo(
    () => (
      <div
        className="bg-black-logo w-full h-8 text-center px-2 flex justify-between items-center"
        onClick={handleSettingClose}
        role="presentation"
      >
        <div />
        <h3 className="text-white capitalize">Match Detail</h3>
        <Image
          width={12}
          height={12}
          src="/icons/close.svg"
          alt="cross"
          className="h-4 w-4 svg-white"
        />
      </div>
    ),
    [handleSettingClose]
  );

  const eventLogo = useMemo(
    () =>
      ldo?.logo ? (
        <CldImage alt={ldo.name} width="200" height="200" className="w-16" src={ldo.logo} crop="fit" />
      ) : (
        <Image width={64} height={64} src="/free-logo.png" className="w-16" alt="free-logo" />
      ),
    [ldo]
  );

  const scoreKeepingLinks = useMemo(
    () =>
      canBeScoreKeeper && (
        <div className="score-keeping-wrapper bg-black-logo w-full flex justify-center items-center rounded-lg mt-2 p-2 gap-x-2">
          <Link className="btn-light" href={`/score-keeping/${match._id}/${ldoIdUrl}`}>
            Start New
          </Link>
          <Link className="btn-light" href={`/score-keeping/${match._id}/${ldoIdUrl}`}>
            Edit
          </Link>
        </div>
      ),
    [canBeScoreKeeper, match._id, ldoIdUrl]
  );

  const teamComponents = useMemo(
    () => (
      <>
        {myTeam && (
          <div className="box-3 border border-black-logo rounded-lg mt-4">
            <TeamInMatch team={myTeam} home />
          </div>
        )}
        {opTeam && (
          <div className="box-3 border border-black-logo rounded-lg mt-4">
            <TeamInMatch team={opTeam} home={false} />
          </div>
        )}
      </>
    ),
    [myTeam, opTeam]
  );

  const uncheckInButton = useMemo(() => {
    if (currRound?.num !== 1 || !user?.token) return null;
    if (
      (myTeamE === ETeam.teamA && currRound.teamAProcess === EActionProcess.CHECKIN) ||
      (myTeamE === ETeam.teamB && currRound.teamBProcess === EActionProcess.CHECKIN)
    ) {
      return <button className="btn-success" onClick={handleUndoCheckIn}>Undo Check In</button>;
    }
    return null;
  }, [currRound, myTeamE, user?.token, handleUndoCheckIn]);

  const unlockRankingButton = useMemo(() => {
    if (!user?.token) return null;
    const rankLock = myTeamE === ETeam.teamA ? teamAPlayerRanking?.rankLock: teamBPlayerRanking?.rankLock;
    return <button className="btn-success" onClick={(e)=> handleUnlockRank(e, !rankLock)}>{rankLock ? "Unlock" : "Lock"} Ranking</button>;
  }, [user?.token, myTeamE, teamAPlayerRanking?.rankLock, teamBPlayerRanking?.rankLock, handleUnlockRank]);

  const fwangoLink = useMemo(
    () =>
      match.fwango && (
        <Link
          href={match.fwango}
          target="_blank"
          rel="noopener noreferrer"
          className="item-link uppercase border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4"
        >
          Fwang Link
        </Link>
      ),
    [match.fwango]
  );

  const renderMenuItem = useCallback(
    (cm: IColMenu) => {
      if (cm.title === EMenuTitle.EDIT_MATCH) {
        return (
          <Link
            href={`${ADMIN_FRONTEND_URL}/${match.event}/matches/${match._id}/${ldoIdUrl}`}
            key={cm.id}
            target="_blank"
            rel="noopener noreferrer"
            className="item-link border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4"
          >
            {cm.title}
          </Link>
        );
      }
      return (
        <React.Fragment key={cm.id}>
          <button
            type="button"
            className="collapse-trigger border-b border-gray-400 flex justify-between items-center py-2 w-full mt-4"
            onClick={(e) => handleMenuItem(e, cm.title)}
          >
            <span className="capitalize">{cm.title}</span>
            <Image width={12} height={12} src="/icons/right-arrow.svg" alt="arrow" />
          </button>
          {selectedColItem === cm.title && (
            <div className="collapse-content mt-2">
              <CollapseContent title={selectedColItem} />
            </div>
          )}
        </React.Fragment>
      );
    },
    [selectedColItem, handleMenuItem, match.event, match._id, ldoIdUrl]
  );

  // ====== JSX ======
  return (
    <>
      <dialog ref={dialogSettingEl} className="modal-dialog">
        {dialogHeader}
        <div className="content p-4 w-full">
          {/* Box 1 - Event Logo and Details */}
          <div className="box-1 bg-black-logo text-white rounded-lg flex justify-between items-center">
            <div className="logo m-2">{eventLogo}</div>
            <div className="detail m-2">
              <h3>{ldo?.name}</h3>
              <p>Date: {matchDetails.date}</p>
              <p>Description: {matchDetails.description}</p>
              <p>Location: {matchDetails.location}</p>
            </div>
          </div>
          {scoreKeepingLinks}
          {/* Box 2 - Match Details */}
          <div className="box-2 border border-black-logo rounded-lg mt-4">
            <div className="detail m-2">
              <p>Net Variance: {matchDetails.netVariance}</p>
              <p>Number of Nets: {matchDetails.numberOfNets}</p>
              <p>Number of Rounds: {matchDetails.numberOfRounds}</p>
              <p className="capitalize">Tie breaking strategy: {matchDetails.tieBreaking}</p>
            </div>
          </div>
          {teamComponents}
          <div className="flex justify-center items-center py-2 gap-x-2">
            {uncheckInButton}
            {unlockRankingButton}
          </div>
          {fwangoLink}
          {colMenus.map(renderMenuItem)}
        </div>
      </dialog>

      {/* Setting Icon */}
      <div
        className="img-holder p-2 w-8 absolute left-1 bg-white rounded-full cursor-pointer z-20"
        style={{ top: "47%" }}
        onClick={handleSettingOpen}
        role="button"
        tabIndex={0}
        onKeyDown={handleSettingOpen}
      >
        <Image width={12} height={12} src="/icons/setting.svg" alt="setting" className="w-full" />
      </div>
    </>
  );
}

export default React.memo(MatchSetting);
