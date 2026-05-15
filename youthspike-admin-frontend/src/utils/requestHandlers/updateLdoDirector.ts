import { UPDATE_DIRECTOR_RAW } from "@/graphql/director";
import { BACKEND_URL } from "../keys";
import {
  validatePassword
} from "./ldoDirectorHelper";
import { IGetLdoResponse, ILdoUpdate, IMessage, IUser, IUserContext, IUserResponse, UserRole } from "@/types";
import { handleApiResult, handleError } from "../handleError";
import { getCookie } from "../clientCookie";
import { useMutation } from "@apollo/client/react";
import { ApolloCache, ApolloClient, gql } from "@apollo/client";
import routerService from "@/lib/router-service";


type TMutationDirectorFunction = useMutation.MutationFunction<
  {
    updateDirector: IGetLdoResponse;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;

type TMutationUserFunction = useMutation.MutationFunction<
  {
    updateUser: IUserResponse;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;


export interface IUpdateDirectorProps {
  user: IUserContext;
  directorUpdate: ILdoUpdate;
  ldoUpdate: ILdoUpdate;
  mutateUser: TMutationUserFunction;
  updateDirector: TMutationDirectorFunction;
  setMessage: (message: Omit<IMessage, "id">) => void;
  uploadedLogo: React.RefObject<null | MediaSource | Blob>;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  apolloClient: ApolloClient; // Add this
  ldoId?: string | null;
}




export async function updateLdoDirector({
  directorUpdate,
  setMessage,
  ldoUpdate,
  uploadedLogo,
  setIsLoading,
  user,
  mutateUser,
  updateDirector: updateDirectorMutation,
  apolloClient,
  ldoId
}: IUpdateDirectorProps): Promise<void> {

  let responseData: IGetLdoResponse | undefined;
  const directorUpdateObj = { ...directorUpdate };

  // Handle password validation and cleanup
  if (directorUpdateObj.password && directorUpdateObj.password !== '') {
    if (!validatePassword(directorUpdateObj.password, directorUpdateObj.confirmPassword!, setMessage)) {
      return;
    }
  } else {
    delete directorUpdateObj.password;
  }
  delete directorUpdateObj.confirmPassword;


  const updateArgs = { ...ldoUpdate, ...directorUpdateObj };
  const updateVar = { input: updateArgs };

  // Add admin-specific parameter
  // @ts-ignore
  if (user.info?.role === UserRole.admin) updateVar.dId = ldoId;

  try {
    // Handle file upload if needed
    // await handleFileUpload(formData, UPDATE_DIRECTOR_RAW, updateVar, uploadedLogo);

    if (setIsLoading) setIsLoading(true);

    if (uploadedLogo.current) {
      const formData = new FormData();
      const uploadVariables = { ...updateVar, logo: null };
      formData.set(
        'operations',
        JSON.stringify({
          query: UPDATE_DIRECTOR_RAW,
          variables: uploadVariables,
        }),
      );

      formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
      // @ts-ignore
      formData.set('0', uploadedLogo.current);
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

      responseData = json.data?.updateDirector;
    } else {
      // Regular mutation path based on user role
      if (user.info?.role === UserRole.captain) {
        const result = await mutateUser({ variables: { userId: user.info._id, updateInput: directorUpdateObj } });
        // 🔴 GraphQL errors (Apollo)
        if (result.error) {
          console.error(result.error);

          throw new Error(result.error?.message);
        }

        // responseData = result.data?.updateUser;
        // Redirect to home page
      } else {
        const result = await updateDirectorMutation({ variables: updateVar });
        // 🔴 GraphQL errors (Apollo)
        if (result.error) {
          console.error(result.error);

          throw new Error(result.error?.message);
        }

        responseData = result.data?.updateDirector;
      }
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

    // Handle cache here
    // Handle cache here
    if (responseData?.data) {
      const updatedDirector = responseData.data;

      apolloClient.cache.modify({
        fields: {
          getEventDirectors(existing, { readField }) {
            const existingData = readField<{ __ref: string }[]>("data", existing) ?? [];

            // Find and update the existing item
            const updatedData = existingData.map((ref) => {
              const id = readField<string>("_id", ref);
              if (id === updatedDirector._id) {
                // Write the updated data and get new reference
                return apolloClient.cache.writeFragment({
                  fragment: gql`
                fragment UpdatedLDO on LDO {
                  _id
                  name
                  phone
                  logo
                  director {
                    _id
                    active
                    firstName
                    lastName
                    role
                    email
                    passcode
                  }
                  events
                }
              `,
                  data: {
                    __typename: "LDO",
                    ...updatedDirector,
                    director: updatedDirector.director ? {
                      __typename: "Director",
                      ...updatedDirector.director,
                    } : null,
                    events: updatedDirector.events ?? [],
                  },
                });
              }
              return ref; // Keep unchanged items as-is
            });

            return {
              ...(existing as Record<string, unknown>),
              __typename: existing?.__typename ?? "GetEventDirectorsResponse",
              data: updatedData,
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

    await fetch('/api/logout', { method: 'GET' });
    routerService.push('/login');


    throw new Error(message);
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
}
