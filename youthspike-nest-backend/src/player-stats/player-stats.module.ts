import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { PlayerStatsResolver } from './player-stats.resolver';

@Module({
  imports: [SharedModule, ConfigModule.forRoot()],
  providers: [PlayerStatsResolver]
})
export class PlayerStatsModule {}

