import { IAddDirector, IAddLDO, ILDO, ILdoUpdate, IMessage, TMutationFunction } from '@/types';
import { IUserContext } from '@/types/user';
import { getCookie } from '../clientCookie';

interface ICommonDirector {
  setMessage: (message: Omit<IMessage, "id">) => void;
  uploadedLogo: React.RefObject<null | MediaSource | Blob>;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  refetchFunc?: () => Promise<void>;
}

export interface IDirectorBaseProps extends ICommonDirector {
  directorState: IAddDirector;
  ldoState: IAddLDO;
  initialDirector: IAddDirector;
  setDirectorState: React.Dispatch<React.SetStateAction<IAddDirector>>;
  initialLdo: IAddLDO | ILDO;
  setLdoState: React.Dispatch<React.SetStateAction<IAddLDO>>;
}

export interface ICreateDirectorProps extends IDirectorBaseProps {
  registerDirector: TMutationFunction;
  setAddNewDirector?: React.Dispatch<React.SetStateAction<boolean>>;
}



// Common validation function
export const validatePassword = (password: string, confirmPassword: string, showMessage: (message: Omit<IMessage, "id">) => void): boolean => {
  if (password !== confirmPassword) {
    showMessage({ type:"error", message: 'Password did not match' });
    return false;
  }
  return true;
};



// Common cleanup function
export const resetFormAndState = (
  setDirectorState: React.Dispatch<React.SetStateAction<IAddDirector>>,
  setLdoState: React.Dispatch<React.SetStateAction<IAddLDO>>,
  initialDirector: IAddDirector,
  initialLdo: IAddLDO,
): void => {
  setDirectorState(initialDirector);
  setLdoState(initialLdo);
};
