import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { PlayerResolver } from './player.resolver';
import { ConfigModule } from '@nestjs/config';
import { PlayerMutations } from './resolvers/player.mutations';
import { PlayerQueries } from './resolvers/player.queries';
import { PlayerFields } from './resolvers/player.fields';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],

  providers: [PlayerResolver, PlayerMutations, PlayerQueries, PlayerFields],
})
export class PlayerModule {}
