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
import { useMutation } from "@apollo/client/react";
import { UPDATE_TEAM_PLAYER_RANKING } from "@/graphql/player-ranking";

// Sub-component: Dialog Header
const DialogHeader = ({
  onClose,
}: {
  onClose: (e: React.SyntheticEvent) => void;
}) => (
  <div className="bg-black-logo w-full p-4 text-center relative">
    <button
      onClick={onClose}
      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-yellow-500/20 rounded-lg transition-colors"
    >
      <Image
        width={16}
        height={16}
        src="/icons/close.svg"
        alt="close"
        className="w-4 h-4 svg-white"
      />
    </button>
    <h3 className="text-white text-lg font-bold uppercase tracking-wide">
      Match Details
    </h3>
  </div>
);

// Sub-component: Info Card
const InfoCard = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-gradient-to-br from-gray-900 to-black-logo border border-yellow-500/30 rounded-xl p-4 shadow-lg ${className}`}
  >
    {children}
  </div>
);

// Sub-component: Detail Item
const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-yellow-500/10 last:border-b-0">
    <span className="text-yellow-400 font-medium text-sm">{label}:</span>
    <span className="text-white font-semibold">{value}</span>
  </div>
);

// Sub-component: Action Button
const ActionButton = ({
  onClick,
  children,
  variant = "primary",
}: {
  onClick: (e: React.SyntheticEvent) => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95
      ${
        variant === "primary"
          ? "bg-yellow-500 text-black-logo hover:bg-yellow-400 shadow-lg hover:shadow-yellow-500/25"
          : "bg-gray-700 text-white hover:bg-gray-600 border border-yellow-500/30"
      }
    `}
  >
    {children}
  </button>
);

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
            input: { match: match._id, rankLock },
          },
        });
        dialogSettingEl.current?.close();
        window.location.reload();
      } catch (error) {
        console.log(error);
      }
    },
    [match._id, myTeam?._id]
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

  const scoreKeepingLinks = useMemo(
    () =>
      canBeScoreKeeper && (
        <InfoCard className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5">
          <div className="text-center mb-3">
            <h4 className="text-yellow-400 font-bold text-lg">Score Keeping</h4>
            <p className="text-gray-300 text-sm">Manage match scoring</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link
              className="bg-yellow-500 text-black-logo px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition-colors text-sm shadow-lg"
              href={`/score-keeping/${match._id}/${ldoIdUrl}`}
            >
              Start New
            </Link>
            <Link
              className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors text-sm border border-yellow-500/30"
              href={`/score-keeping/${match._id}/${ldoIdUrl}`}
            >
              Edit
            </Link>
          </div>
        </InfoCard>
      ),
    [canBeScoreKeeper, match._id, ldoIdUrl]
  );

  const teamComponents = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {myTeam && (
          <div className="transform hover:scale-[1.02] transition-transform duration-200">
            <TeamInMatch team={myTeam} home />
          </div>
        )}
        {opTeam && (
          <div className="transform hover:scale-[1.02] transition-transform duration-200">
            <TeamInMatch team={opTeam} home={false} />
          </div>
        )}
      </div>
    ),
    [myTeam, opTeam]
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

  const fwangoLink = useMemo(
    () =>
      match.fwango && (
        <Link
          href={match.fwango}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/30 rounded-xl hover:from-yellow-500/20 hover:to-yellow-500/10 transition-all duration-200 group"
        >
          <span className="text-yellow-400 font-semibold group-hover:text-yellow-300">
            Fwango Link
          </span>
          <Image
            width={16}
            height={16}
            src="/icons/external-link.svg"
            alt="external"
            className="w-4 h-4 svg-yellow"
          />
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
            className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border border-yellow-500/30 rounded-xl hover:from-yellow-500/20 hover:to-yellow-500/10 transition-all duration-200 group"
          >
            <span className="text-yellow-400 font-semibold group-hover:text-yellow-300 capitalize">
              {cm.title}
            </span>
            <Image
              width={16}
              height={16}
              src="/icons/external-link.svg"
              alt="external"
              className="w-4 h-4 svg-yellow"
            />
          </Link>
        );
      }
      return (
        <div
          key={cm.id}
          className="border border-yellow-500/30 rounded-xl overflow-hidden"
        >
          <button
            type="button"
            className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-900 to-black-logo hover:from-yellow-500/10 hover:to-yellow-500/5 transition-all duration-200"
            onClick={(e) => handleMenuItem(e, cm.title)}
          >
            <span className="text-white font-semibold capitalize">
              {cm.title}
            </span>
            <Image
              width={16}
              height={16}
              src="/icons/right-arrow.svg"
              alt="arrow"
              className={`w-4 h-4 svg-white transition-transform duration-200 ${
                selectedColItem === cm.title ? "rotate-90" : ""
              }`}
            />
          </button>
          {selectedColItem === cm.title && (
            <div className="bg-black-logo border-t border-yellow-500/30 p-4">
              <CollapseContent title={selectedColItem} />
            </div>
          )}
        </div>
      );
    },
    [selectedColItem, handleMenuItem, match.event, match._id, ldoIdUrl]
  );

  // ====== JSX ======
  return (
    <>
      <dialog
        ref={dialogSettingEl}
        className="modal-dialog"
      >
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

            {scoreKeepingLinks}

            {/* Match Details */}
            <InfoCard>
              <h4 className="text-yellow-400 font-bold text-lg mb-4 text-center">
                Match Configuration
              </h4>
              <div className="space-y-1">
                <DetailItem
                  label="Net Variance"
                  value={matchDetails.netVariance as number}
                />
                <DetailItem
                  label="Number of Nets"
                  value={matchDetails.numberOfNets as number}
                />
                <DetailItem
                  label="Number of Rounds"
                  value={matchDetails.numberOfRounds as number}
                />
                <DetailItem
                  label="Tie Breaking"
                  value={matchDetails.tieBreaking as string}
                />
              </div>
            </InfoCard>

            {teamComponents}

            {/* Action Buttons */}
            {(uncheckInButton || unlockRankingButton) && (
              <div className="flex gap-3 justify-center flex-wrap">
                {uncheckInButton}
                {unlockRankingButton}
              </div>
            )}

            {fwangoLink}

            {/* Menu Items */}
            <div className="space-y-3">{colMenus.map(renderMenuItem)}</div>
          </div>
        </div>
      </dialog>

      {/* Floating Setting Button */}
      <button
        onClick={handleSettingOpen}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-yellow-500 hover:bg-yellow-400 text-black-logo p-3 rounded-full shadow-2xl shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all duration-200 hover:scale-110 z-50 group"
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
