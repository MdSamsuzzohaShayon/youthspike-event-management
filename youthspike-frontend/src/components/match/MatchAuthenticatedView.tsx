import useResizeObserver from "@/hooks/useResizeObserver";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setScreenSize } from "@/redux/slices/elementSlice";
import LocalStorageService from "@/utils/LocalStorageService";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import TeamPlayers from "../player/TeamPlayers";
import NotTieBreaker from "../ActionBoxes/NotTieBreaker";
import NetScoreOfRound from "./NetScoreOfRound";
import LineupStrategy from "./LineupStrategy";
import { useSocket } from "@/lib/SocketProvider";
import VerifyLineup from "../ActionBoxes/VerifyLineup";
import {
  EPlayerStatus,
  ETeam,
  IMatchRelatives,
  IPlayer,
  ITeam,
  UserRole,
} from "@/types";
import RoundRunner from "./RoundRunner";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { useUser } from "@/lib/UserProvider";
import { APP_NAME } from "@/utils/keys";
import SelectTeamDialog from "./SelectTeamDialog";

interface IMatchAuthenticatedViewProps {
  currMatch: IMatchRelatives;
  myS: number;
  opS: number;
  myTeam: ITeam | null;
  opTeam: ITeam | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  verifyLineup: boolean;
  myTeamE: ETeam;
  myPlayers: IPlayer[];
  opPlayers: IPlayer[];
  audioPlayEl: React.RefObject<HTMLButtonElement | null>;
}

function MatchAuthenticatedView({
  currMatch,
  myS,
  opS,
  myTeam,
  opTeam,
  teamA,
  teamB,
  verifyLineup,
  myTeamE,
  myPlayers,
  opPlayers,
  audioPlayEl,
}: IMatchAuthenticatedViewProps) {
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const user = useUser();

  const { screenWidth } = useAppSelector((state) => state.elements);
  const {
    currentRoundNets: currRoundNets,
    nets: allNets,
    notTieBreakerNetId,
  } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector(
    (state) => state.rounds
  );
  const { current: currRoom } = useAppSelector((state) => state.rooms);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);

  // Local State
  const [selectTeam, setSelectTeam] = useState<boolean>(false);

  const mainEl = useResizeObserver(
    useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
      dispatch(setScreenSize(entry.contentRect.width));
    }, [])
  );

  // Event handlers
  const handlePlayAudio = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (LocalStorageService.hasTimePassed(5)) {
      const audio = new Audio("/audio/notification.mp3");
      audio.play().catch(console.error);
      LocalStorageService.setMusicPlayedTime();
    }
  }, []);

  const showSponsors = useMemo(
    () => eventSponsors.length > 0 && (!user || !user.token),
    [eventSponsors.length, user]
  );

  const captainAccess: boolean = useMemo(() => {
    if (
      user.info?.role !== UserRole.captain &&
      user.info?.role !== UserRole.co_captain
    ) {
      return true;
    }
    if (user?.info?.captainplayer) {
      if (
        user.info.captainplayer === teamA?.captain?._id ||
        user.info.captainplayer === teamB?.captain?._id
      ) {
        return true;
      }
    }
    if (user?.info?.cocaptainplayer) {
      if (
        user.info.cocaptainplayer === teamA?.cocaptain?._id ||
        user.info.cocaptainplayer === teamB?.cocaptain?._id
      ) {
        return true;
      }
    }
    return false;
  }, [user, teamA, teamB]);
  const myActivePlayers = useMemo(
    () => myPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [myPlayers, myTeamE, teamB, teamA]
  );

  const opActivePlayers = useMemo(
    () => opPlayers.filter((p) => p.status !== EPlayerStatus.INACTIVE),
    [opPlayers]
  );

  // User interaction at the beginning
  useEffect(() => {
    mainEl.current?.click();
  }, [mainEl]);

  return (
    <div className="relative bg-white text-black-logo" ref={mainEl}>
      <button
        ref={audioPlayEl}
        onClick={handlePlayAudio}
        type="button"
        className="hidden"
      >
        Button
      </button>

      <div className="op-rosters-wrapper w-full bg-black-logo text-white">
        <div
          className={`w-full bg-black-logo ${
            myS < opS && currMatch.completed
              ? "bg-green-500 text-white"
              : "text-gray-100"
          }`}
        >
          <h1 className="op-team-name text-2xl font-bold uppercase container px-4 mx-auto">
            {opTeam?.name}
          </h1>
        </div>
        <TeamPlayers
          teamPlayers={opActivePlayers}
          roundList={roundList}
          screenWidth={screenWidth}
          onTop
          teamE={myTeamE === ETeam.teamA ? ETeam.teamB : ETeam.teamA}
        />
      </div>

      <div className="main-match-wrapper w-full">
        {notTieBreakerNetId ? (
          <div className="not-tie-breaker w-full bg-white text-black-logo shadow-md rounded-lg">
            <NotTieBreaker
              teamA={teamA}
              teamB={teamB}
              ntbnId={notTieBreakerNetId}
              currRoundNets={currRoundNets}
              currRound={currRound}
              socket={socket}
            />
          </div>
        ) : (
          <div className="verify-strategy-main-points">
            {verifyLineup ? (
              <VerifyLineup />
            ) : (
              <>
                {currRound && (
                  <div className="net-score">
                    <NetScoreOfRound currRoundId={currRound._id} />
                  </div>
                )}

                {user?.info && (
                  <div className="line-up-strategy w-full">
                    <LineupStrategy
                      myTeamE={myTeamE}
                      currRound={currRound}
                      myPlayers={myPlayers}
                      opPlayers={opPlayers}
                      currRoundNets={currRoundNets}
                      allNets={allNets}
                      roundList={roundList}
                      currMatch={currMatch}
                    />
                  </div>
                )}
                {user?.info &&
                  currRoom &&
                  [
                    UserRole.director,
                    UserRole.admin,
                    UserRole.captain,
                    UserRole.co_captain,
                  ].includes(user.info.role) &&
                  captainAccess && (
                    <div className="my-round-runner w-full">
                      <RoundRunner
                        currentRoom={currRoom}
                        currentRound={currRound}
                        myTeamE={myTeamE}
                        roundList={roundList}
                        teamA={teamA || null}
                        teamB={teamB || null}
                        currRoundNets={currRoundNets}
                      />
                    </div>
                  )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="my-roster-wrapper w-full bg-black-logo text-white">
        <TeamPlayers
          roundList={roundList}
          teamPlayers={myActivePlayers}
          screenWidth={screenWidth}
          teamE={myTeamE}
        />
        <h1 className="op-team-name text-2xl font-bold uppercase container px-4 mx-auto">
          {myTeam?.name}
        </h1>

        <div className="team-name-selection">
          {selectTeam && teamA && teamB && (
            <div className="select-team-wrapper px-4">
              <SelectTeamDialog
                teamA={teamA}
                teamB={teamB}
                setSelectTeam={setSelectTeam}
              />
            </div>
          )}
          <div className="w-full">
            <div className="container px-4 mx-auto flex justify-between">
              {(user.info?.role === UserRole.director ||
                user.info?.role === UserRole.admin) && (
                <button
                  className="w-full flex justify-between items-center"
                  aria-label="select-team"
                  type="button"
                  onClick={() => setSelectTeam(true)}
                >
                  <span className="uppercase">{myTeam?.name}</span>
                  <Image
                    width={24}
                    height={24}
                    src="/icons/dropdown.svg"
                    className="w-6 svg-white"
                    alt="dropdown-icon"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSponsors && (
        <div className="sponsors w-full py-4 mx-auto bg-black-logo text-white rounded-lg shadow-md">
          <div className="container px-4 mx-auto">
            <h2 className="text-lg font-semibold">Sponsors</h2>
            <div className="flex items-center justify-between md:justify-start flex-wrap w-full gap-4">
              {eventSponsors.map((spon) =>
                spon.company === APP_NAME ? (
                  <Image
                    key={spon._id}
                    src={`/${spon.logo}`}
                    width={40}
                    height={40}
                    alt="default-logo"
                    className="w-20"
                  />
                ) : (
                  <CldImage
                    alt={spon.company}
                    width="100"
                    height="100"
                    className="w-20"
                    crop="fit"
                    src={spon.logo}
                  />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchAuthenticatedView;
