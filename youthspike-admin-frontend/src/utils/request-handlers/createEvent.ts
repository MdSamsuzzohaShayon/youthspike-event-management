import { ADD_EVENT_RAW, EVENT_FRAGMENT } from '@/graphql/event';
import { ICreateEventResponse, IEventAdd, IEventSponsor, IMessage, IProStatsAdd } from '@/types';
import { APP_NAME, BACKEND_URL } from '../keys';
import { getCookie } from '../clientCookie';
import { useMutation } from '@apollo/client/react';
import { ApolloCache, ApolloClient } from '@apollo/client';
import { handleApiResult } from '../handleError';
import routerService from '@/lib/router-service';
import SessionStorageService from '../SessionStorageService';
import { DIVISION } from '../constant';
import { removeTeamFromStore } from '../localStorage';

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
    apolloClient: ApolloClient;
    eventState: IEventAdd;
    sponsors: Omit<IEventSponsor, '_id' | 'event'>[];
    eventLogo: Blob | null;
    directorId: string | null;
    multiplayer: IProStatsAdd;
    weight: IProStatsAdd;
    setMessage: (message: Omit<IMessage, "id">) => void;
    addEvent: TMutationFunction;
}

interface IAddEventVariables {
    input: Partial<IEventAdd>;
    sponsorsInput: Omit<IEventSponsor, '_id' | 'event'>[];
    logo: string | null;
    multiplayerInput: IProStatsAdd;
    weightInput: IProStatsAdd;
}

export async function createEvent({
    apolloClient,
    eventState,
    sponsors,
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

        const { sponsorsInput, sponsorFileList } = processSponsors(sponsors);

        const variables: IAddEventVariables = {
            input: inputData,
            sponsorsInput,
            logo: null,
            multiplayerInput: multiplayer,
            weightInput: weight,
        };
        if (sponsors.length > 0 || eventLogo) {
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


        // Cache update
        if (responseData?.data) {

            const newEvent = responseData.data;

            apolloClient.cache.modify({
                fields: {
                    getEvents(existing, { readField }) {

                        if (!existing) return existing;

                        const existingData =
                            readField<{ __ref: string }[]>("data", existing) ?? [];

                        // Prevent duplicates
                        const alreadyExists = existingData.some(
                            (ref) => readField("_id", ref) === newEvent._id,
                        );

                        if (alreadyExists) return existing;

                        const newRef = apolloClient.cache.writeFragment({
                            fragment: EVENT_FRAGMENT,
                            data: {
                                __typename: "Event",
                                ...newEvent,
                            },
                        });

                        return {
                            ...existing,
                            data: [newRef, ...existingData],
                        };
                    },
                },
            });

        }
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


        SessionStorageService.removeItem(DIVISION);
        removeTeamFromStore();
        await fetch('/api/logout', { method: 'GET' });
        routerService.push('/login');


        throw new Error(message);
    }




}


interface IProcessedSponsors{
    sponsorFileList: Omit<IEventSponsor, '_id' | 'event'>[];
    sponsorsInput: Omit<IEventSponsor, '_id' | 'event'>[];
}

function processSponsors(sponsorImgList: Omit<IEventSponsor, '_id' | 'event'>[]): IProcessedSponsors {
    const sponsorFileList: Omit<IEventSponsor, '_id' | 'event'>[] = [];
    const sponsorsInput: Omit<IEventSponsor, '_id' | 'event'>[] = [];

    for (const sponsor of sponsorImgList) {
        if (typeof sponsor.logo === 'string') {
            // Skip string logos (already uploaded)
            continue;
        }
        if (sponsor.company === APP_NAME) {
            // Skip default sponsor
            continue;
        }
        sponsorFileList.push(sponsor);
        // @ts-ignore
        sponsorsInput.push({ company: sponsor.company, logo: null });
    }

    return { sponsorsInput, sponsorFileList };
}

function createFileMap(sponsorFileList: Omit<IEventSponsor, '_id' | 'event'>[], hasEventLogo: boolean) {
    const mapObj: Record<string, string[]> = {};

    sponsorFileList.forEach((_, index) => {
        mapObj[index.toString()] = [`variables.sponsorsInput.${index}.logo`];
    });

    if (hasEventLogo) {
        mapObj[sponsorFileList.length] = ['variables.logo'];
    }

    return mapObj;
}

