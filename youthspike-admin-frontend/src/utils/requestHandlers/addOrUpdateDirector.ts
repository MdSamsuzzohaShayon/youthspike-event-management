import { ADD_DIRECTOR_RAW, GET_LDOS, UPDATE_DIRECTOR_RAW } from "@/graphql/director";
import { IDirector, IError, ILDO, ILdoUpdate } from "@/types";
import React from "react";
import { getCookie, removeCookie } from "../cookie";
import { ADMIN_URL, BACKEND_URL } from "../keys";
import { IUserContext, UserRole } from "@/types/user";
import { ApolloClient, MutationFunction } from "@apollo/client";

interface IAddUpdateDirectorProps {
    directorUpdate: ILdoUpdate;
    update: boolean;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    directorState: IDirector;
    ldoState: ILDO;
    ldoUpdate: ILdoUpdate;
    uploadedLogo: React.RefObject<File | null>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    user: IUserContext;
    mutateUser: MutationFunction;
    updateDirector: MutationFunction;
    registerDirector: MutationFunction;
    initialDirector: IDirector;
    setDirectorState: React.Dispatch<React.SetStateAction<IDirector>>;
    initialLdo: ILDO;
    setLdoState: React.Dispatch<React.SetStateAction<ILDO>>;
    setAddNetDirector?: React.Dispatch<React.SetStateAction<boolean>>;
    client: ApolloClient<any>;
    e: React.SyntheticEvent;
    ldoId?: string;
}

async function addOrUpdateDirector({ directorUpdate, update, setActErr, directorState, ldoState,
    ldoUpdate, uploadedLogo, setIsLoading, user, mutateUser, updateDirector, registerDirector,
    initialDirector, setDirectorState, initialLdo, setLdoState, setAddNetDirector, client, e, ldoId }: IAddUpdateDirectorProps) {

    const directorUpdateObj = { ...directorUpdate };
    if (update) {
        if (directorUpdateObj.password && directorUpdateObj.password !== '') {
            if (directorUpdateObj.confirmPassword !== directorUpdateObj.password) {
                return setActErr({ name: "Invalid Password", message: "Password did not match" });
            }
        } else {
            delete directorUpdateObj.password;
        }
        delete directorUpdateObj.confirmPassword;
    } else {
        if (directorState.password !== directorState.confirmPassword) {
            return setActErr({ name: "Invalid Password", message: "Password did not match" });
        }
    }

    const formData = new FormData();
    const inputArgs = { name: ldoState.name, firstName: directorState.firstName, lastName: directorState.lastName, email: directorState.email, password: directorState.password };
    const updateArgs = { ...ldoUpdate, ...directorUpdateObj };

    const updateVar = { args: updateArgs };
    // @ts-ignore
    if (user.info?.role === UserRole.admin) updateVar.dId = ldoId;



    const addFileToFormData = () => {
        if (uploadedLogo.current) {
            const variables = { args: update ? updateArgs : inputArgs, logo: null };
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
        await client.refetchQueries({
            include: [GET_LDOS],
        });
        if (setAddNetDirector) setAddNetDirector(false);
    } catch (error: any) {
        console.error('Error during GraphQL mutation:', error);
        if (error && error?.graphQLErrors && error.graphQLErrors?.length && error.graphQLErrors.length > 0) {
            // Valid error
            const invalidAuth = error.graphQLErrors.find((e: any) => e && e?.extensions && e.extensions?.response && e.extensions.response.statusCode === 401);
            if (invalidAuth) {
                // Delete cookies and redirect to login page
                await Promise.all([removeCookie('token'), removeCookie('user')]);
                window.location.href = `${ADMIN_URL}/login`
            }
        }
        setActErr(error);
    } finally {
        setIsLoading(false);
    }
};

export default addOrUpdateDirector;
