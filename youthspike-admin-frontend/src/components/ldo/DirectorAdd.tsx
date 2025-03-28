import React, { useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { motion } from "framer-motion";
import { ADD_DIRECTOR } from '@/graphql/director';
import { IAddDirector, ILDO, ILdoUpdate, IError } from '@/types';
import { UPDATE_DIRECTOR } from '@/graphql/director';
import { useUser } from '@/lib/UserProvider';
import { UPDATE_CAPTAIN } from '@/graphql/captain';
import addOrUpdateDirector from '@/utils/requestHandlers/addOrUpdateDirector';
import Loader from '../elements/Loader';
import FileInput from '../elements/forms/FileInput';
import { buttonVariants, containerVariants, inputVariants } from '@/utils/animation';
import InputField from '../elements/forms/InputField';
import { useError } from '@/lib/ErrorContext';

interface DirectorAddProps {
    update: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    prevLdo?: null | ILDO | undefined;
    ldoId?: string;
    setAddNetDirector?: React.Dispatch<React.SetStateAction<boolean>>;
    refetchFunc?: () => Promise<void>;
}

const initialLdo: ILDO = {
    name: '',
    logo: '',
    phone: ''
}

const initialDirector: IAddDirector = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    passcode: '',
}

/**
 * React component that allows users to add a director or update a director
 */
function DirectorAdd({ update, prevLdo, setIsLoading, setAddNetDirector, ldoId, refetchFunc }: DirectorAddProps) {

    // Hooks
    const user = useUser();
    const { setActErr } = useError();

    // Local State
    const [directorState, setDirectorState] = useState<IAddDirector>(prevLdo && prevLdo.director
        ? { ...initialDirector, ...prevLdo.director } : initialDirector);
    const [ldoState, setLdoState] = useState<ILDO>(prevLdo ? prevLdo : initialLdo);
    const [ldoUpdate, setLdoUpdate] = useState({});
    const [directorUpdate, setDirectorUpdate] = useState<ILdoUpdate>({});
    const uploadedLogo = useRef<File | null>(null);

    // Graphql
    const [registerDirector, { loading, error }] = useMutation(ADD_DIRECTOR);
    const [updateDirector, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_DIRECTOR);
    const [mutateUser, { loading: capLoading, error: capErr }] = useMutation(UPDATE_CAPTAIN);

    /**
     * Change input on cange event
     */
    const handleDirectorChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        setDirectorState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        if (update) {
            setDirectorUpdate((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
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
            initialDirector, setDirectorState, initialLdo, setLdoState, setAddNetDirector, e, ldoId, refetchFunc
        });
    };

    useEffect(() => {
        if (prevLdo) setLdoState(prevLdo);
        if (prevLdo?.director) setDirectorState({ ...initialDirector, ...prevLdo.director });
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
        <motion.div
            className="flex justify-center items-center "
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <motion.form
                onSubmit={handleDirectorSubmit}
                className="w-full max-w-3xl bg-gray-900 text-white rounded-xl shadow-xl p-8 md:p-12 border border-gray-800"
                variants={containerVariants}
            >
                {/* Title */}
                <motion.h2
                    className="text-3xl md:text-4xl font-bold text-center text-yellow-400 mb-8"
                    variants={inputVariants}
                >
                    {update ? "Update" : "Register New"} Director
                </motion.h2>

                {/* Input Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-1" name="name" type="text" label="Name" value={ldoState.name} handleInputChange={handleLdoChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-2" name="firstName" type="text" label="First Name" value={directorState.firstName} handleInputChange={handleDirectorChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-3" name="lastName" type="text" label="Last Name" value={directorState.lastName} handleInputChange={handleDirectorChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-4" name="phone" type="number" label="Phone" value={ldoState.phone} handleInputChange={handleLdoChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-5" name="email" type="email" label="Email" value={directorState.email} handleInputChange={handleDirectorChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-6" name="passcode" type="password" label="Passcode" value={directorState.passcode} handleInputChange={handleDirectorChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-7" name="password" type="password" label="Password" value={directorState.password} handleInputChange={handleDirectorChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <InputField key="dau-8" name="confirmPassword" type="password" label="Confirm Password" value={directorState.confirmPassword} handleInputChange={handleDirectorChange} required={!update} />
                    </motion.div>
                    <motion.div variants={inputVariants}>
                        <FileInput key="fil-da-1" defaultValue={ldoState.logo} handleFileChange={handleFileChange} name='logo' />
                    </motion.div>
                </div>

                {/* Submit Button */}
                <motion.div className="w-full mt-8 text-center" variants={inputVariants}>
                    <motion.button
                        type="submit"
                        className="w-full md:w-1/2 py-3 px-6 bg-yellow-400 text-black font-semibold rounded-md shadow-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-all"
                        whileHover="hover"
                        whileTap="tap"
                        variants={buttonVariants}
                    >
                        {update ? "Update" : "Register"}
                    </motion.button>
                </motion.div>
            </motion.form>
        </motion.div>
    );
};


export default DirectorAdd;