import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from 'src/shared/shared.module';
import { MatchResolver } from './match.resolver';
import { MatchQueries } from './resolvers/match.queries';
import { MatchFields } from './resolvers/match.fields';
import { MatchMutations } from './resolvers/match.mutations';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [MatchResolver, MatchQueries, MatchFields, MatchMutations],
})
export class MatchModule {}
