import { IMessage, TDeleteEventMutationFunction } from "@/types";
import { handleApiResult } from "../handleError";
import routerService from "@/lib/router-service";
import { ApolloClient } from "@apollo/client";
import SessionStorageService from "../SessionStorageService";
import { DIVISION } from "../constant";
import { removeTeamFromStore } from "../localStorage";

interface IDeleteEvent {
    eventId: string;
    apolloClient: ApolloClient;
    setMessage: (message: Omit<IMessage, "id">) => void;
    deleteEventMutation: TDeleteEventMutationFunction;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

async function deleteEvent({ setIsLoading, eventId, apolloClient, setMessage, deleteEventMutation }: IDeleteEvent) {

    try {
        setIsLoading(true);

        const response = await deleteEventMutation({
            variables: { eventId },
        });

        if (!response.data?.deleteEvent.success) {
            setMessage({ message: response.data?.deleteEvent?.message, type: "error" });
            return;
        }

        // 🔴 GraphQL errors (Apollo)
        if (response.error) {
            console.error(response.error);

            throw new Error(response.error?.message);
        }


        const responseData = response.data?.deleteEvent;


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


        // Cache event update
        if (responseData?.success) {

            apolloClient.cache.modify({
                fields: {
                    getEvents(existing, { readField }) {

                        if (!existing) return existing;

                        const existingData =
                            readField<{ __ref: string }[]>("data", existing) ?? [];

                        const filteredData = existingData.filter((eventRef) => {
                            const id = readField("_id", eventRef);
                            return id !== eventId;
                        });

                        return {
                            ...existing,
                            data: filteredData,
                        };
                    },
                },
            });

            // 🧹 Optional but recommended: remove event from normalized cache
            apolloClient.cache.evict({
                id: apolloClient.cache.identify({
                    __typename: "Event",
                    _id: eventId,
                }),
            });

            apolloClient.cache.gc();
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
    finally {
        setIsLoading(false);
    }


}


export default deleteEvent;