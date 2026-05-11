import { ADD_EVENT_RAW } from '@/graphql/event';
import { ICreateEventResponse, IEventAdd, IEventSponsorAdd, IMessage, IProStatsAdd } from '@/types';
import { APP_NAME, BACKEND_URL } from '../keys';
import { getCookie } from '../clientCookie';
import { handleResponseCheck } from './playerHelpers';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';
import { handleApiResult } from '../handleError';

type TMutationFunction = useMutation.MutationFunction<
    {
        createEvent: ICreateEventResponse;
    },
    {
        [x: string]: any;
    },
    ApolloCache
>;

interface ICreateEventProps {
    eventState: IEventAdd;
    sponsorImgList: IEventSponsorAdd[];
    eventLogo: Blob | null;
    directorId: string | null;
    multiplayer: IProStatsAdd;
    weight: IProStatsAdd;
    setMessage: (message: Omit<IMessage, "id">) => void;
    addEvent: TMutationFunction;
}

interface IAddEventVariables {
    input: Partial<IEventAdd>;
    sponsorsInput: IEventSponsorAdd[];
    logo: string | null;
    multiplayerInput: IProStatsAdd;
    weightInput: IProStatsAdd;
}

export async function createEvent({
    eventState,
    sponsorImgList,
    eventLogo,
    directorId,
    multiplayer,
    weight,
    setMessage,
    addEvent,
}: ICreateEventProps) {
    try {
        let responseData: ICreateEventResponse | undefined;
        const inputData = { ...eventState };
        inputData.ldo = directorId || 'auto_detect_from_server';
        inputData.startDate = new Date(inputData.startDate).toISOString();
        inputData.endDate = new Date(inputData.endDate).toISOString();

        const { sponsorsInput, sponsorFileList } = processSponsors(sponsorImgList);

        const variables: IAddEventVariables = {
            input: inputData,
            sponsorsInput,
            logo: null,
            multiplayerInput: multiplayer,
            weightInput: weight,
        };
        if (sponsorImgList.length > 0 || eventLogo) {
            const formData = new FormData();

            formData.set(
                'operations',
                JSON.stringify({
                    query: ADD_EVENT_RAW,
                    variables,
                }),
            );

            const mapObj = createFileMap(sponsorFileList, !!eventLogo);
            formData.set('map', JSON.stringify(mapObj));

            let i = 0;
            for (const sponsorFile of sponsorFileList) {
                if (sponsorFile.logo instanceof File && sponsorFile.company) {
                    formData.set(`${i}`, sponsorFile.logo);
                }
                i += 1;
            }


            if (eventLogo) {
                formData.set(`${sponsorFileList.length}`, eventLogo);
            }

            const token = getCookie('token');
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                body: formData,
                headers: { Authorization: `Bearer ${token}`, 'apollo-require-preflight': 'true', },
            });


            // 🔴 Handle HTTP errors
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }

            const json = await response.json();

            // 🔴 Handle GraphQL errors
            if (json.errors?.length) {
                throw new Error(json.errors[0].message || 'GraphQL Error');
            }

            responseData = json.data?.createEvent;
        } else {
            const result = await addEvent({ variables });
            // 🔴 GraphQL errors (Apollo)
            if (result.error) {
                console.error(result.error);

                throw new Error(result.error?.message);
            }

            responseData = result.data?.createEvent;
        }


        // 🔴 No response safety
        if (!responseData) {
            throw new Error('No response received from server');
        }

        // ✅ Success handling
        const result = handleApiResult({ response: responseData });

        if (result?.code > 299) {
            throw new Error(result.message);
        }

        setMessage({
            type: 'success',
            message: result?.message || 'Player updated successfully',
        });
    } catch (error: unknown) {
        console.error(error);

        // 🧠 Smart error extraction
        let message = 'Something went wrong';

        if (error instanceof Error) {
            message = error.message;
        }

        setMessage({
            type: 'error',
            message,
        });

        await fetch('/api/logout', { method: 'GET' });


        throw new Error(message);
    }




}

function processSponsors(sponsorImgList: IEventSponsorAdd[]) {
    const sponsorFileList: IEventSponsorAdd[] = [];
    const sponsorsInput: IEventSponsorAdd[] = [];

    sponsorImgList.forEach((sponsor) => {
        if (typeof sponsor.logo === 'string') {
            // Skip string logos (already uploaded)
            return;
        }
        if (sponsor.company === APP_NAME) {
            // Skip default sponsor
            return;
        }
        sponsorFileList.push(sponsor);
        sponsorsInput.push({ company: sponsor.company, logo: null });
    });

    return { sponsorsInput, sponsorFileList };
}

function createFileMap(sponsorFileList: IEventSponsorAdd[], hasEventLogo: boolean) {
    const mapObj: Record<string, string[]> = {};

    sponsorFileList.forEach((_, index) => {
        mapObj[index.toString()] = [`variables.sponsorsInput.${index}.logo`];
    });

    if (hasEventLogo) {
        mapObj[sponsorFileList.length] = ['variables.logo'];
    }

    return mapObj;
}

