'use client';

import { QueryRef, useReadQuery } from '@apollo/client/react';
import { IGetTemplateResponse } from '@/types';
import React from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { notFound, useParams, useRouter } from 'next/navigation';

import { GET_TEMPLATE, UPDATE_TEMPLATE } from '@/graphql/templates';
import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';
import { IResponse, ITemplate, ITemplateCreate } from '@/types';
import TemplateFormLayout from './TemplateFormLayout';
import { TemplateSaveResult, useTemplateForm } from '@/hooks/template/useTemplateForm';
import routerService from '@/lib/router-service';
import useLdoUrl from '@/hooks/useLdoUrl';

interface IUpdateTemplateResponse extends IResponse {
  data: ITemplate;
}
type UpdateTemplateMutationData = { updateTemplate: IUpdateTemplateResponse };
type UpdateTemplateMutationVars = { id: string; input: ITemplateCreate };

type GetTemplateQueryData = { template: ITemplate };
type GetTemplateQueryVars = { id: string };

interface ITemplateUpdateContainerProps {
  queryRef: QueryRef<{ getTemplate: IGetTemplateResponse }>;
  eventId: string;
  templateId: string;
}

function TemplateUpdateContainer({ queryRef, eventId, templateId }: ITemplateUpdateContainerProps) {
  const [updateTemplate] = useMutation<UpdateTemplateMutationData, UpdateTemplateMutationVars>(UPDATE_TEMPLATE);
  const { data } = useReadQuery(queryRef);
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();

  const template = data?.getTemplate?.data;

  if (!template) {
    notFound();
  }




  const handleUpdateTemplate = async (input: ITemplateCreate): Promise<TemplateSaveResult> => {
    const response = await updateTemplate({ variables: { id: templateId, input } });
    const result = response?.data?.updateTemplate;

    if (result?.code === 200) {
      routerService.push(`/${eventId}/templates/${ldoIdUrl}`);
      return { success: true };
    }

    const message = result?.message || 'Internal Server Error';
    setMessage({ code: result?.code, message, type: 'error' });
    return { success: false, message };
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
  )
}

export default TemplateUpdateContainer;
