import { IGetTeamWithGroupsAndUnassignedPlayersResponse, IGetTemplateResponse, IPlayerAndTeamsResponse, TParams } from '@/types';
import { PreloadQuery } from '@/lib/client';
import { QueryRef } from '@apollo/client/react';
import PlayerUpdateContainer from '@/components/player/PlayerUpdateContainer';
import { GET_PLAYER_AND_TEAMS } from '@/graphql/players';
import { GET_TEMPLATE } from '@/graphql/templates';
import TemplateUpdateContainer from '@/components/template/TemplateUpdateContainer';

interface IProps {
  params: TParams;
}

async function UpdatePlayerPage({ params }: IProps) {
  const pathParams = await params;
  const { templateId, eventId } = pathParams;
  return (
    <div>TemplatePage
    <PreloadQuery query={GET_TEMPLATE} variables={{ templateId}}>
      {(queryRef) => <TemplateUpdateContainer queryRef={queryRef as QueryRef<{ getTemplate: IGetTemplateResponse }>} />}
    </PreloadQuery>

      {templateId}
    </div>
  );
}

export default UpdatePlayerPage;
