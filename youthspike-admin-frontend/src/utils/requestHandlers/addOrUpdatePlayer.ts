import { CREATE_PLAYER_RAW, UPDATE_PLAYER_RAW } from "@/graphql/players";
import { IError, ITeamAdd } from "@/types";
import { IPlayer, IPlayerAdd, IPlayerExpRel } from "@/types/player";
import { getCookie } from "../cookie";
import { BACKEND_URL } from "../keys";
import { MutationFunction } from "@apollo/client";
import { Router } from "next/router";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { getTeamFromStore } from "../localStorage";
import { handleResponse } from "../handleError";

interface IAddOrUpdatePlayer {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    playerState: IPlayerAdd;
    division?: string;
    eventId: string | null;
    uploadedProfile: React.RefObject<File | null>;
    playerUpdate: Partial<IPlayerAdd>;
    prevPlayer?: IPlayer | null;
    updatePlayer: MutationFunction;
    addPlayer: MutationFunction;
    setPlayerState: React.Dispatch<React.SetStateAction<IPlayerAdd>>;
    initialPlayerAdd: IPlayerAdd;
    setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
    router: AppRouterInstance;
    e: React.SyntheticEvent;
    playerAddCB?: (playerData: IPlayerExpRel) => void;
    playerUpdateCB?: (playerData: IPlayerExpRel) => void;
    update?: boolean;
    refetchFunc?: () => Promise<void>;
}

async function addOrUpdatePlayer({ setIsLoading, setActErr, playerState, division, eventId, uploadedProfile, playerUpdate,
    prevPlayer, updatePlayer, addPlayer, playerAddCB, setPlayerState, initialPlayerAdd, setAddPlayer, playerUpdateCB, router, e, update, refetchFunc }: IAddOrUpdatePlayer) {
    const teamExist = getTeamFromStore();
    let success = true;
    try {
        setIsLoading(true);
        const playerAddObj = structuredClone(playerState);
        if (division === '' && !update) return setActErr({ success: false, message: "You must select a division!" })
        if (division) playerAddObj.division = division;
        // @ts-ignore
        if (playerAddObj.rank) playerAddObj.rank = parseInt(playerAddObj.rank, 10);
        // @ts-ignore
        playerAddObj.event = eventId;

        let playerRes = null;
        if (uploadedProfile && uploadedProfile.current) {
            const formData = new FormData();
            const mutationVariables = {
                input: update ? { ...playerUpdate } : playerAddObj,
                profile: null
            };
            // @ts-ignore
            if (update) mutationVariables.playerId = prevPlayer?._id;
            formData.set('operations', JSON.stringify({
                query: update ? UPDATE_PLAYER_RAW : CREATE_PLAYER_RAW,
                variables: mutationVariables,
            }));

            formData.set('map', JSON.stringify({ '0': ['variables.profile'] }));
            formData.set('0', uploadedProfile.current);

            const token = getCookie('token');
            const response = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            playerRes = await response.json();

        } else {
            if (update && prevPlayer?._id) {
                playerRes = await updatePlayer({ variables: { input: playerUpdate, playerId: prevPlayer._id } });
            } else {
                playerRes = await addPlayer({ variables: { input: playerAddObj } });
            }
        }

        success = handleResponse({ response: !update ? playerRes?.data?.createPlayer : playerRes?.data?.updatePlayer, setActErr });
        if (!success) return;

        if (!update && playerRes?.data?.createPlayer?.data) {
            if (playerAddCB) playerAddCB(playerRes.data.createPlayer.data);
            if (teamExist) return router.push(`/${eventId}/teams/${teamExist}`);
        } else {
            if (playerRes?.data?.updatePlayer?.data) {
                if (playerUpdateCB) playerUpdateCB(playerRes?.data?.updatePlayer?.data);
            }
        }

        if (playerRes && playerRes.data?.createPlayer?.code === 201 || playerRes.data?.updatePlayer?.code === 202) {
            if (!update) {
                setPlayerState(initialPlayerAdd);
                const formEl = e.target as HTMLFormElement;
                formEl.reset();
            }
        } else {
            setActErr({ success: false, message: playerRes.data.createPlayer.message });
        }
        if (setAddPlayer && !update) setAddPlayer(false);
        if (refetchFunc) await refetchFunc();
    } catch (error) {
        console.log(error);
    } finally {
        setIsLoading(false);
        if (update && success) {
            if (teamExist) {
                router.push(`/${eventId}/teams/${teamExist}`);
            } else {
                router.push(`/${eventId}/players`);
            }
        }
    }
}

export default addOrUpdatePlayer;