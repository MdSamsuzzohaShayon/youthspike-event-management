import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_DIRECTOR_RAW, ADD_DIRECTOR, GET_LDOS } from '@/graphql/director';
import Loader from '../elements/Loader';
import TextInput from '../elements/forms/TextInput';
import { IDirector, ILDO, ILdoUpdate, IError } from '@/types';
import EmailInput from '../elements/forms/EmailInput';
import PasswordInput from '../elements/forms/PasswordInput';
import FileInput from '../elements/forms/FileInput';
import { getCookie, removeCookie } from '@/utils/cookie';
import { ADMIN_URL, BACKEND_URL } from '@/utils/keys';
import { UPDATE_DIRECTOR, UPDATE_DIRECTOR_RAW } from '@/graphql/director';
import Message from '../elements/Message';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { UPDATE_CAPTAIN } from '@/graphql/captain';

interface DirectorAddProps {
    update: boolean;
    prevLdo?: null | ILDO | undefined;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    setAddNetDirector?: React.Dispatch<React.SetStateAction<boolean>>;
}

const initialLdo: ILDO = {
    name: '',
    logo: '',
}

const initialDirector = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
}

/**
 * React component that allows users to add a director or update a director
 */
function DirectorAdd({ update, prevLdo, setIsLoading, setActErr, setAddNetDirector }: DirectorAddProps) {

    // Hooks
    const user = useUser();

    // Local State
    const [directorState, setDirectorState] = useState<IDirector>(prevLdo && prevLdo.director ? prevLdo.director : initialDirector);
    const [ldoState, setLdoState] = useState<ILDO>(prevLdo ? prevLdo : initialLdo);
    const [ldoUpdate, setLdoUpdate] = useState({});
    const [directorUpdate, setDirectorUpdate] = useState<ILdoUpdate>({});
    const uploadedLogo = useRef<File | null>(null);

    // Graphql
    const [registerDirector, { loading, error, client }] = useMutation(ADD_DIRECTOR);
    const [updateDirector, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_DIRECTOR);
    const [mutateUser, { loading: capLoading, error: capErr }] = useMutation(UPDATE_CAPTAIN);

    /**
     * Change input on cange event
     */
    const handleDirectorChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        if (update) {
            setDirectorUpdate((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        } else {
            setDirectorState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        }
    }

    const handleLdoChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        if (update) {
            setLdoUpdate((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        } else {
            setLdoState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        }
    }

    const handleFileChange = (e: React.SyntheticEvent) => {
        const fileInputEl = e.target as HTMLInputElement;
        if (fileInputEl && fileInputEl.files && fileInputEl.files.length > 0) {
            uploadedLogo.current = fileInputEl.files[0];
        }
    }

    /**
     * Handles the form submission event.
     * Validates the form input values and calls the registration mutation if they pass validation.
     * Resets the form input values and clears the form.
     */
    const handleDirectorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

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


        const addFileToFormData = () => {
            if (uploadedLogo.current) {
                formData.set('operations', JSON.stringify({
                    query: update ? UPDATE_DIRECTOR_RAW : ADD_DIRECTOR_RAW,
                    variables: { args: update ? { ...ldoUpdate, ...directorUpdateObj } : inputArgs, logo: null },
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
                        await updateDirector({ variables: { args: { ...ldoUpdate, ...directorUpdateObj } } });
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

    useEffect(() => {
        if (prevLdo) setLdoState(prevLdo);
        if (prevLdo?.director) setDirectorState(prevLdo.director);
    }, [prevLdo]);

    useEffect(() => {
        if (error) {
            setActErr({ name: error.name, message: error.message, main: error })
        } else if (updateError) {
            setActErr({ name: updateError.name, message: updateError.message, main: updateError })
        }
    }, [error, updateError]);

    if (loading || capLoading) return <Loader />;

    return (
        <form onSubmit={handleDirectorSubmit} className="flex flex-col md:flex-row md:flex-wrap md:justify-between gap-2 md:gap-1">
            {user.info?.role !== UserRole.captain && (<React.Fragment>
                <FileInput defaultValue='' handleFileChange={handleFileChange} name='logo' extraCls='md:w-5/12' />
                <TextInput vertical name='name' required={!update} lblTxt='LDO Name'
                    defaultValue={ldoState.name} handleInputChange={handleLdoChange} extraCls='md:w-5/12' />
            </React.Fragment>)}

            <TextInput vertical defaultValue={directorState.firstName} name='firstName' required={!update} lblTxt='First Name'
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            <TextInput vertical defaultValue={directorState.lastName} name='lastName' required={!update} lblTxt='Last Name'
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            {user.info?.role !== UserRole.captain && (
                <EmailInput vertical name='email' required={!update} lblTxt='Email'
                    defaultValue={directorState.email} handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            )}
            {user.info?.role === UserRole.captain && update && (
                <PasswordInput vertical name='oldPassword' required={!update} lblTxt="Old Password"
                    handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            )}
            <PasswordInput vertical name='password' required={!update} lblTxt={update ? 'Change Password' : 'Password'}
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            <PasswordInput vertical name='confirmPassword' required={!update} lblTxt='Confirm Password'
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            <div className="input-group w-full mt-4">
                <button className="btn-info" type="submit">
                    {update ? 'Update' : 'Register'}
                </button>
            </div>
        </form>
    );
};


export default DirectorAdd;