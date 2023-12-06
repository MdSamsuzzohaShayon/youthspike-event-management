import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADD_DIRECTOR_RAW, ADD_DIRECTOR, GET_LDOS } from '@/graphql/director';
import Loader from '../elements/Loader';
import TextInput from '../elements/forms/TextInput';
import { IUser, IDirector, ILDO, ILdoUpdate, IError } from '@/types';
import EmailInput from '../elements/forms/EmailInput';
import PasswordInput from '../elements/forms/PasswordInput';
import FileInput from '../elements/forms/FileInput';
import { getCookie } from '@/utils/cookie';
import { BACKEND_URL } from '@/utils/keys';
import { UPDATE_DIRECTOR, UPDATE_DIRECTOR_RAW } from '@/graphql/director';
import Message from '../elements/Message';

interface DirectorAddProps {
    update: boolean;
    prevLdo?: null | ILDO;
    setIsLoading: (state: boolean) => void;
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
function DirectorAdd({ update, prevLdo, setIsLoading }: DirectorAddProps) {
    const [directorState, setDirectorState] = useState<IDirector>(prevLdo && prevLdo.director ? prevLdo.director : initialDirector);
    const [ldoState, setLdoState] = useState<ILDO>(prevLdo ? prevLdo : initialLdo);
    const [ldoUpdate, setLdoUpdate] = useState({});
    const [directorUpdate, setDirectorUpdate] = useState<ILdoUpdate>({});
    const [actErr, setActErr] = useState<IError>();
    const uploadedLogo = useRef<File | null>(null);


    const [errorList, setErrorList] = useState<string[]>([]);

    const [registerDirector, { loading, error }] = useMutation(ADD_DIRECTOR,
        {
            refetchQueries: [{ query: GET_LDOS }]
            /*
                // Follow - https://www.apollographql.com/docs/react/data/mutations/#the-update-function
                update: (cache, { data: { createDirector } }) => {
                    // Read the existing cache
                    const existingData = cache.readQuery({ query: GET_LDOS });
    
                    // Update the cache with the new director
                    cache.writeQuery({
                        query: GET_LDOS,
                        data: {
                            // @ts-ignore
                            getEventDirectors: [...existingData.getEventDirectors.data, createDirector.data],
                        },
                    });
                },
                */
        }
    );


    const [updateDirector, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_DIRECTOR);

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

        const isPasswordMismatch = () => {
            if ((!update && directorState.password !== directorState.confirmPassword) || (update && directorUpdate?.password && directorUpdate.password !== directorUpdate.confirmPassword)) {
                setErrorList(['Password did not match!']);
                return true;
            }
            return false;
        };

        if (isPasswordMismatch()) return;

        const formData = new FormData();
        const inputArgs = { name: ldoState.name, firstName: directorState.firstName, lastName: directorState.lastName, email: directorState.email, password: directorState.password };

        const addFileToFormData = () => {
            if (uploadedLogo.current) {
                formData.set('operations', JSON.stringify({
                    query: update ? UPDATE_DIRECTOR_RAW : ADD_DIRECTOR_RAW,
                    variables: { args: update ? { ...ldoUpdate, ...directorUpdate } : inputArgs, logo: null },
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
                console.log(responseData);
            } else {
                // Conditionally call updateDirector or registerDirector based on the existence of uploadedLogo.current
                if (update) {
                    const { data } = await updateDirector({ variables: { args: { ...ldoUpdate, ...directorUpdate } } });
                } else {
                    const { data } = await registerDirector({ variables: { args: inputArgs, logo: null } });
                }

                // Reset form and state
                setDirectorState(initialDirector);
                setLdoState(initialLdo);
                const formEl = e.target as HTMLFormElement;
                formEl.reset();
            }
        } catch (error: any) {
            console.error('Error during GraphQL mutation:', error);
            setActErr({ name: "", message: error.message ? error.message : '', main: error });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (prevLdo) setLdoState(prevLdo);
        if (prevLdo?.director) setDirectorState(prevLdo.director);
    }, [prevLdo]);

    if (loading) return <Loader />;

    return (
        <div>
            {!update ? <h2>Add Director</h2> : <h2>Update Director</h2>}

            {error && <Message error={error} />}
            {actErr && <Message error={actErr} />}


            <form onSubmit={handleDirectorSubmit} className="flex flex-col gap-2">
                <FileInput defaultValue='' handleFileChange={handleFileChange} name='logo' />
                <TextInput vertical name='name' required={!update} lblTxt='LDO Name'
                    defaultValue={ldoState.name} handleInputChange={handleLdoChange} />
                <TextInput vertical name='firstName' required={!update} lblTxt='First Name'
                    defaultValue={directorState.firstName} handleInputChange={handleDirectorChange} />
                <TextInput vertical name='lastName' required={!update} lblTxt='Last Name'
                    defaultValue={directorState.lastName} handleInputChange={handleDirectorChange} />
                <EmailInput vertical name='email' required={!update} lblTxt='Email'
                    defaultValue={directorState.email} handleInputChange={handleDirectorChange} />
                <PasswordInput vertical name='password' required={!update} lblTxt={update ? 'Change Password' : 'Password'}
                    defaultValue={directorState.password} handleInputChange={handleDirectorChange} />
                <PasswordInput vertical name='confirmPassword' required={!update} lblTxt='Confirm Password'
                    defaultValue={directorState.confirmPassword} handleInputChange={handleDirectorChange} />
                <div className="input-group w-full">
                    <button className="btn-primary" type="submit">
                        {update ? 'Update' : 'Register'}
                    </button>
                </div>
            </form>
        </div>
    );
};


export default DirectorAdd;