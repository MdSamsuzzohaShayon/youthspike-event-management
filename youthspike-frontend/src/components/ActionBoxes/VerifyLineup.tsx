import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { INetRelatives, IPlayer } from '@/types';
import { ETeam } from '@/types/team';
import { checkInToLineup } from '@/utils/match/emitSocketEvents';
import { border } from '@/utils/styles';
import React from 'react'

function VerifyLineup() {
    const socket = useSocket();
    const user = useUser();
    const dispatch = useAppDispatch();

    const { teamA } = useAppSelector((state) => state.teams);
    const { myTeamE, verifyLineup } = useAppSelector((state) => state.matches);
    const { currentRoundNets } = useAppSelector((state) => state.nets);
    const { current: currRound, roundList } = useAppSelector((state) => state.rounds);
    const currRoom = useAppSelector((state) => state.rooms.current);
    const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);


    const handleCloseLineup = (e: React.SyntheticEvent) => {
        e.preventDefault();
        dispatch(setVerifyLineup(false));
    }

    const handlePlayerSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        checkInToLineup({ socket, user, teamA, currRoom, currRound, currRoundNets: currentRoundNets, roundList, dispatch, myTeamE });
    }

    const IdToPlayer = (playerId: string | null | undefined, teamPlayerList: IPlayer[]): IPlayer | null | undefined => {
        if (!playerId) return null;
        const findPlayer = teamPlayerList.find((p) => p._id === playerId);
        return findPlayer;
    }

    const netBox = (crn: INetRelatives, teamPlayerList: IPlayer[]): React.ReactNode => {
        const playerA = myTeamE === ETeam.teamA ? IdToPlayer(crn.teamAPlayerA, teamPlayerList) : IdToPlayer(crn.teamBPlayerA, teamPlayerList);
        const playerB = myTeamE === ETeam.teamA ? IdToPlayer(crn.teamAPlayerB, teamPlayerList) : IdToPlayer(crn.teamBPlayerB, teamPlayerList);

        
        return (<div className="net-box mb-4 flex justify-center items-center" key={crn._id}>
            <div className={`w-full border ${border.light}`}>
                <h4>Net {crn.num}</h4>
                <div className={`w-full flex justify-between items-center border-t ${border.light}`}>
                    <div className="players w-4/6 p-1 text-start">
                        <p >{playerA ? playerA.firstName + ' ' + playerA.lastName : ''} <span className='float-right'>{playerA?.rank}</span></p>
                        <p>{playerB ? playerB.firstName + ' ' + playerB.lastName : ''} <span className='float-right'>{playerB?.rank}</span></p>
                    </div>
                    <div className={`pair-score w-2/6 p-1 border-l ${border.light}`}>
                        <p>Pair Score</p>
                        <p>{ playerA && playerB && playerA.rank && playerB.rank && playerA?.rank + playerB?.rank}</p>
                    </div>
                </div>
            </div>
        </div>)
    }
    return (
        <div className='w-full bg-gray-100 text-gray-900 z-20 overflow-y-scroll' style={{ height: "50rem" }}>
            <div className='container p-4 mx-auto '>
            <img src='/icons/close.svg' className='svg-black w-8 h-8 mb-4' role="presentation" onClick={handleCloseLineup} />
            <h3 className='mb-4'>Assigned Nets</h3>
            {currentRoundNets && currentRoundNets.length > 0 && currentRoundNets.map((crn) => (myTeamE === ETeam.teamA
                ? netBox(crn, teamAPlayers) : netBox(crn, teamBPlayers)
            ))}

            <button type="button" className='btn-secondary mb-4' onClick={handlePlayerSubmit}>Submit</button>
            </div>
        </div>
    )
}

export default VerifyLineup;