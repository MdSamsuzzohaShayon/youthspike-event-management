import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { PlayerStatsResolver } from './player-stats.resolver';
import { PlayerStatsQueries } from './resolvers/player-stats.queries';
import { PlayerStatsFields } from './resolvers/player-stats.fields';
import { PlayerStatsMutations } from './resolvers/player-stats.mutations';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [PlayerStatsResolver, PlayerStatsQueries, PlayerStatsFields, PlayerStatsMutations]
})
export class PlayerStatsModule {}

