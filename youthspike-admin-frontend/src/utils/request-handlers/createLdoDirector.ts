import { ADD_DIRECTOR_RAW, GET_LDOS, NEW_LDO_FRAGMENT } from "@/graphql/director";
import { BACKEND_URL } from "../keys";
import {
  validatePassword,
  resetFormAndState,
  IDirectorBaseProps
} from "./ldoDirectorHelper";
import { handleApiResult } from "../handleError";
import { IAddDirector, IAddLDO, IGetLdoResponse, ILDO, IMessage, IResponse } from "@/types";
import { getCookie } from "../clientCookie";
import { useMutation } from "@apollo/client/react";
import { ApolloCache, ApolloClient, gql } from "@apollo/client";
import routerService from "@/lib/router-service";
import SessionStorageService from "../SessionStorageService";
import { DIVISION } from "../constant";
import { removeTeamFromStore } from "../localStorage";


type TMutationFunction = useMutation.MutationFunction<
  {
    createDirector: IGetLdoResponse;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;

interface ICreateDirectorProps extends IDirectorBaseProps {
  directorState: IAddDirector;
  registerDirector: TMutationFunction;
  ldoState: IAddLDO;
  apolloClient: ApolloClient;
  setMessage: (message: Omit<IMessage, "id">) => void;
  uploadedLogo: React.RefObject<null | MediaSource | Blob>;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  setAddNewDirector?: React.Dispatch<React.SetStateAction<boolean>>;
}



export async function createLdoDirector({
  directorState,
  registerDirector,
  ldoState,
  apolloClient,
  setMessage,
  uploadedLogo,
  setIsLoading,
  setAddNewDirector,
}: ICreateDirectorProps) {
  // Validate password
  if (!validatePassword(directorState.password, directorState.confirmPassword, setMessage)) {
    return;
  }


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
    let responseData: IGetLdoResponse | undefined;
    const uploadVariables = { input: inputArgs, logo: null };


    if (setIsLoading) setIsLoading(true);

    if (uploadedLogo.current) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: ADD_DIRECTOR_RAW,
          variables: uploadVariables,
        }),
      );

      formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
      formData.set('0', uploadedLogo.current as Blob);
      // File upload path
      // await executeFileUpload(formData, BACKEND_URL);
      const token = getCookie('token');
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}`, 'apollo-require-preflight': 'true', },
      });


      // 🔴 Handle HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      // 🔴 Handle GraphQL errors
      if (json.errors?.length) {
        throw new Error(json.errors[0].message || 'GraphQL Error');
      }

      responseData = json.data?.createDirector;
    } else {
      // Regular mutation path
      const result = await registerDirector({ variables: { input: inputArgs, logo: null } });


      // 🔴 GraphQL errors (Apollo)
      if (result.error) {
        console.error(result.error);

        throw new Error(result.error?.message);
      }

      responseData = result.data?.createDirector;
    }



    // 🔴 No response safety
    if (!responseData) {
      throw new Error('No response received from server');
    }

    // ✅ Success handling
    const result = handleApiResult({ response: responseData });

    if (result?.code > 299) {
      throw new Error(result.message);
    }

    setMessage({
      type: 'success',
      message: result?.message || 'Player updated successfully',
    });

    if (setAddNewDirector) setAddNewDirector(false);


    // Add to cache - right before "return result;"
    // Alternative simpler approach
    if (responseData?.data) {
      const newDirector = responseData.data;

      apolloClient.cache.modify({
        fields: {
          getEventDirectors(existing, { readField }) {
            const existingData = readField<{ __ref: string }[]>("data", existing) ?? [];

            // Prevent duplicates
            if (existingData.some(ref => readField("_id", ref) === newDirector._id)) {
              return existing;
            }

            // Write the complete object in one go
            const newRef = apolloClient.cache.writeFragment({
              fragment: NEW_LDO_FRAGMENT,
              data: {
                __typename: "LDO",
                ...newDirector,
                director: newDirector.director ? {
                  __typename: "Director",
                  ...newDirector.director,
                } : null,
                events: newDirector.events ?? [],
              },
            });

            return {
              ...existing,
              __typename: existing?.__typename ?? "GetEventDirectorsResponse",
              data: [...existingData, newRef],
            };
          },
        },
      });
    }

  } catch (error: unknown) {
    console.error(error);

    // 🧠 Smart error extraction
    let message = 'Something went wrong';

    if (error instanceof Error) {
      message = error.message;
    }

    setMessage({
      type: 'error',
      message,
    });

    SessionStorageService.removeItem(DIVISION);
    removeTeamFromStore();
    await fetch('/api/logout', { method: 'GET' });
    routerService.push('/login');


    throw new Error(message);
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
}