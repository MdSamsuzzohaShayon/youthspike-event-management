import { IError } from "@/types";
// import { OperationVariables, QueryResult } from "@apollo/client";
import { removeCookie } from "./cookie";
import { ApolloError } from "@apollo/client";

interface IResponse {
    message: string;
    success: boolean;
    code: number;
    data?: any;
}

interface IHandleResponseProps {
    response: IResponse;
    setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
}

interface IHandleApolloErrorProps {
    error: ApolloError;
    setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
}

export function handleResponse({ response, setActErr }: IHandleResponseProps): boolean {
    let success = response.success;
    if (success) return success;

    if (response.message && setActErr) setActErr({ code: response.code, message: response.message, success });
    if (response.code === 401) {
        removeCookie("user");
        removeCookie("token");
        if (window) window.location.reload();

    }

    // Check response
    console.log(response);
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
                    code: 401,
                    message: unauthenticatedError.message,
                    success: false,
                });
            }
            removeCookie("user");
            removeCookie("token");
            if (window) window.location.reload();
        } else {
            // Handle other types of errors
            console.log(error);
        }
    } else {
        console.log(error);
    }

}