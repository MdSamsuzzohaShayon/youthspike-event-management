import { imgSize } from '@/utils/style';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import { IError, IOption, IPlayer, IPlayerRank, ITeam } from '@/types';
import { handleError, handleResponse } from '@/utils/handleError';

interface IPlayerMoveDialogProps {
  dialogMoveEl: React.RefObject<HTMLDialogElement | null>;
  player: IPlayerRank;
  divisionList: IOption[];
  teamList: ITeam[];
  teamId: string | null;
  mutatePlayer: any;
  refetchFunc?: () => void;
  setActionOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setMovePlayer: React.Dispatch<React.SetStateAction<boolean>>;
}

function PlayerMoveDialog({ dialogMoveEl, player, divisionList, teamList, teamId, mutatePlayer, refetchFunc, setActionOpen, setActErr, setMovePlayer }: IPlayerMoveDialogProps) {
  const [teamOptions, setTeamOptions] = useState<IOption[]>([]);
  const [newTeamId, setNewTeamId] = useState<null | string>(null);

  const handleTeamChange = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    setNewTeamId(inputEl.value);
  };

  const handleCloseMovePlayer = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setMovePlayer(false);
    dialogMoveEl.current?.close();
  };

  // ====== Change events ======
  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!teamList) return;
    const inputEl = e.target as HTMLSelectElement;
    const dl: IOption[] = [];

    for (let i = 0; i < teamList.length; i += 1) {
      if (teamList[i]._id !== teamId && teamList[i].division.trim().toLowerCase() === inputEl.value.trim().toLowerCase()) {
        dl.push({ id: i + 1, text: teamList[i].name, value: teamList[i]._id });
      }
    }

    // ✅ Sort alphabetically by team name
    dl.sort((a, b) => a.text!.localeCompare(b.text!));

    setTeamOptions(dl);
  };

  const handleMovePlayer = async (e: React.SyntheticEvent, playerId: string) => {
    e.preventDefault();
    try {
      const prevTeamId = teamId;
      const playerInputObj: { newTeamId?: string; team: string | null } = { team: teamId || null };
      if (prevTeamId && player?.teams && player?.teams.length > 0) {
        // const nti = player?.teams[0];
        const teamExist = teamList?.find((t) => t._id === newTeamId);
        if (teamExist) {
          playerInputObj.newTeamId = teamExist._id;
        }
      }
      const response = await mutatePlayer({
        variables: {
          input: playerInputObj,
          playerId,
        },
      });

      const success = await handleResponse({ response: response.data.updatePlayer, setActErr });
      if (!success) return;

      if (refetchFunc) await refetchFunc();
      setActionOpen(false);
      setMovePlayer(false);
      dialogMoveEl.current?.close();
    } catch (error: any) {
      handleError({ error, setActErr });
    }
  };

  const teamMap: Map<string, ITeam> = useMemo(() => {
    // `teamList?.map(...)` returns array of [key, value] pairs
    // Wrap it with `new Map()` to actually create a Map
    return new Map(teamList?.map((t) => [t._id, t]) ?? []);
  }, [teamList]);
  {
    /* Move player operation start  */
  }
  return (
    <dialog ref={dialogMoveEl} className="modal-dialog">
      <div className="relative p-6 bg-white dark:bg-gray-900 rounded-xl w-full">
        {/* Close Button */}
        <button type="button" className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition" aria-label="close" onClick={handleCloseMovePlayer}>
          <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" alt="Close" className="w-6 h-6 svg-white" />
        </button>

        {/* Player Details */}
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {player.firstName} {player.lastName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{player?.username}</p>
          {/* @ts-ignore  */}
          <p className="text-sm text-gray-500 dark:text-gray-400">{player.teams?.length ? teamMap.get(player.teams[0])?.name : 'No Team'}</p>
        </div>

        {/* Move Form */}
        <form className="space-y-4" onSubmit={(e) => handleMovePlayer(e, player._id)}>
          <SelectInput key="division-1" handleSelect={handleDivisionChange} name="division" optionList={divisionList || []} />
          <SelectInput key="division-2" handleSelect={(e) => handleTeamChange(e, player._id)} name="team" optionList={teamOptions} />

          <button className="btn-info w-full" type="submit">
            Move Player
          </button>
        </form>
      </div>
    </dialog>
  );
}

export default PlayerMoveDialog;
