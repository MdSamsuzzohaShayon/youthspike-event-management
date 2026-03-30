import React, { useEffect, useRef, useState } from 'react';
import { ADD_DIRECTOR } from '@/graphql/director';
import { IAddDirector, IAddLDO, ILDO, ILdoUpdate } from '@/types';
import { UPDATE_DIRECTOR } from '@/graphql/director';
import { useUser } from '@/lib/UserProvider';
import { UPDATE_CAPTAIN } from '@/graphql/captain';
import Loader from '../elements/Loader';
import InputField from '../elements/forms/InputField';
import { useMessage } from '@/lib/MessageProvider';
import ImageInput from '../elements/forms/ImageInput';
import { createLdoDirector } from '@/utils/requestHandlers/createLdoDirector';
import { updateLdoDirector } from '@/utils/requestHandlers/updateLdoDirector';
import { useMutation } from '@apollo/client/react';

interface DirectorAddProps {
  update: boolean;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  prevLdo?: null | ILDO | undefined;
  ldoId?: string;
  setAddNewDirector?: React.Dispatch<React.SetStateAction<boolean>>;
  refetchFunc?: () => Promise<void>;
}

const initialLdo: IAddLDO = {
  name: '',
  logo: '',
  phone: ''
};

const initialDirector: IAddDirector = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  passcode: '',
};

/**
 * React component that allows users to add a director or update a director
 */
function DirectorAdd({ update, prevLdo, setIsLoading, setAddNewDirector, ldoId, refetchFunc }: DirectorAddProps) {
  // Hooks
  const user = useUser();
  const { showMessage } = useMessage();

  // Local State
  const [directorState, setDirectorState] = useState<IAddDirector>(prevLdo && prevLdo.director ? { ...initialDirector, ...prevLdo.director } : initialDirector);
  const [ldoState, setLdoState] = useState<IAddLDO>(prevLdo ? { logo: prevLdo.logo || '', name: prevLdo.name, phone: prevLdo.phone } : { ...initialLdo });
  const [ldoUpdate, setLdoUpdate] = useState({});
  const [directorUpdate, setDirectorUpdate] = useState<ILdoUpdate>({});
  const uploadedLogo = useRef<null | MediaSource | Blob>(null);

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
  };

  const handleLdoChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (update) {
      setLdoUpdate((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setLdoState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };

  const handleLogoChange = (uploadedFile: MediaSource | Blob) => {
    uploadedLogo.current = uploadedFile;
  };

  /**
   * Handles the form submission event.
   * Validates the form input values and calls the registration mutation if they pass validation.
   * Resets the form input values and clears the form.
   */
  const handleDirectorSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (update) {
      updateLdoDirector({
        directorUpdate,
        showMessage,
        ldoUpdate,
        uploadedLogo,
        setIsLoading,
        user,
        mutateUser,
        updateDirector,
        ldoId,
        refetchFunc,
      });
    } else {
      createLdoDirector({
        directorState,
        ldoState,
        showMessage,
        uploadedLogo,
        setIsLoading,
        registerDirector,
        initialDirector,
        setDirectorState,
        initialLdo,
        setLdoState,
        setAddNewDirector,
        e,
        refetchFunc,
      });
    }
  };

  useEffect(() => {
    if (prevLdo) setLdoState({ logo: prevLdo.logo || '', name: prevLdo.name, phone: prevLdo.phone });
    if (prevLdo?.director) setDirectorState({ ...initialDirector, ...prevLdo.director });
  }, [prevLdo]);

  useEffect(() => {
    if (error) {
      showMessage({ type: "error", message: error.message });
    } else if (updateError) {
      showMessage({ type: "error", message: updateError.message });
    }
  }, [error, updateError]);

  if (loading || capLoading) return <Loader />;

  return (
    <div className="flex justify-center items-center " >
      <form onSubmit={handleDirectorSubmit} className="w-full md:bg-gray-900 text-white md:rounded-xl md:shadow-xl p-2 md:p-12 md:border md:border-gray-800" >
        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-yellow-400 mb-8" >
          {update ? 'Update' : 'Register New'} Director
        </h2>

        {/* Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div >
            <InputField key="dau-1" name="name" type="text" label="Name" defaultValue={ldoState.name} handleInputChange={handleLdoChange} required={!update} />
          </div>
          <div >
            <InputField key="dau-2" name="firstName" type="text" label="First Name" defaultValue={directorState.firstName} handleInputChange={handleDirectorChange} required={!update} />
          </div>
          <div >
            <InputField key="dau-3" name="lastName" type="text" label="Last Name" defaultValue={directorState.lastName} handleInputChange={handleDirectorChange} required={!update} />
          </div>
          <div >
            <InputField key="dau-4" name="phone" type="number" label="Phone" defaultValue={ldoState.phone} handleInputChange={handleLdoChange} required={!update} />
          </div>
          <div >
            <InputField key="dau-5" name="email" type="email" label="Email" defaultValue={directorState.email} handleInputChange={handleDirectorChange} required={!update} />
          </div>
          <div >
            <InputField key="dau-6" name="passcode" type="password" label="Passcode" defaultValue={directorState.passcode} handleInputChange={handleDirectorChange} required={!update} />
          </div>
          <div >
            <InputField key="dau-7" name="password" type="password" label="Password" defaultValue={directorState.password} handleInputChange={handleDirectorChange} required={!update} />
          </div>
          <div >
            <InputField
              key="dau-8"
              name="confirmPassword"
              type="password"
              label="Confirm Password"
              defaultValue={directorState.confirmPassword}
              handleInputChange={handleDirectorChange}
              required={!update}
            />
          </div>
          <div >
            <ImageInput handleFileChange={handleLogoChange} name="logo" defaultValue={ldoState?.logo || null} />
          </div>
        </div>

        {/* Submit Button */}
        <div className="w-full mt-8 text-center" >
          <button
            type="submit"
            className="btn-info"
          >
            {update ? 'Update' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DirectorAdd;
