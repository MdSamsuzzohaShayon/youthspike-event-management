import { ADD_EVENT_RAW, UPDATE_EVENT_RAW } from "@/graphql/event";
import { IError, IEventAdd, IEventSponsorAdd } from "@/types";
import React from "react";
import { getCookie } from "../cookie";
import { BACKEND_URL } from "../keys";
import { IUserContext, UserRole } from "@/types/user";
import { MutationFunction } from "@apollo/client";
import { NextRouter, Router } from "next/router";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

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
    sponsorInputEl:  React.RefObject<HTMLInputElement>;
    eventLogo: React.RefObject<null | File>;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    eventUpdate: MutationFunction;
    eventAdd: MutationFunction;
    user: IUserContext;
    router: AppRouterInstance;
    initialEvent: IEventAdd;

}

/**
 * Add event mutation
 */
async function addOrUpdateEvent({ 
    e, update, eventId, directorId, setEventState, setIsLoading, eventState, 
    updateEvent, sponsorImgList, sponsorInputEl, eventLogo, setActErr, eventUpdate, 
    eventAdd, user, router, initialEvent}: IAddOrUpdateProps) {
    e.preventDefault();

    setIsLoading(true);
    let newEventId = null;
    const inputData = update ? { ...updateEvent } : { ...eventState };
    inputData.ldo = directorId ? directorId : 'auto_detect_from_server';
    if (inputData.startDate) inputData.startDate = new Date(inputData.startDate).toISOString()
    if (inputData.endDate) inputData.endDate = new Date(inputData.endDate).toISOString()

    const mutationVariables = {
        sponsorsInput: [],
        input: inputData,
        logo: null, // This is event logo
    };
    // @ts-ignore
    if (update && eventId) mutationVariables.eventId = eventId;

    try {
        if ((sponsorImgList.length > 0 && sponsorInputEl.current && sponsorInputEl.current.value && sponsorInputEl.current?.value !== '') || eventLogo.current) {
            // Use FormData with fetch if there is a file to upload on the server
            const formData = new FormData();

            const sponsorsInputList = [];
            for (let i = 0; i < sponsorImgList.length; i += 1) {
                sponsorsInputList.push({ company: sponsorImgList[i].company, logo: null });
            }
            // @ts-ignore
            mutationVariables.sponsorsInput = sponsorsInputList;

            formData.set('operations', JSON.stringify({
                query: update ? UPDATE_EVENT_RAW : ADD_EVENT_RAW,
                variables: mutationVariables,
            }));

            // Sponsors
            const mapObj: any = {};
            for (let i = 0; i < sponsorImgList.length; i += 1) {
                mapObj[i.toString()] = [`variables.sponsorsInput.${i}.logo`];
            }
            if (eventLogo && eventLogo.current) {
                mapObj[sponsorImgList.length] = [`variables.logo`];
            }
            formData.set("map", JSON.stringify(mapObj));
            for (let i = 0; i < sponsorImgList.length; i += 1) {
                if (sponsorImgList[i].logo && sponsorImgList[i].logo instanceof File && sponsorImgList[i].company && sponsorImgList[i].company !== "") {
                    const uploadedFile = sponsorImgList[i].logo as File;
                    formData.set(`${i}`, uploadedFile);
                }
            }

            // Add the event logo to formData
            if (eventLogo && eventLogo.current) {
                formData.set(`${sponsorImgList.length}`, eventLogo.current);
                // @ts-ignore
                mutationVariables.logo = eventLogo.current;
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
                    name: eventRes?.code,
                    message: eventRes?.message,
                    main: responseData.data,
                });
            } else {
                newEventId = eventRes?.data?._id;
            }
        } else {
            // Use Apollo Client mutation
            if (!mutationVariables.sponsorsInput) mutationVariables.sponsorsInput = [];
            let eventRes = null;
            if (update) {
                eventRes = await eventUpdate({ variables: mutationVariables });
            } else {
                eventRes = await eventAdd({ variables: mutationVariables });
            }
            // Define the variables you want to use
            // const variables = { eventId: params.eventId };


            eventRes = update ? eventRes.data?.updateEvent : eventRes.data?.createEvent;
            if (eventRes?.code !== 201 && eventRes?.code !== 202) {
                setActErr({ name: eventRes.code, message: eventRes.message })
            } else {
                newEventId = eventRes.data._id
            }

        }


        // Reset form and navigate
        setEventState(initialEvent);
        const formEl = e.target as HTMLFormElement;
        formEl.reset();

        if (newEventId) {
            let redirectUrl = `/${newEventId}`;
            if (user.info?.role === UserRole.admin) {
                redirectUrl += `/?directorId=${directorId}`;
            }
            router.push(redirectUrl);
        };
    } catch (error) {
        // @ts-ignore
        setActErr({ name: 'Invalid Mutation', message: error.message || '', main: error });
    } finally {
        setIsLoading(false);
    }
};


export default addOrUpdateEvent;