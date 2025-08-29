import { IAddDirector, IError, ILDO, ILdoUpdate } from '@/types';
import { IUserContext, UserRole } from '@/types/user';
import { MutationFunction } from '@apollo/client';
import { handleError } from '../handleError';
import { getCookie } from '../clientCookie';

interface ICommonDirector {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  uploadedLogo: React.RefObject<null | MediaSource | Blob>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  refetchFunc?: () => Promise<void>;
}

export interface IDirectorBaseProps extends ICommonDirector {
  directorState: IAddDirector;
  ldoState: ILDO;
  initialDirector: IAddDirector;
  setDirectorState: React.Dispatch<React.SetStateAction<IAddDirector>>;
  initialLdo: ILDO;
  setLdoState: React.Dispatch<React.SetStateAction<ILDO>>;
  e: React.SyntheticEvent;
}

export interface ICreateDirectorProps extends IDirectorBaseProps {
  registerDirector: MutationFunction;
  setAddNetDirector?: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface IUpdateDirectorProps extends ICommonDirector {
  user: IUserContext;
  directorUpdate: ILdoUpdate;
  ldoUpdate: ILdoUpdate;
  mutateUser: MutationFunction;
  updateDirector: MutationFunction;
  ldoId?: string;
  refetchFunc?: () => Promise<void>;
}

// Common validation function
export const validatePassword = (password: string, confirmPassword: string, setActErr: React.Dispatch<React.SetStateAction<IError | null>>): boolean => {
  if (password !== confirmPassword) {
    setActErr({ success: false, message: 'Password did not match' });
    return false;
  }
  return true;
};

// Common file upload function
export const handleFileUpload = async (formData: FormData, query: string, variables: Record<string, any>, uploadedLogo: React.RefObject<null | MediaSource | Blob>): Promise<void> => {
  if (uploadedLogo && uploadedLogo.current) {
    const uploadVariables = { ...variables, logo: null };
    formData.set(
      'operations',
      JSON.stringify({
        query,
        variables: uploadVariables,
      }),
    );

    formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
    // @ts-ignore
    formData.set('0', uploadedLogo.current);
  }
};

// Common fetch function for file uploads
export const executeFileUpload = async (formData: FormData, BACKEND_URL: string): Promise<any> => {
  const token = getCookie('token');
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return await response.json();
};

// Common cleanup function
export const resetFormAndState = (
  setDirectorState: React.Dispatch<React.SetStateAction<IAddDirector>>,
  setLdoState: React.Dispatch<React.SetStateAction<ILDO>>,
  initialDirector: IAddDirector,
  initialLdo: ILDO,
  e: React.SyntheticEvent,
): void => {
  setDirectorState(initialDirector);
  setLdoState(initialLdo);
  const formEl = e.target as HTMLFormElement;
  formEl.reset();
};
