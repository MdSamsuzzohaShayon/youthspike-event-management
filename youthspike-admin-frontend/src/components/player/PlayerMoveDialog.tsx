import React, {
  useMemo,
  useState,
} from 'react';
import Image from 'next/image';

import SelectInput from '../elements/forms/SelectInput';

import { imgSize } from '@/utils/style';
import { handleError } from '@/utils/handleError';
import { handleResponseCheck } from '@/utils/request-handlers/playerHelpers';

import {
  IMessage,
  IOption,
  IPlayerRank,
  ITeam,
  TPlayerMutationFunction,
} from '@/types';



interface UpdatePlayerVariables {
  input: {
    prevTeamId?: string | null;
    newTeamId?: string | null;
  };
  playerId: string;
}



interface PlayerMoveDialogProps {
  dialogMoveEl: React.RefObject<HTMLDialogElement | null>;
  player: IPlayerRank;
  divisionList: IOption[];
  teamList: ITeam[];
  teamId: string | null;

  mutatePlayer: TPlayerMutationFunction;

  setActionOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  setMessage: (
    message: Omit<IMessage, 'id'>,
  ) => void;

  setMovePlayer: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

function PlayerMoveDialog({
  dialogMoveEl,
  player,
  divisionList,
  teamList,
  teamId,
  mutatePlayer,
  setActionOpen,
  setMessage,
  setMovePlayer,
}: PlayerMoveDialogProps) {
  const [selectedDivision, setSelectedDivision] =
    useState('');

  const [selectedTeamId, setSelectedTeamId] =
    useState('');

  /**
   * Fast O(1) lookup by team id
   */
  const teamMap = useMemo(
    () =>
      new Map(
        teamList.map((team) => [team._id, team]),
      ),
    [teamList],
  );

  /**
   * Team dropdown options
   */
  const availableTeams = useMemo(() => {
    const normalizedDivision =
      selectedDivision.trim().toLowerCase();

    return teamList
      .filter((team) => {
        if (team._id === teamId) {
          return false;
        }

        if (!normalizedDivision) {
          return true;
        }

        return (
          team.division.trim().toLowerCase() ===
          normalizedDivision
        );
      })
      .map((team, index) => ({
        id: index + 1,
        text: team.name,
        value: team._id,
      }))
      .sort((a, b) =>
        (a.text ?? '').localeCompare(
          b.text ?? '',
        ),
      );
  }, [selectedDivision, teamId, teamList]);

  const closeDialog = () => {
    setMovePlayer(false);
    dialogMoveEl.current?.close();
  };

  const handleDivisionChange = (
    event: React.SyntheticEvent,
  ) => {
    const inputEl = event.target as HTMLSelectElement;
    setSelectedDivision(inputEl.value);
    setSelectedTeamId('');
  };

  const handleTeamChange = (
    event: React.SyntheticEvent,
  ) => {
    const inputEl = event.target as HTMLSelectElement;
    setSelectedTeamId(inputEl.value);
  };

  const handleMovePlayer = async (
    event: React.SyntheticEvent,
  ) => {
    event.preventDefault();

    try {
      const mutationInput: UpdatePlayerVariables['input'] =
        {
          prevTeamId: teamId,
        };

      if (
        selectedTeamId &&
        teamMap.has(selectedTeamId)
      ) {
        mutationInput.newTeamId =
          selectedTeamId;
      }

      const response = await mutatePlayer({
        variables: {
          playerId: player._id,
          input: mutationInput,
        },
      });

      // temp
      // const isSuccessful =
      //   await handleResponseCheck(
      //     response.data.updatePlayer,
      //     setMessage,
      //   );

      // if (!isSuccessful) {
      //   return;
      // }

      setActionOpen(false);
      closeDialog();
    } catch (error: unknown) {
      handleError({
        error,
        setMessage,
      });
    }
  };

  const currentTeamName =
    player.teams?.length
      ? teamMap.get(String(player.teams[0]))?.name
      : 'No Team';

  return (
    <dialog
      ref={dialogMoveEl}
      className="modal-dialog"
    >
      <div className="relative w-full rounded-xl bg-gray-900 p-6">
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 transition hover:text-gray-200"
          aria-label="close"
          onClick={closeDialog}
        >
          <Image
            width={imgSize.logo}
            height={imgSize.logo}
            src="/icons/close.svg"
            alt="Close"
            className="svg-white h-6 w-6"
          />
        </button>

        <div className="mb-4 border-b pb-4 text-center">
          <h2 className="text-xl font-semibold text-gray-100">
            {player.firstName} {player.lastName}
          </h2>

          <p className="text-sm text-gray-400">
            {player.username}
          </p>

          <p className="text-sm text-gray-400">
            {currentTeamName}
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={handleMovePlayer}
        >
          <SelectInput
            name="division"
            optionList={divisionList}
            handleSelect={handleDivisionChange}
          />

          <SelectInput
            name="team"
            optionList={availableTeams}
            handleSelect={handleTeamChange}
          />

          <button
            type="submit"
            className="btn-info w-full"
          >
            Move Player
          </button>
        </form>
      </div>
    </dialog>
  );
}

export default PlayerMoveDialog;