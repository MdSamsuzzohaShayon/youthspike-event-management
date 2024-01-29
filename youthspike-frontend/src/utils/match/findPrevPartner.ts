import { setPrevPartner } from "@/redux/slices/matchesSlice";
import { INetRelatives, IRoundRelatives } from "@/types";
import { ETeam } from "@/types/team";

interface IPrevPartnerProps{
    roundList: IRoundRelatives[];
    currRound: IRoundRelatives | null;
    allNets: INetRelatives[];
    myTeamE: ETeam;
    net?: INetRelatives | null | undefined;
}

function findPrevPartner({roundList, currRound, allNets, myTeamE, net}: IPrevPartnerProps): string | null{
    let prevPartnerId = null;
    const pri = roundList.findIndex((rl) => rl._id === currRound?._id); // pri = previous round index
    if (pri !== -1 && roundList[pri - 1]) {
      const prevRound = roundList[pri - 1];
      const prevRoundNets = allNets.filter((n) => n.round === prevRound._id);

      if (myTeamE === ETeam.teamA) {
        if (net?.teamAPlayerA) {
          const prevPlayedNet = prevRoundNets.find((prn) => prn.teamAPlayerA === net.teamAPlayerA || prn.teamAPlayerA === net.teamAPlayerA);
          if (prevPlayedNet && prevPlayedNet.teamAPlayerA === net?.teamAPlayerA) {
            prevPartnerId = prevPlayedNet.teamAPlayerB;
          } else if (prevPlayedNet && prevPlayedNet.teamAPlayerA === net?.teamAPlayerB) {
            prevPartnerId = prevPlayedNet.teamAPlayerA;
          }
        }
      } else {
        if (net?.teamBPlayerA) {
          const prevPlayedNet = prevRoundNets.find((prn) => prn.teamBPlayerA === net.teamBPlayerA || prn.teamBPlayerA === net.teamBPlayerA);
          if (prevPlayedNet && prevPlayedNet.teamBPlayerA === net?.teamBPlayerA) {
            prevPartnerId = prevPlayedNet.teamBPlayerB;
          } else if (prevPlayedNet && prevPlayedNet.teamBPlayerA === net?.teamBPlayerB) {
            prevPartnerId = prevPlayedNet.teamBPlayerA;
          }
        }
      }
    }    
    return prevPartnerId ? prevPartnerId : null;
}

export default findPrevPartner;