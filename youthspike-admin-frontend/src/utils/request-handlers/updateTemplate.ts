import { TEMPLATE_FRAGMENT } from "@/graphql/templates";
import { IMessage, ITemplateCreate, TUpdateTemplateFunction } from "@/types";
import { ApolloClient } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

interface UpdateTemplateProps {
    mutateTemplate: TUpdateTemplateFunction;
    apolloClient: ApolloClient;

    templateId: string;
    eventId: string;
    input: ITemplateCreate;

    setMessage: (
        message: Omit<IMessage, "id">
    ) => void;
}

export async function updateTemplate({
    mutateTemplate,
    apolloClient,
    templateId,
    eventId,
    input,
    setMessage,
}: UpdateTemplateProps) {
    try {
        const result = await mutateTemplate({
            variables: {
                templateId,
                eventId,
                input,
            },
        });

        // Apollo GraphQL errors

        if (result.error) {
            throw new Error(result.error.message);
        }

        const response = result.data?.updateTemplate;

        if (!response) {
            throw new Error("No response received.");
        }

        if (response.code >= 300) {
            throw new Error(response.message);
        }

        const updatedTemplate = response.data;

        if (updatedTemplate) {
            apolloClient.cache.writeFragment({
                id: apolloClient.cache.identify({
                    __typename: 'Template',
                    _id: updatedTemplate._id,
                }),

                fragment: TEMPLATE_FRAGMENT,
                data: updatedTemplate,
            });
        }

        setMessage({
            type: "success",
            message: response.message,
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error(error);

        const message =
            error instanceof Error
                ? error.message
                : "Something went wrong";

        setMessage({
            type: "error",
            message,
        });

        return {
            success: false,
            message,
        };
    }
}