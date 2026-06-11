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
  IGetTeamRosterResponse,
  IMessage,
  IOption,
  IPlayer,
  IPlayerRank,
  IPlayerRankingItemExpRel,
  IResponse,
  ITeam,
  TPlayerMutationFunction,
  TUpdatePlayer,
} from '@/types';
import updatePlayer from '@/utils/request-handlers/updatePlayer';
import { useApolloClient } from '@apollo/client/react';
import { GET_TEAM_ROSTER } from '@/graphql/teams';


interface IPlayerMoveData{
  getTeamRoster: IGetTeamRosterResponse;
}



interface PlayerMoveDialogProps {
  dialogMoveRef: React.RefObject<HTMLDialogElement | null>;
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
  dialogMoveRef,
  player,
  divisionList,
  teamList,
  teamId,
  mutatePlayer,
  setActionOpen,
  setMessage,
  setMovePlayer,
}: PlayerMoveDialogProps) {
  // Hooks
  const apolloClient = useApolloClient();

  // State
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    dialogMoveRef.current?.close();
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
    e: React.SyntheticEvent,
  ) => {
    e.preventDefault();
    const mutationInput: Partial<TUpdatePlayer> =
    {
      prevTeamId: teamId || undefined,
    };

    if (
      selectedTeamId &&
      teamMap.has(selectedTeamId)
    ) {
      mutationInput.newTeamId =
        selectedTeamId;
    }

    updatePlayer({ setMessage, setIsLoading, playerUpdate: mutationInput, prevPlayer: player as IPlayer, uploadedProfile: null, mutatePlayer });

    /*
    // After moving player successfully
    // Update cache like this with writeFragment

    apolloClient.cache.updateQuery(
      {
        query: GET_TEAM_ROSTER,
        variables: {
          teamId,
        },
      },
      (data: IPlayerMoveData | null) => {
        if (!data) return data;

        return {
          ...data,
          getTeamRoster: {
            ...data.getTeamRoster,
            data: {
              ...data.getTeamRoster.data,

              // remove player
              players:
                data.getTeamRoster.data.players.filter(
                  (p: IPlayer) => p._id !== player._id,
                ),

              // remove ranking
              rankings:
                data.getTeamRoster.data.rankings.filter(
                  (r: IPlayerRankingItemExpRel) =>
                    r.player._id !== player._id,
                ),
            },
          },
        };
      },
    );

    dialogMoveRef.current?.close();

    */


    window.location.reload();
  };

  const currentTeamName =
    player.teams?.length
      ? teamMap.get(String(player.teams[0]))?.name
      : 'No Team';

  return (
    <dialog
      ref={dialogMoveRef}
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