import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { IPlayer } from '@/types';
import { ETeam } from '@/types/team';
import { checkInToLineup } from '@/utils/match/emitSocketEvents';
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
    const {teamAPlayers, teamBPlayers} = useAppSelector((state)=> state.players);


    const handleCloseLineup = (e: React.SyntheticEvent) => {
        e.preventDefault();
        dispatch(setVerifyLineup(false));
    }
    
    const handlePlayerSubmit=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        checkInToLineup({ socket, user, teamA, currRoom, currRound, currRoundNets: currentRoundNets, roundList, dispatch, myTeamE });
    }

    const IdToPlayer=(playerId: string | null | undefined, teamPlayerList: IPlayer[])=>{
        if(!playerId) return '';
        const findPlayer = teamPlayerList.find((p)=> p._id === playerId);
        return findPlayer ? findPlayer.firstName + " " + findPlayer.lastName : '';
    }
    return (
        <div className='absolute left-0 top-0 w-full bg-gray-100 text-gray-900 z-20 overflow-y-scroll' style={{height: "50rem"}}>
            <img src='/icons/close.svg' className='svg-black w-8 h-8 mb-4' role="presentation" onClick={handleCloseLineup} />
            <h3 className='mb-4'>Assigned Nets</h3>
            {currentRoundNets && currentRoundNets.length > 0 && currentRoundNets.map((crn) => (myTeamE === ETeam.teamA
                ? (<div className="net-box mb-4" key={crn._id}>
                    <h4>Net {crn.num}</h4>
                    <p>{IdToPlayer(crn.teamAPlayerA, teamAPlayers)}</p>
                    <p>{IdToPlayer(crn.teamAPlayerB, teamAPlayers)}</p>
                </div>)
                : (<div className="net-box mb-4" key={crn._id} >
                    <h4>Net {crn.num}</h4>
                    <p>{IdToPlayer(crn.teamBPlayerA, teamBPlayers)}</p>
                    <p>{IdToPlayer(crn.teamBPlayerB, teamBPlayers)}</p>
                </div>)
            ))}

            <button type="button" className='btn-secondary mb-4' onClick={handlePlayerSubmit}>Submit</button>
        </div>
    )
}

export default VerifyLineup