'use client';

import { QueryRef, useApolloClient, useReadQuery } from '@apollo/client/react';
import { IGetTemplateResponse } from '@/types';
import { useMutation } from '@apollo/client/react';
import { notFound } from 'next/navigation';

import { UPDATE_TEMPLATE } from '@/graphql/templates';
import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';
import { IResponse, ITemplate, ITemplateCreate } from '@/types';
import TemplateFormLayout from './TemplateFormLayout';
import { TemplateSaveResult, useTemplateForm } from '@/hooks/template/useTemplateForm';
import routerService from '@/lib/router-service';
import { updateTemplate } from '@/utils/request-handlers/updateTemplate';

interface IUpdateTemplateResponse extends IResponse {
  data: ITemplate;
}

interface ITemplateUpdateContainerProps {
  queryRef: QueryRef<{ getTemplate: IGetTemplateResponse }>;
  eventId: string;
  templateId: string;
}

function TemplateUpdateContainer({ queryRef, eventId, templateId }: ITemplateUpdateContainerProps) {
  const [mutateTemplate] = useMutation<{ updateTemplate: IGetTemplateResponse }>(UPDATE_TEMPLATE);
  const { data } = useReadQuery(queryRef);
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();
  const apolloClient = useApolloClient();

  const template = data?.getTemplate?.data;

  if (!template) {
    notFound();
  }




  const handleUpdateTemplate = async (input: ITemplateCreate): Promise<TemplateSaveResult> => {
    return updateTemplate({mutateTemplate, apolloClient, eventId, input, setMessage, templateId});
    // return { success: false, message };
  };

  const form = useTemplateForm({
    eventId,
    initialValues: {
      name: template.name,
      subject: template.subject,
      body: template.body,
      type: template.type,
      default: template.default,
    }
    ,
    onSave: handleUpdateTemplate,
  });

  return (
    <div>
      <TemplateFormLayout title="Edit Email Template" saveLabel="Update Template" form={form} />;
    </div>
  );
}

export default TemplateUpdateContainer;
