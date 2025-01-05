import { IError } from "@/types";
// import { OperationVariables, QueryResult } from "@apollo/client";
import { removeCookie } from "./cookie";
import { ApolloError } from "@apollo/client";
import { useLdoId } from "@/lib/LdoProvider";
import { useError } from "@/lib/ErrorContext";

interface IResponse {
    message: string;
    success: boolean;
    code: number;
    data?: any;
}

interface IHandleResponseProps {
    response: IResponse;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
}

interface IHandleApolloErrorProps {
    error: ApolloError | Error[];
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
}

export function handleResponse({ response, setActErr }: IHandleResponseProps): boolean {
    if (!response) return false;
    let success = response.success;
    if (success) return success;

    if (response.message && setActErr) setActErr({ code: response.code, message: JSON.stringify(response), success });
    if (response.code === 401) {
        removeCookie("user");
        removeCookie("token");
        if (window) window.location.reload();

    }

    // Check response
    // console.log(response);
    return success;

}




export function handleError({ error, setActErr }: IHandleApolloErrorProps): void {
    if (error instanceof ApolloError) {
        const unauthenticatedError = error.graphQLErrors.find(
            (err) => err.extensions?.code === "UNAUTHENTICATED"
        );

        if (unauthenticatedError) {
            // Handle unauthenticated error
            if (setActErr) {
                setActErr({
                    code: 401, // unauthenticatedError.extensions?.response?.statusCode ||
                    // @ts-ignore
                    message: unauthenticatedError.extensions?.response?.message || unauthenticatedError.message,
                    success: false,
                });
            }
            removeCookie("user");
            removeCookie("token");
            if (window) window.location.reload();
        } else {
            // Handle other types of GraphQL errors
            if (setActErr) {
                setActErr({
                    code: 500,
                    // @ts-ignore
                    message: error.graphQLErrors[0]?.extensions?.response?.message || error.message,
                    success: false,
                });
            }
            console.log("GraphQL Error: ", error);
        }
    } else {
        // Handle non-Apollo errors
        console.log("Non-Apollo Error: ", error);
        if (setActErr) {
            setActErr({
                code: 500,
                message: `An unexpected error occurred: ${JSON.stringify(error)}`,
                success: false,
            });
        }
    }
}
