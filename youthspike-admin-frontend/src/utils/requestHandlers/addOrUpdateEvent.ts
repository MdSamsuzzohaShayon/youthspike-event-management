import { ADD_EVENT_RAW, UPDATE_EVENT_RAW } from "@/graphql/event";
import { IError, IEventAdd, IEventSponsorAdd } from "@/types";
import React from "react";
import { getCookie } from "../cookie";
import { APP_NAME, BACKEND_URL } from "../keys";
import { IUserContext, UserRole } from "@/types/user";
import { MutationFunction } from "@apollo/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { createNewEvent } from "../emitSocketEvent";
import { Socket } from "socket.io-client";

interface IAddOrUpdateProps {
    e: React.SyntheticEvent;
    update: boolean;
    eventId: string | null;
    directorId: string | null;
    setEventState: React.Dispatch<React.SetStateAction<IEventAdd>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    eventState: IEventAdd;
    updateEvent: Partial<IEventAdd>;
    sponsorImgList: IEventSponsorAdd[];
    eventLogo: React.RefObject<null | MediaSource | Blob>;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    eventUpdate: MutationFunction;
    eventAdd: MutationFunction;
    user: IUserContext;
    router: AppRouterInstance;
    initialEvent: IEventAdd;
    socket: Socket | null;

}


interface IMutationVariables {
    sponsorsInput: IEventSponsorAdd[];
    logo: null | string;
    updateInput?: Partial<IEventAdd>;
    input?: IEventAdd;
}

/**
 * Add event mutation
 */
async function addOrUpdateEvent({
    e,
    update, eventId, directorId, setEventState, setIsLoading, eventState,
    updateEvent, sponsorImgList, eventLogo, setActErr, eventUpdate,
    eventAdd, user, router, initialEvent, socket }: IAddOrUpdateProps) {

    setIsLoading(true);
    let newEventId = null;
    const inputData = update ? { ...updateEvent } : { ...eventState };
    inputData.ldo = directorId ? directorId : 'auto_detect_from_server';
    if (inputData.startDate) inputData.startDate = new Date(inputData.startDate).toISOString()
    if (inputData.endDate) inputData.endDate = new Date(inputData.endDate).toISOString()

    const mutationVariables: IMutationVariables = {
        sponsorsInput: [],
        logo: null, // This is event logo
    };
    if (update) {
        mutationVariables.updateInput = inputData;
    } else {
        // @ts-ignore
        mutationVariables.input = inputData
    }
    // @ts-ignore
    if (update && eventId) mutationVariables.eventId = eventId;

    try {

        let sponsorFileList: IEventSponsorAdd[] = [];
        const sponsorStringList: IEventSponsorAdd[] = [];
        sponsorImgList.forEach((sponsor) => {
            if (typeof sponsor.logo === "string") {
                sponsorStringList.push(sponsor);
            } else {
                sponsorFileList.push(sponsor);
            }
        });

        if(sponsorFileList.length === 1 && sponsorFileList[0].company === APP_NAME) sponsorFileList = [];

        // @ts-ignore
        if (update && sponsorStringList.length > 0) mutationVariables.sponsorsStringInput = sponsorStringList;

        if ((sponsorFileList.length > 0) || eventLogo.current ) {

            // Use FormData with fetch if there is a file to upload on the server
            const formData = new FormData();

            const sponsorsInputList = [];
            for (let i = 0; i < sponsorFileList.length; i += 1) {
                sponsorsInputList.push({ company: sponsorFileList[i].company, logo: null });
            }
            // @ts-ignore
            mutationVariables.sponsorsInput = sponsorsInputList;

            formData.set('operations', JSON.stringify({
                query: update ? UPDATE_EVENT_RAW : ADD_EVENT_RAW,
                variables: mutationVariables,
            }));

            // Sponsors
            const mapObj: any = {};
            for (let i = 0; i < sponsorFileList.length; i += 1) {
                mapObj[i.toString()] = [`variables.sponsorsInput.${i}.logo`];
            }

            // formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
            // formData.set('0', uploadedLogo.current);

            if (eventLogo && eventLogo.current) {
                mapObj[sponsorFileList.length] = [`variables.logo`];
            }
            formData.set("map", JSON.stringify(mapObj));
            for (let i = 0; i < sponsorFileList.length; i += 1) {
                if (sponsorFileList[i].logo && sponsorFileList[i].logo instanceof File && sponsorFileList[i].company && sponsorFileList[i].company !== "") {
                    const uploadedFile = sponsorFileList[i].logo as File;
                    formData.set(`${i}`, uploadedFile);
                }
            }

            // Add the event logo to formData
            if (eventLogo && eventLogo.current) {
                formData.set(`${sponsorFileList.length}`, eventLogo.current);
            }

            const token = getCookie('token');
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                body: formData,
                headers: { 'Authorization': `Bearer ${token}` },
            });


            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();
            const eventRes = update ? responseData?.data?.updateEvent : responseData?.data?.createEvent;
            if (eventRes?.code !== 201 && eventRes?.code !== 202) {
                setActErr({
                    code: eventRes?.code,
                    message: eventRes?.message,
                    success: false
                });
            } else {
                newEventId = eventRes?.data?._id;
            }
        } else {
            // Use Apollo Client mutation
            if (!mutationVariables.sponsorsInput) mutationVariables.sponsorsInput = [];
            let eventRes = null;
            const mutationInput = { ...mutationVariables.input };
            if (mutationInput.logo) delete mutationInput.logo;
            mutationVariables.input = mutationInput;
            if (update) {
                eventRes = await eventUpdate({ variables: mutationVariables });
            } else {
                eventRes = await eventAdd({ variables: mutationVariables });
            }
            // Define the variables you want to use
            // const variables = { eventId: params.eventId };


            eventRes = update ? eventRes.data?.updateEvent : eventRes.data?.createEvent;
            if (eventRes?.code !== 201 && eventRes?.code !== 202) {
                setActErr({ code: eventRes.code, message: eventRes.message, success: false })
            } else {
                newEventId = eventRes.data._id
            }

        }


        // Reset form and navigate
        setEventState(initialEvent);
        const formEl = e.target as HTMLFormElement;
        formEl.reset();

        if (newEventId) {
            createNewEvent({socket, eventId: newEventId})
            let redirectUrl = `/${newEventId}`;
            if (user.info?.role === UserRole.admin) {
                redirectUrl += `/?ldoId=${directorId}`;
            }
            router.push(redirectUrl);
        };
    } catch (error) {
        setActErr({ message: error?.message || '', success: false });
    } finally {
        setIsLoading(false);
    }
};


export default addOrUpdateEvent;