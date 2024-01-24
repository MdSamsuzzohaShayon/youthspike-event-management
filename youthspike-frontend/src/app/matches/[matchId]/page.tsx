'use client';

/* eslint-disable no-unused-vars */
import Head from 'next/head';
import React, { useEffect, useCallback, Suspense, useState } from 'react';

// Hooks
import useResizeObserver from '@/hooks/useResizeObserver';

// Components
import TeamPlayers from '@/components/match/TeamPlayers';
import RoundRunner from '@/components/match/RoundRunner';
import NetScoreOfRound from '@/components/match/NetScoreOfRound';
import Loader from '@/components/elements/Loader';

// GraphQL
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_MATCH_DETAIL } from '@/graphql/matches';
import { UPDATE_NETS } from '@/graphql/net';

// Redux
import { setMatchInfo, setMyPlayers, setMyTeam, setOpPlayers, setOpTeam, setSubmittedLineup, setTeamE, setTeamProcess } from '@/redux/slices/matchesSlice';
import { setTeamA, setTeamB } from '@/redux/slices/teamSlice';
import { setTeamAPlayers, setTeamBPlayers } from '@/redux/slices/playerSlice';
import { setCurrentEventInfo, setEventSponsors } from '@/redux/slices/eventSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { setCurrentRoundNets, setNets, updateMultiNetsPlayers } from '@/redux/slices/netSlice';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setIsLoading, setScreenSize } from '@/redux/slices/elementSlice';

// Utils
import { getCookie } from '@/utils/cookie';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
// Types
import { ITeam, IMatchExpRel, IPlayer, IEvent, INetBase, IRoom, ICheckIn, INetAssign, ISubmitLineup, IRoomNets, INetScoreUpdate } from '@/types';
import { IRoundBase, IRoundExpRel, IRoundRelatives } from '@/types/round';
import { IUser, IUserContext, UserRole } from '@/types/user';
import { INetRelatives, IUpdateScoreResponse } from '@/types/net';
import { useUser } from '@/lib/UserProvider';
import Message from '@/components/elements/Message';
import { useSocket } from '@/lib/SocketProvider';
import { ETeam } from '@/types/team';
import { EActionProcess, IError } from '@/types/elements';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { handleError, isValidObjectId } from '@/utils/helper';

/**
 * Test Match
 * jane.smith@yp.com
 * daniel.brown@yp.com
 */

export function MatchPage({ params }: { params: { matchId: string } }) {
  /**
   * @private version
   * Get all the players of the match
   * Players of my team and players of oponent team
   * Get all rounds and the round we are on
   */
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // Redux States
  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const eventSponsors = useAppSelector((state) => state.events.sponsors);
  const screenWidth = useAppSelector((state) => state.elements.screenWidth);
  const { current: currentRound, roundList } = useAppSelector((state) => state.rounds);
  const { currentRoundNets: currRoundNets, updateNets, nets: allNets } = useAppSelector((state) => state.nets);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const { myPlayers, opPlayers, opTeamE, myTeamE, myTeam, opTeam, myTeamProcess, opTeamProcess } = useAppSelector((state) => state.matches);

  const [actErr, setActErr] = useState<IError | null>(null);

  // GraphAL
  const [fetchMatch, { data, error, loading, refetch }] = useLazyQuery(GET_MATCH_DETAIL);
  const [mutateNet, { data: mData, error: mErr }] = useMutation(UPDATE_NETS);

  /**
   * Event handlers
   */
  const handleUpdatePoints = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const netPointsList = [];
    for (const n of updateNets) {
      const nObj = {
        _id: n._id,
        teamAScore: n.teamAScore ? n.teamAScore : 0,
        teamBScore: n.teamBScore ? n.teamBScore : 0,
      };
      netPointsList.push(nObj);
    }
    // @ts-ignore
    socket.emit("update-points-from-client", { nets: netPointsList, room: currentRoom?._id, round: currentRound?._id });

  }

  const handleChangeRound = async (e: React.SyntheticEvent, next: boolean) => {
    e.preventDefault();
    /**
     * Before completing current round someone can not go to the next round
     * Round must have team a score and team b score to proceed
     * Change current round nets
     */
    const findRoundIndex = roundList.findIndex((r) => r._id === currentRound?._id);
    if (findRoundIndex === -1) return;
    let newRoundIndex = 0;
    if (next) {
      let canGoNext = true;
      for (const currNet of currRoundNets) {
        if (!currNet.teamAPlayerA || !currNet.teamAPlayerB || !currNet.teamBPlayerA || !currNet.teamBPlayerB || !currNet.teamAScore || !currNet.teamBScore) {
          canGoNext = false;
        }
      }
      if (!canGoNext) {
        return setActErr({ name: "Incomplete round!", message: "Make sure you have completed this round by putting players on all of the nets and points." })
      }
      if ((!currentRound?.teamAScore || currentRound?.teamAScore === 0 || !currentRound?.teamBScore || currentRound?.teamBScore === 0)) return;

      if (roundList[findRoundIndex + 1]) {
        newRoundIndex = findRoundIndex + 1;
      }
    } else {
      if (findRoundIndex !== 0) {
        newRoundIndex = findRoundIndex - 1;
      }
    }
    const crObj = roundList[newRoundIndex];
    dispatch(setCurrentRound(crObj));
    const filteredNets = allNets.filter((net) => net.round === crObj._id);
    dispatch(setCurrentRoundNets(filteredNets));


    const rcd = { room: currentRoom?._id, round: currentRound?._id, nextRound: roundList[newRoundIndex]._id };
    if (currentRoom) {
      const newCurrRoom = { ...currentRoom, round: roundList[newRoundIndex]._id };
      if (myTeamE === ETeam.teamA) {
        newCurrRoom.teamAProcess = EActionProcess.CHECKIN;
      } else {
        newCurrRoom.teamBProcess = EActionProcess.CHECKIN;
      }
      dispatch(setCurrentRoom(newCurrRoom));
      dispatch(setTeamProcess({ myTeamProcess: EActionProcess.CHECKIN, opTeamProcess }));
      dispatch(setSubmittedLineup(false));
    }
    // @ts-ignore
    if (socket) socket.emit("round-change-from-client", rcd);
  }

  const handleActionRunner = (event: React.SyntheticEvent, team: string | null | undefined, process: string) => {
    event.preventDefault();
    if (!currentRoom || !currentRound) return;

    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const updateRoomProcess = (teamProcess: EActionProcess) => {
      return isTeamACaptain ? { teamAProcess: teamProcess } : { teamBProcess: teamProcess };
    };

    let actionData = {};

    switch (process) {
      case EActionProcess.INITIATE:
        // @ts-ignore
        socket.emit('join-room-from-client', { match: params.matchId, team });
        break;
      case EActionProcess.CHECKIN:
        actionData = {
          room: currentRoom._id,
          round: currentRound._id,
          ...updateRoomProcess(EActionProcess.CHECKIN)
        };
        // @ts-ignore
        socket.emit('check-in-from-client', actionData);
        break;
      case EActionProcess.LINEUP:
        // Validate submission
        // Not net can not be vacent in the place of placing players
        const roundNetAssign: INetAssign[] = currRoundNets.map((net) => ({
          _id: net._id,
          teamAPlayerA: net.teamAPlayerA,
          teamAPlayerB: net.teamAPlayerB,
          teamBPlayerA: net.teamBPlayerA,
          teamBPlayerB: net.teamBPlayerB,
        }));
        actionData = {
          room: currentRoom._id,
          round: currentRound._id,
          ...updateRoomProcess(EActionProcess.LOCKED),
          nets: roundNetAssign
        };
        // @ts-ignore
        socket.emit('submit-lineup-from-client', actionData);
        break;
      default:
        // Handle unknown process
        console.error('Unknown process:', process);
        return;
    }

    // @ts-ignore
    dispatch(setTeamProcess({ myTeamProcess: process, opTeamProcess }));
    dispatch(setCurrentRoom({ ...currentRoom, ...updateRoomProcess(process) }));
  };

  /**
   * Set initial state for current match
   */
  const setStateGetMatchData = (matchData: IMatchExpRel, token: string | null, userInfo: IUser | null) => {
    /**
     * Setting data as state of redux that is fetched from backend using GraphAL
     * Set action box values
     */

    const { _id, location, numberOfNets, numberOfRounds, teamA: teamAF, teamB: teamBF, date, rounds, event } = matchData;

    // Setting teams
    dispatch(setTeamA({ ...teamAF }));
    dispatch(setTeamB({ ...teamBF }));

    // Setting players
    let reformatAPlayers: IPlayer[] = [], reformatBPlayers: IPlayer[] = [];
    if (teamAF.players) {
      reformatAPlayers = teamAF.players.map((player: IPlayer) => {
        const newPlayer: IPlayer = {
          _id: player._id,
          status: player.status,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          rank: player.rank,
          team: teamAF._id,
          event: event._id,
          captainofteam: player.captainofteam,
          profile: player.profile
        };
        return newPlayer;
      });
      dispatch(setTeamAPlayers(reformatAPlayers));
    }
    if (teamBF.players) {
      reformatBPlayers = teamBF.players.map((player: IPlayer) => {
        const newPlayer: IPlayer = {
          _id: player._id,
          status: player.status,
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          rank: player.rank,
          team: teamBF._id,
          event: event._id,
          captainofteam: player.captainofteam,
          profile: player.profile
        };
        return newPlayer;
      });
      dispatch(setTeamBPlayers(reformatBPlayers));
    }

    // Setting event
    /*
    if(event){
      dispatch(setCurrentEventInfo({
        _id: event._id,
        name: event.normalize,
        startDate: string;
        endDate: string;
        playerLimit: number;
        active: boolean;
        sponsors: string[];
      }));
    }
    */

    // Event Sponsors
    dispatch(setEventSponsors(event.sponsors));

    // Setting Rounds
    const formattedRounds: IRoundRelatives[] = [];
    const formattedNets: INetRelatives[] = [];
    for (const round of rounds) {
      const playerIds = round.players ? round.players.map((r) => r._id) : [];
      const subIds = round.subs ? round.subs.map((r) => r._id) : [];
      const roundObj: IRoundRelatives = { _id: round._id, num: round.num, nets: [], players: playerIds, subs: subIds, match: params.matchId, teamAProcess: round.teamAProcess, teamAScore: round.teamAScore, teamBProcess: round.teamBProcess, teamBScore: round.teamBScore };

      // Setting Nets of a round
      if (round.nets && round.nets.length > 0) {
        const netIds: string[] = [];
        for (const n of round.nets) {
          netIds.push(n._id);
          formattedNets.push({
            _id: n._id, num: n.num, points: n.points, teamAScore: n.teamAScore, teamBScore: n.teamBScore, pairRange: n.pairRange, round: round._id,
            teamAPlayerA: n.teamAPlayerA, teamAPlayerB: n.teamAPlayerB, teamBPlayerA: n.teamBPlayerA, teamBPlayerB: n.teamBPlayerB
          });
        }
        roundObj.nets = netIds;
      }
      formattedRounds.push(roundObj);
    }

    dispatch(setNets(formattedNets));
    dispatch(setRoundList(formattedRounds));
    if (formattedRounds.length > 0) {
      dispatch(setCurrentRound(formattedRounds[0]));
    }

    if (formattedNets.length > 0 && formattedRounds.length > 0) {
      const filteredNets = formattedNets.filter((net) => net.round === formattedRounds[0]._id);
      dispatch(setCurrentRoundNets(filteredNets));
    }

    // Setting room
    if (!token || !userInfo) {
      // @ts-ignore
      dispatch(setCurrentRoom({ _id: matchData.room._id, match: _id, round: formattedRounds[0]._id, teamA: teamA?._id ? teamA._id : null, teamAClient: null, teamAProcess: formattedRounds[0].teamAProcess, teamB: teamB?._id ? teamB?._id : null, teamBClient: null, teamBProcess: formattedRounds[0].teamBProcess }))
    }

    // Setting Match
    dispatch(
      setMatchInfo({
        _id,
        date,
        location,
        numberOfNets,
        numberOfRounds,
        teamA: teamAF._id,
        teamB: teamBF._id,
        event: event._id,
        rounds: [...rounds.map(r => r._id)]
      }),
    );

    if (userInfo && userInfo.captainplayer === teamAF?.captain?._id) {
      dispatch(setMyTeam(teamAF));
      dispatch(setOpTeam(teamBF));
      dispatch(setMyPlayers(reformatAPlayers));
      dispatch(setOpPlayers(reformatBPlayers));
      dispatch(setTeamE({ myTeamE: ETeam.teamA, opTeamE: ETeam.teamB }));
      if (rounds && rounds.length > 0) {
        let myTeamProcess = rounds[0].teamAProcess;
        let opTeamProcess = rounds[0].teamBProcess;
        if (opTeamProcess === EActionProcess.LINEUP) {
          myTeamProcess = EActionProcess.CHECKIN;
        }
        // @ts-ignore
        dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      }
    } else {
      dispatch(setMyTeam(teamBF));
      dispatch(setOpTeam(teamAF));
      dispatch(setMyPlayers(reformatBPlayers));
      dispatch(setOpPlayers(reformatAPlayers));
      if (rounds && rounds.length > 0) {
        let myTeamProcess = rounds[0].teamBProcess;
        let opTeamProcess = rounds[0].teamAProcess;
        if (opTeamProcess === EActionProcess.LINEUP) {
          myTeamProcess = EActionProcess.CHECKIN;
        }
        // @ts-ignore
        dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      }
    }
  };

  useEffect(() => {
    // Get user info here
    const token = !getCookie('token') || getCookie('token')?.trim() === '' ? null : getCookie('token');
    const findUser = getCookie('user');
    const userInfo = findUser && findUser.trim() !== '' ? JSON.parse(findUser) : null;

    if (isValidObjectId(params.matchId)) {
      (async () => {
        const result = await fetchMatch({ variables: { matchId: params.matchId } });
        if (result?.data?.getMatch?.data) {
          setStateGetMatchData(result.data.getMatch.data, token, userInfo);
        } else {
          setActErr({ name: "Invalid Id", message: "No data found with given ID!" })
        }
      })();
    } else {
      setActErr({ name: "Invalid Id", message: "Can not fetch data due to invalid event ObjectId!" })
    }

    if (params.matchId) {
      (async () => {
        const result = await fetchMatch({ variables: { matchId: params.matchId } });
        if (result?.data?.getMatch?.data) {
          setStateGetMatchData(result.data.getMatch.data, token, userInfo);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.getMatch?.data, fetchMatch, params.matchId]); // props, client

  useEffect(() => {
    /**
     * Socket real time connection
     * After joining to the room action button will be visiable
     */
    const userInfo = getCookie("user");
    const userToken = getCookie("token");

    if (!socket || !userInfo || !userToken) return;
    const parsedUser = JSON.parse(userInfo);
    if (!parsedUser.captainplayer || !teamA || !teamA.captain || !teamB || !teamB.captain || !currentRound) return;

    let userTeamId = null, myTeamProcess = EActionProcess.INITIATE, opTeamProcess: EActionProcess.INITIATE;
    if (parsedUser.captainplayer === teamA.captain._id) {
      userTeamId = teamA._id;
    } else if (parsedUser.captainplayer === teamB.captain._id) {
      userTeamId = teamB._id;
    } else {
      return;
    }

    // @ts-ignore
    socket.emit('join-room-from-client', { match: params.matchId, team: userTeamId, round: currentRound._id });

    // @ts-ignore 
    socket.on("leave-room-from-server", (data: IRoom) => {
      dispatch(setCurrentRoom(data));
    });

    // @ts-ignore 
    socket.on("round-change-accept-response", (data: IRoom) => {
      dispatch(setCurrentRoom(data));
    });

    // Listen to events
    // @ts-ignore
    socket.on('join-room-response', (data: IRoom) => {
      const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
      const extranctedData = { ...data };
      if (isTeamACaptain) {
        // @ts-ignore 
        myTeamProcess = extranctedData.teamAProcess; opTeamProcess = extranctedData.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = extranctedData.teamBProcess; opTeamProcess = extranctedData.teamAProcess;
      }
      if (opTeamProcess === EActionProcess.LINEUP.toString()) {
        if (isTeamACaptain) {
          extranctedData.teamAProcess = EActionProcess.CHECKIN
        } else {
          extranctedData.teamBProcess = EActionProcess.CHECKIN
        }

      }
      // @ts-ignore
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(extranctedData));
    });
    // @ts-ignore
    socket.on('check-in-response', (data: IRoom) => {
      if (user?.info?.captainplayer === teamA?.captain?._id) {
        // @ts-ignore 
        myTeamProcess = data.teamAProcess; opTeamProcess = data.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = data.teamBProcess; opTeamProcess = data.teamAProcess;
      }
      // @ts-ignore
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(data));
    });

    // @ts-ignore
    socket.on('submit-lineup-response', (data: IRoomNets) => {
      if (user?.info?.captainplayer === teamA?.captain?._id) {
        // @ts-ignore 
        myTeamProcess = data.teamAProcess; opTeamProcess = data.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = data.teamBProcess; opTeamProcess = data.teamAProcess;
      }
      // Set current nets of the rounds 
      dispatch(updateMultiNetsPlayers(data.nets));
      // @ts-ignore
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(data));
    });

    // @ts-ignore
    socket.on("update-points-response", (data: IUpdateScoreResponse) => {
      // Set nets
      // set current round nets
      const netsOfRound = [...currRoundNets];
      const newAllNets = [...allNets];

      for (let i = 0; i < data.nets.length; i += 1) {
        const findNetIndex = allNets.findIndex((n) => n._id === data.nets[i]._id);
        const findRoundNetIndex = netsOfRound.findIndex((n) => n._id === data.nets[i]._id);

        if (findNetIndex !== -1) {
          newAllNets[findNetIndex] = { ...newAllNets[findNetIndex], teamAScore: data.nets[i].teamAScore, teamBScore: data.nets[i].teamBScore };
        }

        if (findRoundNetIndex !== -1) {
          netsOfRound[findRoundNetIndex] = { ...netsOfRound[findRoundNetIndex], teamAScore: data.nets[i].teamAScore, teamBScore: data.nets[i].teamBScore }
        }
      }

      dispatch(setNets(newAllNets));
      dispatch(setCurrentRoundNets(netsOfRound));
      // update round
      const findRound = roundList.find((r) => r._id === data.round._id);
      if (findRound) {
        const updatedRound = { ...findRound, teamAScore: data.round.teamAScore, teamBScore: data.round.teamBScore };
        const newRoundList = [updatedRound, ...roundList.filter(r => r._id !== data.round._id)];
        dispatch(setRoundList(newRoundList));
        if (findRound._id === currentRound._id) {
          dispatch(setCurrentRound(updatedRound));
        }
      }
    });


    // @ts-ignore
    socket.on('round-change-response', (data: IRoom) => {
      const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
      const extranctedData = { ...data };
      if (isTeamACaptain) {
        // @ts-ignore 
        myTeamProcess = extranctedData.teamAProcess; opTeamProcess = extranctedData.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = extranctedData.teamBProcess; opTeamProcess = extranctedData.teamAProcess;
      }
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setSubmittedLineup(false));
      dispatch(setCurrentRoom(extranctedData));
    });

    // @ts-ignore 
    socket.on("round-change-accept-response", (data: IRoom) => {
      // Check submitted all users or not

      let submitted = true;
      let i = 0;
      while (i < currRoundNets.length) {
        if (myTeamE === ETeam.teamA) {
          if (!currRoundNets[i].teamAPlayerA) submitted = false;
          if (!currRoundNets[i].teamAPlayerB) submitted = false;
        } else {
          if (!currRoundNets[i].teamBPlayerA) submitted = false;
          if (!currRoundNets[i].teamBPlayerB) submitted = false;
        }
        i += 1;
      }
      // dispatch(setSubmittedLineup(submitted));
      dispatch(setCurrentRoom(data));
    });

  }, [socket, user, teamA, teamB]);


  const onResize = useCallback((target: HTMLDivElement, entry: ResizeObserverEntry) => {
    dispatch(setScreenSize(entry.contentRect.width));
  }, []);

  const mainEl = useResizeObserver(onResize);

  if (loading) return <Loader />;


  // Renders
  const renderTeams = (): React.ReactNode => {
    return (<>
      <TeamPlayers teamPlayers={opPlayers} team={opTeamE} />
      {currentRound && <NetScoreOfRound currRoundId={currentRound._id} />}

      {opTeamProcess && <RoundRunner handleAction={handleActionRunner} team={myTeam} teamE={myTeamE} setActErr={setActErr} updatePoints={handleUpdatePoints} />}
      {eventSponsors.length > 0 && !user && (
        <div className="sponsors w-full mt-2 container px-4 mx-auto mb-2">
          <h3>Sponsors</h3>
          <div className="flex items-center justify-between flex-wrap w-full">
            {eventSponsors.map((spon) => <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />)}
          </div>
        </div>
      )}
      <TeamPlayers teamPlayers={myPlayers} team={myTeamE} />
    </>);
  }



  return (
    <>
      <Head>
        <title>Spike Ball</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Suspense fallback={<Loader />}>
        <div className="h-full relative bg-gray-100 text-gray-800" ref={mainEl}>
          {error && <Message error={error} />}
          {actErr && <Message error={actErr} />}
          {user && user.info ? (<>
            {renderTeams()}
            {/* <div className='controls px-4 flex justify-center mt-4 w-full'>
              <button className='btn-secondary capitalize' type="button" onClick={handleNetUpdate}>Update</button>
            </div> */}
            <div className="controls px-4 flex justify-center mt-4 gap-2">
              {currentRound?.num !== 1 && (
                <button className='btn-secondary capitalize flex justify-between items-center' type="button" onClick={(e) => handleChangeRound(e, false)}>
                  <img src="/icons/right-arrow.svg" alt="" className="w-6 h-6 object-center object-cover svg-white" style={{ transform: 'scaleX(-1)' }} />
                  Prev round
                </button>
              )}
              {(currentRound?.teamAScore && currentRound.teamAScore !== 0 && currentRound?.teamBScore && currentRound?.teamBScore !== 0) && currentRound.num < roundList.length && (
                <button className='btn-secondary capitalize flex justify-between items-center' type="button" onClick={(e) => handleChangeRound(e, true)}>Next round
                  <img src="/icons/right-arrow.svg" alt="" className="w-6 h-6 object-center object-cover svg-white" />
                </button>
              )}
            </div>
          </>) : (<>
            {/* Public Version Start ============================================> */}
            <TeamPlayers teamPlayers={opPlayers} team={opTeamE} />

            {/* Net  */}
            {currentRound && <NetScoreOfRound currRoundId={currentRound._id} />}

            {myTeamProcess && <RoundRunner handleAction={handleActionRunner} team={myTeam} teamE={opTeamE} setActErr={setActErr} updatePoints={handleUpdatePoints} />}
            <div className="sponsors w-full mt-2 container px-4 mx-auto mb-2">
              <h3>Sponsors</h3>
              <div className="flex items-center justify-between flex-wrap w-full">
                {eventSponsors.map((spon) => <AdvancedImage key={spon._id} className="w-20" cldImg={cld.image(spon.logo)} />)}
              </div>
            </div>
            {/* My Players  */}
            <TeamPlayers teamPlayers={myPlayers} team={myTeamE} />
            {/* Public Version End ============================================> */}
          </>)}
        </div>
      </Suspense>
    </>
  );
}

export default MatchPage;
