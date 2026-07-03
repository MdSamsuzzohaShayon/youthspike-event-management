// ─────────────────────────────────────────────────────────────
// NewTemplatePage.tsx
// Thin wrapper: supplies the "create" mutation, delegates all
// state/UI to useTemplateForm + TemplateFormLayout.
// ─────────────────────────────────────────────────────────────
'use client';

import React from 'react';
import { useMutation } from '@apollo/client/react';
import { useParams, useRouter } from 'next/navigation';

import { SAVE_TEMPLATE } from '@/graphql/templates';
import { useLdoId } from '@/lib/LdoProvider';
import { useMessage } from '@/lib/MessageProvider';
import { IResponse, ITemplate, ITemplateCreate } from '@/types';
import { TemplateSaveResult, useTemplateForm } from '@/hooks/template/useTemplateForm';
import TemplateFormLayout from '@/components/template/TemplateFormLayout';

interface ICreateTemplateResponse extends IResponse {
  data: ITemplate;
}
type CreateTemplateMutationData = { createTemplate: ICreateTemplateResponse };
type CreateTemplateMutationVars = { input: ITemplateCreate };

export default function NewTemplatePage() {
  const [createTemplate] = useMutation<CreateTemplateMutationData, CreateTemplateMutationVars>(SAVE_TEMPLATE);
  const params = useParams();
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { showMessage } = useMessage();

  const eventId = String(params?.eventId ?? '');

  const handleSaveNewTemplate = async (input: ITemplateCreate): Promise<TemplateSaveResult> => {
    const response = await createTemplate({ variables: { input } });
    const result = response?.data?.createTemplate;

    if (result?.code === 201) {
      router.push(`/${eventId}/templates/${ldoIdUrl}`);
      return { success: true };
    }

    const message = result?.message || 'Internal Server Error';
    showMessage({ code: result?.code, message, type: 'error' });
    return { success: false, message };
  };

  const form = useTemplateForm({ eventId, onSave: handleSaveNewTemplate });

  return <TemplateFormLayout title="Email Template Editor" saveLabel="Save Template" form={form} />;
}