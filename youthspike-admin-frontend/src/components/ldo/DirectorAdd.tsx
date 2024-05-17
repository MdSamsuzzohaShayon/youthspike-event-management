import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_DIRECTOR_RAW, ADD_DIRECTOR, GET_LDOS } from '@/graphql/director';
import Loader from '../elements/Loader';
import TextInput from '../elements/forms/TextInput';
import { IDirector, ILDO, ILdoUpdate, IError } from '@/types';
import EmailInput from '../elements/forms/EmailInput';
import PasswordInput from '../elements/forms/PasswordInput';
import FileInput from '../elements/forms/FileInput';
import { UPDATE_DIRECTOR, UPDATE_DIRECTOR_RAW } from '@/graphql/director';
import { useUser } from '@/lib/UserProvider';
import { UPDATE_CAPTAIN } from '@/graphql/captain';
import addOrUpdateDirector from '@/utils/requestHandlers/addOrUpdateDirector';
import NumberInput from '../elements/forms/NumberInput';

interface DirectorAddProps {
    update: boolean;
    prevLdo?: null | ILDO | undefined;
    ldoId?: string;
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
function DirectorAdd({ update, prevLdo, setIsLoading, setActErr, setAddNetDirector, ldoId }: DirectorAddProps) {    

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
        addOrUpdateDirector({
            directorUpdate, update, setActErr, directorState, ldoState,
            ldoUpdate, uploadedLogo, setIsLoading, user, mutateUser, updateDirector, registerDirector,
            initialDirector, setDirectorState, initialLdo, setLdoState, setAddNetDirector, client, e, ldoId
        })
    };

    useEffect(() => {
        if (prevLdo) setLdoState(prevLdo);
        if (prevLdo?.director) setDirectorState(prevLdo.director);
    }, [prevLdo]);

    useEffect(() => {
        if (error) {
            setActErr({ success: false, message: error.message })
        } else if (updateError) {
            setActErr({ success: false, message: updateError.message })
        }
    }, [error, updateError]);

    if (loading || capLoading) return <Loader />;

    return (
        <form onSubmit={handleDirectorSubmit} className="flex flex-col md:flex-row md:flex-wrap md:justify-between gap-2 md:gap-1">
            <TextInput vertical name='name' required={!update} lblTxt='LDO Name'
                defaultValue={ldoState.name} handleInputChange={handleLdoChange} extraCls='md:w-5/12' />

            <TextInput vertical defaultValue={directorState.firstName} name='firstName' required={!update} lblTxt='First Name'
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            <TextInput vertical defaultValue={directorState.lastName} name='lastName' required={!update} lblTxt='Last Name'
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            <NumberInput vertical defaultValue={ldoState.phone} name='phone' required={!update}
                handleInputChange={handleLdoChange} extraCls='md:w-5/12' />
            <EmailInput vertical name='email' required={!update} lblTxt='Email'
                defaultValue={directorState.email} handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            {/* {update && (
                <PasswordInput vertical name='oldPassword' required={!update} lblTxt="Old Password"
                    handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            )} */}
            <PasswordInput vertical name='password' required={!update} lblTxt={update ? 'Change Password' : 'Password'}
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            <PasswordInput vertical name='confirmPassword' required={!update} lblTxt='Confirm Password'
                handleInputChange={handleDirectorChange} extraCls='md:w-5/12' />
            <FileInput defaultValue={ldoState.logo} handleFileChange={handleFileChange} name='logo' extraCls='md:w-5/12 mt-4' />
            <div className="input-group w-full mt-4">
                <button className="btn-info" type="submit">
                    {update ? 'Update' : 'Register'}
                </button>
            </div>
        </form>
    );
};


export default DirectorAdd;