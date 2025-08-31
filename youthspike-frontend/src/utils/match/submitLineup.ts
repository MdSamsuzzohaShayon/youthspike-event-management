import { setMessage } from '@/redux/slices/elementSlice';
import { setclosePSCAvailable, setVerifyLineup } from '@/redux/slices/matchesSlice';
import { EMessage, IMatchRelatives, INetRelatives, IPlayer, IRoom, IRoundRelatives } from '@/types';
import { EPlayerStatus } from '@/types/player';
import { ETeam } from '@/types/team';
import React from 'react';

interface ISubmitLineupProps {
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  currMatch: IMatchRelatives;
  currRoom: IRoom | null;
  myTeamE: ETeam;
  currentRoundNets: INetRelatives[];
  currRound: IRoundRelatives | null;
  myPlayers: IPlayer[];
  roundList: IRoundRelatives[];
  closePSCAvailable: boolean;
}

const submitLineup = ({ dispatch, currMatch, currRoom, myTeamE, currentRoundNets, currRound, myPlayers, roundList, closePSCAvailable }: ISubmitLineupProps) => {
  if (!currRoom) return;
  // ===== Make sure all nets are filled with players =====
  let filled = true;
  const selectedPlayerIds = [];
  for (let i = 0; i < currentRoundNets.length; i += 1) {
    if (myTeamE === ETeam.teamA) {
      if (!currentRoundNets[i].teamAPlayerA || !currentRoundNets[i].teamAPlayerB) {
        filled = false;
      } else {
        selectedPlayerIds.push(currentRoundNets[i].teamAPlayerA, currentRoundNets[i].teamAPlayerB);
      }
    } else if (!currentRoundNets[i].teamBPlayerA || !currentRoundNets[i].teamBPlayerB) {
      filled = false;
    } else {
      selectedPlayerIds.push(currentRoundNets[i].teamBPlayerA, currentRoundNets[i].teamBPlayerB);
    }
  }

  /**
   * Make sure did use previous subbed players
   * A player can be subbed only once in a match, exception below
   * A player is only allowd to sub when all other player had been subbed for atleast once
   */
  if (currRound?.num && currRound?.num > 1 && filled && !currMatch?.extendedOvertime) {
    const myPlayerIds = myPlayers.map((p) => p._id);
    const preSubbedPlayerIds: Set<string> = new Set<string>();
    const subbedPlayerIds: Set<string> = new Set<string>();
    roundList.forEach((rl: IRoundRelatives) => {
      if (rl.subs && rl.subs.length > 0) {
        rl.subs.forEach((rls) => {
          if (rls) preSubbedPlayerIds.add(rls); // This line will produce an error
        });
      }
    });

    // Subbed players of this round
    for (let j = 0; j < myPlayerIds.length; j += 1) {
      if (!selectedPlayerIds.includes(myPlayerIds[j])) subbedPlayerIds.add(myPlayerIds[j]);
    }

    // All player has not been subbed atleast for once
    if (subbedPlayerIds.size < myPlayerIds.length) {
      //   // Show error
      let errMsg = '';
      let dupPlayerCount = 0;
      subbedPlayerIds.forEach((up) => {
        if (preSubbedPlayerIds.has(up)) {
          const findPlayer = myPlayers.find((p) => p._id === up);
          if (findPlayer && findPlayer.status === EPlayerStatus.ACTIVE) {
            errMsg += `${findPlayer.firstName}, `;
            dupPlayerCount += 1;
          }
        }
      });
      if (dupPlayerCount > 0) {
        errMsg = dupPlayerCount > 1 ? errMsg : errMsg.split(',')[0];
        errMsg += `${dupPlayerCount > 1 ? 'were' : ' was'} subbed previously, they must be selected in this round`;
        dispatch(setMessage({ type: EMessage.ERROR, message: errMsg }));
        return;
      }
    }
  }

  if (closePSCAvailable) dispatch(setclosePSCAvailable(false));
  if (filled) {
    dispatch(setMessage(null));
    dispatch(setVerifyLineup(true));
  }
};

export default submitLineup;
