import { IRoundRelatives, ITeam } from "@/types";
import { EActionProcess } from "@/types/room";
import { Socket } from "socket.io-client";

interface IJoinTheRoomProps{
    socket: Socket | null;
    userInfo: string | null;
    userToken: string | null;
    teamA?: ITeam | null;
    teamB?: ITeam | null;
    currRound: IRoundRelatives | null;
    matchId: string;
}

function joinTheRoom({socket, userInfo, userToken, teamA, teamB, currRound, matchId}: IJoinTheRoomProps) {
    if (!socket || !userInfo || !userToken) return;
    const parsedUser = JSON.parse(userInfo);
    if (!parsedUser.captainplayer || !teamA || !teamA.captain || !teamB || !teamB.captain || !currRound) return;

    let userTeamId = null;
    if (parsedUser.captainplayer === teamA.captain._id) {
        userTeamId = teamA._id;
    } else if (parsedUser.captainplayer === teamB.captain._id) {
        userTeamId = teamB._id;
    } else {
        return;
    }
    socket.emit('join-room-from-client', { match: matchId, team: userTeamId, round: currRound._id });
}

export {joinTheRoom};