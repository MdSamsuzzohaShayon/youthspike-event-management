import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect
} from "react";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  ETeam,
  IMatchRelatives,
  IRoom,
  IRoundRelatives,
  ITeam
} from "@/types";
import { readDate } from "@/utils/datetime";
import { setMessage } from "@/redux/slices/elementSlice";
import { EActionProcess } from "@/types/room";
import { CldImage } from "next-cloudinary";
import { useUser } from "@/lib/UserProvider";
import EmitEvents from "@/utils/socket/EmitEvents";
import { useSocket } from "@/lib/SocketProvider";
import { useMutation } from "@apollo/client/react";
import { UPDATE_TEAM_PLAYER_RANKING } from "@/graphql/player-ranking";
import ActionButton from "./MatchSettings/ActionButton";
import DialogHeader from "./MatchSettings/DialogHeader";
import { MenuItems } from "./MatchSettings/MenuItems";
import ScoreKeepingLinks from "./MatchSettings/ScoreKeepingLinks";
import TeamComponents from "./MatchSettings/TeamComponents";
import TeamPenaltyPoints from "./MatchSettings/TeamPenaltyPoints";
import MatchConfiguration from "./MatchSettings/MatchConfiguration";
import ForfeitMatch from "./MatchSettings/ForfeitMatch";



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
  // Hooks
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  const [mutateTeamPlayerRanking, { error: uErr }] = useMutation(
    UPDATE_TEAM_PLAYER_RANKING
  );


  // Redux selector
  const {
    ldo,
    teamAPlayerRanking,
    teamBPlayerRanking,
    rounds: roundList,
  } = useAppSelector((state) => ({
    ldo: state.events.ldo,
    teamAPlayerRanking: state.playerRanking.teamAPlayerRanking,
    teamBPlayerRanking: state.playerRanking.teamBPlayerRanking,
    rounds: state.rounds.roundList,
  }));

  // Local state and refs
  const dialogSettingRef = useRef<HTMLDialogElement>(null);


  // ====== Handlers ======
  const handleSettingOpen = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    dialogSettingRef.current?.showModal();
  }, []);

  const handleSettingClose = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    dialogSettingRef.current?.close();
  }, []);



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
        match,
      });
      dialogSettingRef.current?.close();
    },
    [socket, dispatch, user, currRoom, currRound, roundList, myTeamE]
  );

  const handleUnlockRank = useCallback(
    async (e: React.SyntheticEvent, rankLock: boolean) => {
      e.preventDefault();
      try {
        await mutateTeamPlayerRanking({
          variables: {
            input: { match: match._id, rankLock },
          },
        });
        dialogSettingRef.current?.close();
        window.location.reload();
      } catch (error) {
        console.error(error);
      }
    },
    [match._id, myTeam?._id]
  );



  // ====== Derived State ======


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
      teamAP: match?.teamAP || 0,
      teamBP: match?.teamBP || 0,
    }),
    [match]
  );

  const eventLogo = useMemo(
    () =>
      ldo?.logo ? (
        <CldImage
          alt={ldo.name}
          width="80"
          height="80"
          className="w-20 h-20 rounded-xl border-2 border-yellow-500 object-cover"
          src={ldo.logo}
          crop="fit"
        />
      ) : (
        <Image
          width={80}
          height={80}
          src="/free-logo.png"
          className="w-20 h-20 rounded-xl border-2 border-yellow-500 object-cover"
          alt="free-logo"
        />
      ),
    [ldo]
  );





  const uncheckInButton = useMemo(() => {
    if (currRound?.num !== 1 || !user?.token) return null;
    if (
      (myTeamE === ETeam.teamA &&
        currRound.teamAProcess === EActionProcess.CHECKIN) ||
      (myTeamE === ETeam.teamB &&
        currRound.teamBProcess === EActionProcess.CHECKIN)
    ) {
      return (
        <ActionButton onClick={handleUndoCheckIn}>Undo Check In</ActionButton>
      );
    }
    return null;
  }, [currRound, myTeamE, user?.token, handleUndoCheckIn]);

  const unlockRankingButton = useMemo(() => {
    if (!user?.token) return null;
    const rankLock =
      myTeamE === ETeam.teamA
        ? teamAPlayerRanking?.rankLock
        : teamBPlayerRanking?.rankLock;
    return (
      <ActionButton
        onClick={(e) => handleUnlockRank(e, !rankLock)}
        variant="secondary"
      >
        {rankLock ? "🔓 Unlock" : "🔒 Lock"} Ranking
      </ActionButton>
    );
  }, [
    user?.token,
    myTeamE,
    teamAPlayerRanking?.rankLock,
    teamBPlayerRanking?.rankLock,
    handleUnlockRank,
  ]);

  // ====== JSX ======
  return (
    <>
      <dialog ref={dialogSettingRef} className="modal-dialog">
        <div className="bg-gradient-to-br from-gray-900 to-black-logo border-2 border-yellow-500/20 overflow-hidden">
          <DialogHeader onClose={handleSettingClose} />
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* Event Header */}
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 rounded-xl border border-yellow-500/20">
              {eventLogo}
              <div className="flex-1">
                <h2 className="text-yellow-400 font-bold text-xl">
                  {ldo?.name}
                </h2>
                <p className="text-gray-300 text-sm">
                  {matchDetails.description}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>📅 {matchDetails.date}</span>
                  <span>📍 {matchDetails.location}</span>
                </div>
              </div>
            </div>

            <div className="w-full">
              <ScoreKeepingLinks />
            </div>

            {/* Match Details */}
            <div className="w-full">
              <MatchConfiguration matchDetails={matchDetails} />
            </div>

            <div className="w-full">
              <TeamPenaltyPoints matchDetails={matchDetails} dialogSettingRef={dialogSettingRef} />
            </div>

            <div className="w-full">
              <ForfeitMatch match={match} currRound={currRound} />
            </div>


            <div className="w-full">
              <TeamComponents />
            </div>

            {/* Action Buttons */}
            {(uncheckInButton || unlockRankingButton) && (
              <div className="flex gap-3 justify-center flex-wrap">
                {uncheckInButton}
                {unlockRankingButton}
              </div>
            )}

            <div className="w-full">
              <MenuItems />
            </div>
          </div>
        </div>
      </dialog>

      {/* Floating Setting Button */}
      <button
        onClick={handleSettingOpen}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-yellow-logo hover:bg-yellow-400 text-black-logo p-3 rounded-full shadow-2xl shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-200 hover:scale-110 z-50 group"
        style={{ top: "47%" }}
      >
        <Image
          width={20}
          height={20}
          src="/icons/setting.svg"
          alt="settings"
          className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200"
        />
      </button>
    </>
  );
}

export default React.memo(MatchSetting);
