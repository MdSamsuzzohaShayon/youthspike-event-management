import { IGetTemplateResponse, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import { GET_TEMPLATE } from '@/graphql/templates';
import TemplateUpdateContainer from '@/components/template/TemplateUpdateContainer';

interface IProps {
  params: TParams;
}

async function UpdatePlayerPage({ params }: IProps) {
  const pathParams = await params;
  const { templateId, eventId } = pathParams;
  return (
    <div>
    <PreloadQuery query={GET_TEMPLATE} variables={{ templateId}}>
      {(queryRef) => <TemplateUpdateContainer queryRef={queryRef as QueryRef<{ getTemplate: IGetTemplateResponse }>} eventId={eventId} templateId={templateId} />}
    </PreloadQuery>

      {templateId}
    </div>
  );
}

export default UpdatePlayerPage;
