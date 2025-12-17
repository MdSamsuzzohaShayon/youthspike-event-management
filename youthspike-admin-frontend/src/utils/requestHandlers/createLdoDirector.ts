import { ADD_DIRECTOR_RAW } from "@/graphql/director";
import { BACKEND_URL } from "../keys";
import {
  ICreateDirectorProps,
  validatePassword,
  handleFileUpload,
  executeFileUpload,
  resetFormAndState
} from "./ldoDirectorHelper";
import { handleError } from "../handleError";

export async function createLdoDirector({
  directorState,
  ldoState,
  setActErr,
  uploadedLogo,
  setIsLoading,
  registerDirector,
  initialDirector,
  setDirectorState,
  initialLdo,
  setLdoState,
  setAddNewDirector,
  refetchFunc,
  e
}: ICreateDirectorProps): Promise<void> {
  // Validate password
  if (!validatePassword(directorState.password, directorState.confirmPassword, setActErr)) {
    return;
  }

  const formData = new FormData();
  const inputArgs = {
    name: ldoState.name,
    firstName: directorState.firstName,
    lastName: directorState.lastName,
    phone: ldoState.phone,
    email: directorState.email,
    password: directorState.password,
    passcode: directorState.passcode
  };

  try {
    // Handle file upload if needed
    await handleFileUpload(formData, ADD_DIRECTOR_RAW, { input: inputArgs, logo: null }, uploadedLogo);
    
    setIsLoading(true);

    if (uploadedLogo.current) {
      // File upload path
      await executeFileUpload(formData, BACKEND_URL);
    } else {
      // Regular mutation path
      await registerDirector({ variables: { input: inputArgs, logo: null } });
      
      // Reset form and state
      resetFormAndState(setDirectorState, setLdoState, initialDirector, initialLdo, e);
    }

    setActErr(null);
    if (refetchFunc) await refetchFunc();
    if (setAddNewDirector) setAddNewDirector(false);
  } catch (error: any) {
    console.error('Error during director creation:', error);
    handleError(error);
    setActErr(error);
  } finally {
    setIsLoading(false);
  }
}