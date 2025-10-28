import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { TeamResolver } from './team.resolver';
import { TeamQueries } from './resolvers/team.queries';
import { TeamFields } from './resolvers/team.fields';
import { TeamMutations } from './resolvers/team.mutations';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [TeamResolver, TeamQueries, TeamFields, TeamMutations],
})
export class TeamModule {}
