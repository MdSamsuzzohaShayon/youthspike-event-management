import { ADD_DIRECTOR_RAW, UPDATE_DIRECTOR_RAW } from "@/graphql/director";
import { IAddDirector, IError, ILDO, ILdoUpdate } from "@/types";
import React from "react";
import { BACKEND_URL } from "../keys";
import { IUserContext, UserRole } from "@/types/user";
import { MutationFunction } from "@apollo/client";
import { handleError } from "../handleError";
import { getCookie } from "../clientCookie";

interface IAddUpdateDirectorProps {
    directorUpdate: ILdoUpdate;
    update: boolean;
    directorState: IAddDirector;
    ldoState: ILDO;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    ldoUpdate: ILdoUpdate;
    uploadedLogo: React.RefObject<File | null>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    user: IUserContext;
    mutateUser: MutationFunction;
    updateDirector: MutationFunction;
    registerDirector: MutationFunction;
    initialDirector: IAddDirector;
    setDirectorState: React.Dispatch<React.SetStateAction<IAddDirector>>;
    initialLdo: ILDO;
    setLdoState: React.Dispatch<React.SetStateAction<ILDO>>;
    setAddNetDirector?: React.Dispatch<React.SetStateAction<boolean>>;
    e: React.SyntheticEvent;
    ldoId?: string;
    refetchFunc?:()=> Promise<void>;
}

async function addOrUpdateDirector({ directorUpdate, update, directorState, ldoState, setActErr,
    ldoUpdate, uploadedLogo, setIsLoading, user, mutateUser, updateDirector, registerDirector,
    initialDirector, setDirectorState, initialLdo, setLdoState, setAddNetDirector, e, ldoId, refetchFunc }: IAddUpdateDirectorProps) {

    const directorUpdateObj = { ...directorUpdate };
    if (update) {
        if (directorUpdateObj.password && directorUpdateObj.password !== '') {
            if (directorUpdateObj.confirmPassword !== directorUpdateObj.password) {
                return setActErr({ success: false, message: "Password did not match" });
            }
        } else {
            delete directorUpdateObj.password;
        }
        delete directorUpdateObj.confirmPassword;
    } else {
        if (directorState.password !== directorState.confirmPassword) {
            return setActErr({ success: false, message: "Password did not match" });
        }
    }

    const formData = new FormData();
    const inputArgs = { name: ldoState.name, firstName: directorState.firstName, lastName: directorState.lastName, phone: ldoState.phone, email: directorState.email, password: directorState.password, passcode: directorState.passcode };
    const updateArgs = { ...ldoUpdate, ...directorUpdateObj };

    const updateVar = { input: updateArgs };
    // @ts-ignore
    if (user.info?.role === UserRole.admin) updateVar.dId = ldoId;



    const addFileToFormData = () => {
        if (uploadedLogo.current) {
            const variables = { input: update ? updateArgs : inputArgs, logo: null };
            // @ts-ignore
            if (update && user.info?.role === UserRole.admin) variables.dId = ldoId;
            formData.set('operations', JSON.stringify({
                query: update ? UPDATE_DIRECTOR_RAW : ADD_DIRECTOR_RAW,
                variables,
            }));

            formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
            formData.set('0', uploadedLogo.current);
        }
    };

    try {
        addFileToFormData();
        setIsLoading(true);
        if (uploadedLogo.current) {
            // Conditionally call updateDirector if uploadedLogo.current exists
            const token = getCookie('token');
            const response = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseData = await response.json();

        } else {
            // Conditionally call updateDirector or registerDirector based on the existence of uploadedLogo.current
            if (update) {
                if (user.info?.role === UserRole.captain) {
                    await mutateUser({ variables: { userId: user.info._id, updateInput: directorUpdateObj } })
                } else {
                    await updateDirector({ variables: updateVar });
                }
            } else {
                await registerDirector({ variables: { args: inputArgs, logo: null } });
                // Reset form and state
                setDirectorState(initialDirector);
                setLdoState(initialLdo);
                const formEl = e.target as HTMLFormElement;
                formEl.reset();
            }
        }
        setActErr(null);
        if(refetchFunc) await refetchFunc();
        if (setAddNetDirector) setAddNetDirector(false);
    } catch (error: any) {
        console.error('Error during GraphQL mutation:', error);
        handleError(error);
        setActErr(error);
    } finally {
        setIsLoading(false);
    }
};

export default addOrUpdateDirector;
